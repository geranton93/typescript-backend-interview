import { Controller, Get, Query } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import { Serialize } from 'src/interceptors/serialize.interceptor'

import { SubjectService } from './subject.service'
import { SubjectDto } from './dto/subject.dto'
import { SubjectFilterDto } from './dto/subject-filter.dto'

@ApiTags('Subjects')
@Controller({ version: '1', path: 'subjects' })
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Get()
  @Serialize(SubjectDto)
  @ApiOperation({ summary: 'List subjects' })
  @ApiOkResponse({ type: SubjectDto, isArray: true })
  async findAll(@Query() filter: SubjectFilterDto) {
    const data = await this.subjectService.findAll(filter)
    return { data }
  }
}
