import { Controller, Get, Query } from '@nestjs/common'
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import { ClassroomDto } from 'src/classrooms/dto/classroom.dto'
import { Serialize } from 'src/interceptors/serialize.interceptor'
import { SubjectDto } from 'src/subjects/dto/subject.dto'
import { TeacherDto } from 'src/teachers/dto/teacher.dto'

import { SectionMeetingDto } from './dto/section-meeting.dto'
import { SectionDto } from './dto/section.dto'
import { SectionFilterDto } from './dto/section-filter.dto'
import { SectionService } from './section.service'

@ApiTags('Sections')
@ApiExtraModels(SectionMeetingDto, SubjectDto, TeacherDto, ClassroomDto)
@Controller({ version: '1', path: 'sections' })
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Get()
  @Serialize(SectionDto)
  @ApiOperation({ summary: 'List sections with schedule details' })
  @ApiOkResponse({ type: SectionDto, isArray: true })
  async findAll(@Query() filter: SectionFilterDto) {
    const data = await this.sectionService.findAll(filter)
    return { data }
  }
}
