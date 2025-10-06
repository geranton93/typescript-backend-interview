import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { User } from '@prisma/client'
import PDFDocument = require('pdfkit')
import { DayOfWeek, UserRole } from 'src/common/enums'

import { PrismaService } from 'src/prisma/prisma.service'
import {
  PaginatedResult,
  StudentSchedule,
  PDFExportResult,
  MeetingGroup,
  PrismaTransactionClient,
  SectionForConflictCheck,
  SectionWithRelations,
  SectionFlattened,
  TeacherFlattened,
} from 'src/types/service-types'

import { EnrollSectionDto } from './dto/enroll-section.dto'
import { StudentFilterDto } from './dto/student-filter.dto'

const extractTimeMinutes = (value: Date) => value.getUTCHours() * 60 + value.getUTCMinutes()

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name)

  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: StudentFilterDto): Promise<PaginatedResult<User>> {
    this.logger.debug(`Finding all students with filters: ${JSON.stringify(filter)}`)

    const { page = 1, limit = 50, ...filterOptions } = filter
    const skip = (page - 1) * limit

    const where = {
      ...(filterOptions.email ? { email: { contains: filterOptions.email, mode: 'insensitive' as const } } : {}),
      ...(filterOptions.name
        ? {
            OR: [
              { firstName: { contains: filterOptions.name, mode: 'insensitive' as const } },
              { lastName: { contains: filterOptions.name, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { ...where, role: UserRole.STUDENT },
        skip,
        take: limit,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      }),
      this.prisma.user.count({ where: { ...where, role: UserRole.STUDENT } }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    }
  }

  async findOne(studentId: string): Promise<User> {
    this.logger.debug(`Finding student: ${studentId}`)
    const student = await this.prisma.user.findFirst({
      where: { id: studentId, role: UserRole.STUDENT },
    })

    if (!student) {
      this.logger.warn(`Student not found: ${studentId}`)
      throw new NotFoundException(`Cannot find student: Student with ID ${studentId} does not exist`)
    }

    return student
  }

  async getSchedule(studentId: string): Promise<StudentSchedule> {
    const student = await this.findOne(studentId)

    const rawSections = (await this.prisma.section.findMany({
      where: {
        enrollments: {
          some: { studentId },
        },
      },
      include: {
        subject: true,
        teacher: { include: { user: true } },
        classroom: true,
        meetings: {
          orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
        },
      },
      orderBy: [{ code: 'asc' }],
    })) as SectionWithRelations[]

    // Flatten teacher.user into teacher to keep API shape stable
    const sections: SectionFlattened[] = rawSections.map(section => {
      const teacher: TeacherFlattened = {
        id: section.teacher.userId,
        firstName: section.teacher.user.firstName,
        lastName: section.teacher.user.lastName,
        email: section.teacher.user.email,
      }
      return { ...section, teacher }
    })

    return { student, sections }
  }

  async enroll(studentId: string, payload: EnrollSectionDto): Promise<StudentSchedule> {
    this.logger.log(`Enrolling student ${studentId} in section ${payload.sectionId}`)

    try {
      // Use transaction to ensure atomicity
      await this.prisma.$transaction(async tx => {
        // Verify student exists
        const student = await tx.user.findFirst({
          where: { id: studentId, role: UserRole.STUDENT },
        })
        if (!student) {
          throw new NotFoundException(`Cannot enroll: Student with ID ${studentId} does not exist`)
        }

        // Get section with all needed information
        const section = await tx.section.findUnique({
          where: { id: payload.sectionId },
          include: {
            subject: true,
            teacher: true,
            classroom: true,
            meetings: true,
            _count: { select: { enrollments: true } },
          },
        })

        if (!section) {
          throw new NotFoundException(`Cannot enroll: Section with ID ${payload.sectionId} does not exist`)
        }

        // Check if already enrolled
        const alreadyEnrolled = await tx.enrollment.findUnique({
          where: {
            studentId_sectionId: {
              studentId,
              sectionId: section.id,
            },
          },
        })

        if (alreadyEnrolled) {
          throw new ConflictException(
            `Student is already enrolled in section ${section.code} (${section.subject.title})`,
          )
        }

        // Check for schedule conflicts
        await this.ensureNoConflictingEnrollment(tx, studentId, section as any)

        // Check capacity (atomic check within transaction)
        if (section.capacity != null && section._count.enrollments >= section.capacity) {
          throw new ConflictException(
            `Cannot enroll: Section ${section.code} is at full capacity (${section.capacity}/${section.capacity} enrolled)`,
          )
        }

        // Create enrollment
        await tx.enrollment.create({
          data: {
            studentId,
            sectionId: section.id,
          },
        })

        this.logger.log(`Successfully enrolled student ${studentId} in section ${section.code}`)
        return true
      })

      return this.getSchedule(studentId)
    } catch (error) {
      this.logger.error(`Enrollment failed for student ${studentId}: ${error.message}`, error.stack)
      throw error
    }
  }

  async drop(studentId: string, sectionId: string): Promise<StudentSchedule> {
    this.logger.log(`Dropping student ${studentId} from section ${sectionId}`)

    try {
      await this.findOne(studentId)

      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          studentId_sectionId: {
            studentId,
            sectionId,
          },
        },
        include: {
          section: {
            include: {
              subject: true,
            },
          },
        },
      })

      if (!enrollment) {
        throw new NotFoundException(`Cannot drop: Student is not enrolled in section ${sectionId}`)
      }

      await this.prisma.enrollment.delete({ where: { id: enrollment.id } })

      this.logger.log(`Successfully dropped student ${studentId} from section ${enrollment.section.code}`)

      return this.getSchedule(studentId)
    } catch (error) {
      this.logger.error(`Drop failed for student ${studentId}: ${error.message}`, error.stack)
      throw error
    }
  }

  async exportSchedulePdf(studentId: string): Promise<PDFExportResult> {
    this.logger.log(`Generating PDF schedule for student ${studentId}`)

    try {
      const { student, sections } = await this.getSchedule(studentId)

      if (sections.length === 0) {
        this.logger.warn(`Cannot generate PDF: Student ${studentId} has no enrolled sections`)
        throw new BadRequestException('Cannot generate PDF: No enrolled sections found for this student')
      }

      const document = new PDFDocument({
        margin: 40,
        info: { Title: `${student.firstName} ${student.lastName} Schedule` },
      })
      const chunks: Buffer[] = []

      document.on('data', chunk => chunks.push(chunk))

      const fileName = `schedule-${student.lastName.toLowerCase()}-${student.firstName.toLowerCase()}.pdf`

      document.fontSize(22).text('Student Schedule', { align: 'center' })
      document.moveDown(0.5)
      document.fontSize(12).text(`Generated: ${new Date().toISOString()}`)
      document.text(`Student: ${student.firstName} ${student.lastName} (${student.email})`)
      document.moveDown()

      sections.forEach(section => {
        document.fontSize(14).text(section.code)
        document.fontSize(12)
        document.text(`Subject: ${section.subject.title} (${section.subject.code})`)
        document.text(`Instructor: ${section.teacher.firstName} ${section.teacher.lastName}`)
        document.text(`Classroom: ${section.classroom.name} - ${section.classroom.building} ${section.classroom.room}`)

        const groupedByDay = this.groupMeetingsByDay(section.meetings as any)
        document.text('Meetings:')
        groupedByDay.forEach(entry => {
          document.text(`  - ${entry.day}: ${entry.slots.join(', ')}`)
        })

        document.moveDown()
      })

      document.end()

      const buffer = await new Promise<Buffer>((resolve, reject) => {
        document.on('end', () => resolve(Buffer.concat(chunks)))
        document.on('error', reject)
      })

      this.logger.log(`Successfully generated PDF schedule for student ${studentId}`)
      return { buffer, fileName }
    } catch (error) {
      this.logger.error(`PDF generation failed for student ${studentId}: ${error.message}`, error.stack)
      throw error
    }
  }

  private async ensureNoConflictingEnrollment(
    tx: PrismaTransactionClient,
    studentId: string,
    newSection: SectionForConflictCheck,
  ): Promise<void> {
    const studentSections = await tx.section.findMany({
      where: {
        enrollments: {
          some: {
            studentId,
          },
        },
        id: {
          not: newSection.id,
        },
      },
      include: {
        subject: true,
        meetings: true,
      },
    })

    for (const meeting of newSection.meetings) {
      const newStart = extractTimeMinutes(meeting.startTime)
      const newEnd = extractTimeMinutes(meeting.endTime)

      for (const section of studentSections) {
        for (const existing of section.meetings) {
          if (existing.day !== meeting.day) {
            continue
          }

          const existingStart = extractTimeMinutes(existing.startTime)
          const existingEnd = extractTimeMinutes(existing.endTime)

          const overlaps = newStart < existingEnd && existingStart < newEnd

          if (overlaps) {
            const dayName = meeting.day.charAt(0) + meeting.day.slice(1).toLowerCase()
            const newTimeRange = `${this.formatTime(meeting.startTime)}-${this.formatTime(meeting.endTime)}`
            const existingTimeRange = `${this.formatTime(existing.startTime)}-${this.formatTime(existing.endTime)}`

            throw new ConflictException(
              `Cannot enroll: Section ${newSection.code} (${newSection.subject.title}) conflicts with ` +
                `${section.code} (${section.subject.title}) on ${dayName}. ` +
                `New section meets ${newTimeRange}, existing section meets ${existingTimeRange}.`,
            )
          }
        }
      }
    }
  }

  private groupMeetingsByDay(meetings: { day: DayOfWeek; startTime: Date; endTime: Date }[]): MeetingGroup[] {
    const byDay = new Map<DayOfWeek, string[]>()

    meetings.forEach(meeting => {
      const day = meeting.day as DayOfWeek
      const slots = byDay.get(day) ?? []
      slots.push(`${this.formatTime(meeting.startTime)} - ${this.formatTime(meeting.endTime)}`)
      byDay.set(day, slots)
    })

    return Array.from(byDay.entries()).map(([day, slots]) => ({ day, slots }))
  }

  private formatTime(date: Date): string {
    return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`
  }
}
