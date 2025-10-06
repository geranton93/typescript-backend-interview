import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common'
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger'
import { Response } from 'express'

import { ClassroomDto } from 'src/classrooms/dto/classroom.dto'
import { Serialize } from 'src/interceptors/serialize.interceptor'
import { SectionMeetingDto } from 'src/sections/dto/section-meeting.dto'
import { SectionDto } from 'src/sections/dto/section.dto'
import { SubjectDto } from 'src/subjects/dto/subject.dto'
import { TeacherDto } from 'src/teachers/dto/teacher.dto'
import { createPaginatedResponseDto } from 'src/common/dto/paginated-response.dto'

import { EnrollSectionDto } from './dto/enroll-section.dto'
import { StudentFilterDto } from './dto/student-filter.dto'
import { StudentScheduleDto } from './dto/student-schedule.dto'
import { StudentDto } from './dto/student.dto'
import { StudentService } from './student.service'

const PaginatedStudentDto = createPaginatedResponseDto(StudentDto)

@ApiTags('Students')
@ApiExtraModels(StudentScheduleDto, StudentDto, SectionDto, SectionMeetingDto, SubjectDto, TeacherDto, ClassroomDto)
@Controller({ version: '1', path: 'students' })
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get()
  @Serialize(PaginatedStudentDto)
  @ApiOperation({ summary: 'List students' })
  @ApiOkResponse({ type: PaginatedStudentDto })
  async findAll(@Query() filter: StudentFilterDto) {
    const data = await this.studentService.findAll(filter)
    return { data }
  }

  @Get(':studentId')
  @Serialize(StudentDto)
  @ApiOperation({ summary: 'Retrieve a student by identifier' })
  @ApiOkResponse({ type: StudentDto })
  async findOne(@Param('studentId', new ParseUUIDPipe()) studentId: string) {
    const data = await this.studentService.findOne(studentId)
    return { data }
  }

  @Get(':studentId/schedule')
  @Serialize(StudentScheduleDto)
  @ApiOperation({ summary: 'Retrieve a student schedule with enrolled sections' })
  @ApiOkResponse({ type: StudentScheduleDto })
  async getSchedule(@Param('studentId', new ParseUUIDPipe()) studentId: string) {
    const data = await this.studentService.getSchedule(studentId)
    return { data }
  }

  @Post(':studentId/schedule')
  @Serialize(StudentScheduleDto)
  @ApiOperation({ summary: 'Enroll a student into a section respecting schedule constraints' })
  @ApiOkResponse({ type: StudentScheduleDto })
  async enroll(@Param('studentId', new ParseUUIDPipe()) studentId: string, @Body() payload: EnrollSectionDto) {
    const data = await this.studentService.enroll(studentId, payload)
    return { data }
  }

  @Delete(':studentId/schedule/:sectionId')
  @Serialize(StudentScheduleDto)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a section from the student schedule' })
  @ApiOkResponse({ type: StudentScheduleDto })
  async drop(
    @Param('studentId', new ParseUUIDPipe()) studentId: string,
    @Param('sectionId', new ParseUUIDPipe()) sectionId: string,
  ) {
    const data = await this.studentService.drop(studentId, sectionId)
    return { data }
  }

  @Get(':studentId/schedule/pdf')
  @ApiOperation({ summary: 'Download the student schedule as a PDF document' })
  @ApiProduces('application/pdf')
  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  async downloadPdf(@Param('studentId', new ParseUUIDPipe()) studentId: string, @Res() res: Response) {
    const { buffer, fileName } = await this.studentService.exportSchedulePdf(studentId)

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length,
    })

    res.send(buffer)
  }
}
