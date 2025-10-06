import { Injectable, NotFoundException } from '@nestjs/common'
import { Subject } from '@prisma/client'

import { PrismaService } from 'src/prisma/prisma.service'

import { SubjectFilterDto } from './dto/subject-filter.dto'

@Injectable()
export class SubjectService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: SubjectFilterDto): Promise<Subject[]> {
    return this.prisma.subject.findMany({
      where: {
        ...(filter.code ? { code: { contains: filter.code, mode: 'insensitive' } } : {}),
        ...(filter.title ? { title: { contains: filter.title, mode: 'insensitive' } } : {}),
      },
      orderBy: [{ code: 'asc' }],
    })
  }

  async findOne(subjectId: string): Promise<Subject> {
    const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } })

    if (!subject) {
      throw new NotFoundException(`Subject ${subjectId} was not found`)
    }

    return subject
  }
}
