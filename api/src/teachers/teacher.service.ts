import { Injectable } from '@nestjs/common'

import { PrismaService } from 'src/prisma/prisma.service'
import { TeacherFlattened } from 'src/types/service-types'

import { TeacherFilterDto } from './dto/teacher-filter.dto'

@Injectable()
export class TeacherService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: TeacherFilterDto): Promise<TeacherFlattened[]> {
    const teachers = await this.prisma.teacher.findMany({
      include: { user: true },
      where: {
        user: {
          ...(filter.email ? { email: { contains: filter.email, mode: 'insensitive' } } : {}),
          ...(filter.name
            ? {
                OR: [
                  { firstName: { contains: filter.name, mode: 'insensitive' } },
                  { lastName: { contains: filter.name, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
      },
      orderBy: [{ user: { lastName: 'asc' } }, { user: { firstName: 'asc' } }],
    })

    // Flatten to match TeacherDto shape
    return teachers.map(t => ({
      id: t.userId,
      firstName: t.user.firstName,
      lastName: t.user.lastName,
      email: t.user.email,
    }))
  }
}
