import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { PrismaService } from 'src/prisma/prisma.service'
import { SectionFlattened, SectionWithRelations, TeacherFlattened } from 'src/types/service-types'

import { SectionFilterDto } from './dto/section-filter.dto'

@Injectable()
export class SectionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: SectionFilterDto): Promise<SectionFlattened[]> {
    const where: Prisma.SectionWhereInput = {
      ...(filter.subjectId ? { subjectId: filter.subjectId } : {}),
      ...(filter.teacherId ? { teacherId: filter.teacherId } : {}),
      ...(filter.classroomId ? { classroomId: filter.classroomId } : {}),
      ...(filter.code ? { code: { contains: filter.code, mode: 'insensitive' } } : {}),
      ...(filter.day
        ? {
            meetings: {
              some: {
                day: filter.day,
              },
            },
          }
        : {}),
    }

    const raw = (await this.prisma.section.findMany({
      where,
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

    return raw.map(section => {
      const teacher: TeacherFlattened = {
        id: section.teacher.userId,
        firstName: section.teacher.user.firstName,
        lastName: section.teacher.user.lastName,
        email: section.teacher.user.email,
      }
      return { ...section, teacher }
    })
  }
}
