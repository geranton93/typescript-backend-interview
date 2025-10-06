import { Controller, Get, Query } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import { Serialize } from 'src/interceptors/serialize.interceptor'

import { ClassroomService } from './classroom.service'
import { ClassroomDto } from './dto/classroom.dto'
import { ClassroomFilterDto } from './dto/classroom-filter.dto'

@ApiTags('Classrooms')
@Controller({ version: '1', path: 'classrooms' })
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}

  @Get()
  @Serialize(ClassroomDto)
  @ApiOperation({ summary: 'List classrooms' })
  @ApiOkResponse({ type: ClassroomDto, isArray: true })
  async findAll(@Query() filter: ClassroomFilterDto) {
    const data = await this.classroomService.findAll(filter)
    return { data }
  }
}
