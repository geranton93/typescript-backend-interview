import { Test, TestingModule } from '@nestjs/testing'
import { StudentService } from './student.service'
import { PrismaService } from '../prisma/prisma.service'
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import { DayOfWeek, UserRole } from '../common/enums'

describe('StudentService', () => {
  let service: StudentService

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    section: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    enrollment: {
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  }

  const mockStudent = {
    id: 'student-1',
    email: 'alice@example.edu',
    firstName: 'Alice',
    lastName: 'Johnson',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockSection = {
    id: 'section-1',
    code: 'CHEM101-01',
    capacity: 30,
    subjectId: 'subject-1',
    teacherId: 'teacher-1',
    classroomId: 'classroom-1',
    subject: { id: 'subject-1', code: 'CHEM101', title: 'General Chemistry 1' },
    teacher: {
      userId: 'teacher-1',
      user: {
        id: 'teacher-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.edu',
      },
    },
    classroom: { id: 'classroom-1', name: 'Science Lab', building: 'Science', room: '101' },
    meetings: [
      {
        id: 'meeting-1',
        sectionId: 'section-1',
        day: DayOfWeek.MONDAY,
        startTime: new Date('1970-01-01T08:00:00.000Z'),
        endTime: new Date('1970-01-01T08:50:00.000Z'),
      },
    ],
    _count: { enrollments: 10 },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    service = module.get<StudentService>(StudentService)

    // Reset all mocks
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    it('should return paginated students', async () => {
      const students = [mockStudent]
      mockPrismaService.user.findMany.mockResolvedValue(students)
      mockPrismaService.user.count.mockResolvedValue(1)

      const result = await service.findAll({ page: 1, limit: 50 })

      expect(result.data).toEqual([
        {
          id: mockStudent.id,
          email: mockStudent.email,
          firstName: mockStudent.firstName,
          lastName: mockStudent.lastName,
        },
      ])
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      })
    })

    it('should filter by email', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockStudent])
      mockPrismaService.user.count.mockResolvedValue(1)

      await service.findAll({ page: 1, limit: 50, email: 'alice@example.edu' })

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: UserRole.STUDENT,
            email: { contains: 'alice@example.edu', mode: 'insensitive' },
          }),
        }),
      )
    })

    it('should filter by name', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockStudent])
      mockPrismaService.user.count.mockResolvedValue(1)

      await service.findAll({ page: 1, limit: 50, name: 'Alice' })

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: UserRole.STUDENT,
            OR: expect.arrayContaining([
              { firstName: { contains: 'Alice', mode: 'insensitive' } },
              { lastName: { contains: 'Alice', mode: 'insensitive' } },
            ]),
          }),
        }),
      )
    })

    it('should calculate pagination metadata correctly', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockStudent])
      mockPrismaService.user.count.mockResolvedValue(150)

      const result = await service.findAll({ page: 2, limit: 50 })

      expect(result.meta.totalPages).toBe(3)
      expect(result.meta.hasNextPage).toBe(true)
      expect(result.meta.hasPreviousPage).toBe(true)
    })
  })

  describe('findOne', () => {
    it('should return a student by id', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockStudent)

      const result = await service.findOne('student-1')

      expect(result).toEqual({
        id: mockStudent.id,
        email: mockStudent.email,
        firstName: mockStudent.firstName,
        lastName: mockStudent.lastName,
      })
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'student-1', role: UserRole.STUDENT },
      })
    })

    it('should throw NotFoundException when student not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null)

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException)
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'Cannot find student: Student with ID nonexistent does not exist',
      )
    })
  })

  describe('enroll', () => {
    it('should successfully enroll a student in a section', async () => {
      const mockTransaction = jest.fn(async callback => {
        const tx = {
          user: { findFirst: jest.fn().mockResolvedValue(mockStudent) },
          section: { findUnique: jest.fn().mockResolvedValue(mockSection), findMany: jest.fn().mockResolvedValue([]) },
          enrollment: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn() },
        }
        return callback(tx)
      })

      mockPrismaService.$transaction.mockImplementation(mockTransaction)
      mockPrismaService.user.findFirst.mockResolvedValue(mockStudent)
      mockPrismaService.section.findMany.mockResolvedValue([
        {
          ...mockSection,
          enrollments: [{ studentId: 'student-1', sectionId: 'section-1' }],
        },
      ])

      const result = await service.enroll('student-1', { sectionId: 'section-1' })

      expect(result).toBeDefined()
      expect(mockPrismaService.$transaction).toHaveBeenCalled()
    })

    it('should throw NotFoundException when student does not exist', async () => {
      const mockTransaction = jest.fn(async callback => {
        const tx = {
          user: { findFirst: jest.fn().mockResolvedValue(null) },
        }
        return callback(tx)
      })

      mockPrismaService.$transaction.mockImplementation(mockTransaction)

      await expect(service.enroll('nonexistent', { sectionId: 'section-1' })).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException when section does not exist', async () => {
      const mockTransaction = jest.fn(async callback => {
        const tx = {
          user: { findFirst: jest.fn().mockResolvedValue(mockStudent) },
          section: { findUnique: jest.fn().mockResolvedValue(null) },
        }
        return callback(tx)
      })

      mockPrismaService.$transaction.mockImplementation(mockTransaction)

      await expect(service.enroll('student-1', { sectionId: 'nonexistent' })).rejects.toThrow(NotFoundException)
    })

    it('should throw ConflictException when student is already enrolled', async () => {
      const existingEnrollment = { id: 'enrollment-1', studentId: 'student-1', sectionId: 'section-1' }

      const mockTransaction = jest.fn(async callback => {
        const tx = {
          user: { findFirst: jest.fn().mockResolvedValue(mockStudent) },
          section: { findUnique: jest.fn().mockResolvedValue(mockSection) },
          enrollment: { findUnique: jest.fn().mockResolvedValue(existingEnrollment) },
        }
        return callback(tx)
      })

      mockPrismaService.$transaction.mockImplementation(mockTransaction)

      await expect(service.enroll('student-1', { sectionId: 'section-1' })).rejects.toThrow(ConflictException)
      await expect(service.enroll('student-1', { sectionId: 'section-1' })).rejects.toThrow(/already enrolled/)
    })

    it('should throw ConflictException when section is at full capacity', async () => {
      const fullSection = {
        ...mockSection,
        capacity: 10,
        _count: { enrollments: 10 },
      }

      const mockTransaction = jest.fn(async callback => {
        const tx = {
          user: { findFirst: jest.fn().mockResolvedValue(mockStudent) },
          section: { findUnique: jest.fn().mockResolvedValue(fullSection), findMany: jest.fn().mockResolvedValue([]) },
          enrollment: { findUnique: jest.fn().mockResolvedValue(null) },
        }
        return callback(tx)
      })

      mockPrismaService.$transaction.mockImplementation(mockTransaction)

      await expect(service.enroll('student-1', { sectionId: 'section-1' })).rejects.toThrow(ConflictException)
      await expect(service.enroll('student-1', { sectionId: 'section-1' })).rejects.toThrow(/full capacity/)
    })

    it('should throw ConflictException when there is a time conflict', async () => {
      const conflictingSection = {
        id: 'section-2',
        code: 'MATH101-01',
        subject: { title: 'Calculus 1' },
        meetings: [
          {
            day: DayOfWeek.MONDAY,
            startTime: new Date('1970-01-01T08:30:00.000Z'),
            endTime: new Date('1970-01-01T09:20:00.000Z'),
          },
        ],
      }

      const mockTransaction = jest.fn(async callback => {
        const tx = {
          user: { findFirst: jest.fn().mockResolvedValue(mockStudent) },
          section: {
            findUnique: jest.fn().mockResolvedValue(mockSection),
            findMany: jest.fn().mockResolvedValue([conflictingSection]),
          },
          enrollment: { findUnique: jest.fn().mockResolvedValue(null) },
        }
        return callback(tx)
      })

      mockPrismaService.$transaction.mockImplementation(mockTransaction)

      await expect(service.enroll('student-1', { sectionId: 'section-1' })).rejects.toThrow(ConflictException)
      await expect(service.enroll('student-1', { sectionId: 'section-1' })).rejects.toThrow(/conflicts/)
    })

    it('should allow enrollment when sections are on different days', async () => {
      const nonConflictingSection = {
        id: 'section-2',
        code: 'MATH101-01',
        subject: { title: 'Calculus 1' },
        meetings: [
          {
            day: DayOfWeek.TUESDAY,
            startTime: new Date('1970-01-01T08:00:00.000Z'),
            endTime: new Date('1970-01-01T08:50:00.000Z'),
          },
        ],
      }

      const mockTransaction = jest.fn(async callback => {
        const tx = {
          user: { findFirst: jest.fn().mockResolvedValue(mockStudent) },
          section: {
            findUnique: jest.fn().mockResolvedValue(mockSection),
            findMany: jest.fn().mockResolvedValue([nonConflictingSection]),
          },
          enrollment: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn() },
        }
        return callback(tx)
      })

      mockPrismaService.$transaction.mockImplementation(mockTransaction)
      mockPrismaService.user.findFirst.mockResolvedValue(mockStudent)
      mockPrismaService.section.findMany.mockResolvedValue([
        {
          ...mockSection,
          enrollments: [{ studentId: 'student-1', sectionId: 'section-1' }],
        },
      ])

      const result = await service.enroll('student-1', { sectionId: 'section-1' })

      expect(result).toBeDefined()
    })

    it('should allow enrollment when sections do not overlap in time', async () => {
      const nonConflictingSection = {
        id: 'section-2',
        code: 'MATH101-01',
        subject: { title: 'Calculus 1' },
        meetings: [
          {
            day: DayOfWeek.MONDAY,
            startTime: new Date('1970-01-01T09:00:00.000Z'),
            endTime: new Date('1970-01-01T09:50:00.000Z'),
          },
        ],
      }

      const mockTransaction = jest.fn(async callback => {
        const tx = {
          user: { findFirst: jest.fn().mockResolvedValue(mockStudent) },
          section: {
            findUnique: jest.fn().mockResolvedValue(mockSection),
            findMany: jest.fn().mockResolvedValue([nonConflictingSection]),
          },
          enrollment: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn() },
        }
        return callback(tx)
      })

      mockPrismaService.$transaction.mockImplementation(mockTransaction)
      mockPrismaService.user.findFirst.mockResolvedValue(mockStudent)
      mockPrismaService.section.findMany.mockResolvedValue([
        {
          ...mockSection,
          enrollments: [{ studentId: 'student-1', sectionId: 'section-1' }],
        },
      ])

      const result = await service.enroll('student-1', { sectionId: 'section-1' })

      expect(result).toBeDefined()
    })
  })

  describe('drop', () => {
    it('should successfully drop a student from a section', async () => {
      const enrollment = {
        id: 'enrollment-1',
        studentId: 'student-1',
        sectionId: 'section-1',
        section: { code: 'CHEM101-01', subject: { title: 'General Chemistry 1' } },
      }

      mockPrismaService.user.findFirst.mockResolvedValue(mockStudent)
      mockPrismaService.enrollment.findUnique.mockResolvedValue(enrollment)
      mockPrismaService.enrollment.delete.mockResolvedValue(enrollment)
      mockPrismaService.section.findMany.mockResolvedValue([])

      const result = await service.drop('student-1', 'section-1')

      expect(result).toBeDefined()
      expect(mockPrismaService.enrollment.delete).toHaveBeenCalledWith({ where: { id: 'enrollment-1' } })
    })

    it('should throw NotFoundException when enrollment does not exist', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockStudent)
      mockPrismaService.enrollment.findUnique.mockResolvedValue(null)

      await expect(service.drop('student-1', 'section-1')).rejects.toThrow(NotFoundException)
      await expect(service.drop('student-1', 'section-1')).rejects.toThrow(/not enrolled/)
    })
  })

  describe('exportSchedulePdf', () => {
    it('should throw BadRequestException when student has no enrollments', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockStudent)
      mockPrismaService.section.findMany.mockResolvedValue([])

      await expect(service.exportSchedulePdf('student-1')).rejects.toThrow(BadRequestException)
      await expect(service.exportSchedulePdf('student-1')).rejects.toThrow(/No enrolled sections/)
    })

    it('should generate PDF when student has enrollments', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockStudent)
      mockPrismaService.section.findMany.mockResolvedValue([mockSection])

      const result = await service.exportSchedulePdf('student-1')

      expect(result).toBeDefined()
      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.fileName).toContain('schedule-johnson-alice.pdf')
    })
  })

  describe('getSchedule', () => {
    it('should return student schedule with sections', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockStudent)
      mockPrismaService.section.findMany.mockResolvedValue([mockSection])

      const result = await service.getSchedule('student-1')

      expect(result.student).toEqual({
        id: mockStudent.id,
        email: mockStudent.email,
        firstName: mockStudent.firstName,
        lastName: mockStudent.lastName,
      })
      // Expect flattened teacher structure
      const expectedSection = {
        ...mockSection,
        teacher: {
          id: 'teacher-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.edu',
        },
      }
      expect(result.sections).toEqual([expectedSection])
    })
  })
})
