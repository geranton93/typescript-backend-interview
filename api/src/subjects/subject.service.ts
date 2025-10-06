import { Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from 'src/prisma/prisma.service'
import { SubjectData } from 'src/types/service-types'

import { SubjectFilterDto } from './dto/subject-filter.dto'

@Injectable()
export class SubjectService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: SubjectFilterDto): Promise<SubjectData[]> {
    const subjects = await this.prisma.subject.findMany({
      where: {
        ...(filter.code ? { code: { contains: filter.code, mode: 'insensitive' } } : {}),
        ...(filter.title ? { title: { contains: filter.title, mode: 'insensitive' } } : {}),
      },
      orderBy: [{ code: 'asc' }],
    })

    return subjects.map(subject => ({
      id: subject.id,
      code: subject.code,
      title: subject.title,
      description: subject.description,
    }))
  }

  async findOne(subjectId: string): Promise<SubjectData> {
    const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } })

    if (!subject) {
      throw new NotFoundException(`Subject ${subjectId} was not found`)
    }

    return {
      id: subject.id,
      code: subject.code,
      title: subject.title,
      description: subject.description,
    }
  }
}
