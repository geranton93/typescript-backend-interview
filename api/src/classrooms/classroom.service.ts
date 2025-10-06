import { Injectable } from '@nestjs/common'

import { PrismaService } from 'src/prisma/prisma.service'
import { ClassroomData } from 'src/types/service-types'

import { ClassroomFilterDto } from './dto/classroom-filter.dto'

@Injectable()
export class ClassroomService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: ClassroomFilterDto): Promise<ClassroomData[]> {
    const classrooms = await this.prisma.classroom.findMany({
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

    return classrooms.map(classroom => ({
      id: classroom.id,
      name: classroom.name,
      building: classroom.building,
      room: classroom.room,
      capacity: classroom.capacity,
    }))
  }
}
