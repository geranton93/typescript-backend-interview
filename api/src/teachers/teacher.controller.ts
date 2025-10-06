import { Controller, Get, Query } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import { Serialize } from 'src/interceptors/serialize.interceptor'

import { TeacherService } from './teacher.service'
import { TeacherDto } from './dto/teacher.dto'
import { TeacherFilterDto } from './dto/teacher-filter.dto'

@ApiTags('Teachers')
@Controller({ version: '1', path: 'teachers' })
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Get()
  @Serialize(TeacherDto)
  @ApiOperation({ summary: 'List teachers' })
  @ApiOkResponse({ type: TeacherDto, isArray: true })
  async findAll(@Query() filter: TeacherFilterDto) {
    const data = await this.teacherService.findAll(filter)
    return { data }
  }
}
