import { Injectable } from '@nestjs/common'
import { Classroom } from '@prisma/client'

import { PrismaService } from 'src/prisma/prisma.service'

import { ClassroomFilterDto } from './dto/classroom-filter.dto'

@Injectable()
export class ClassroomService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: ClassroomFilterDto): Promise<Classroom[]> {
    return this.prisma.classroom.findMany({
      where: {
        ...(filter.building ? { building: { contains: filter.building, mode: 'insensitive' } } : {}),
        ...(filter.name
          ? {
              OR: [
                { name: { contains: filter.name, mode: 'insensitive' } },
                { room: { contains: filter.name, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ building: 'asc' }, { room: 'asc' }],
    })
  }
}
