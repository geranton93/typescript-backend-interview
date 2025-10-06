import { ApiProperty } from '@nestjs/swagger'
import { Expose, Transform, Type } from 'class-transformer'

import { ClassroomDto } from 'src/classrooms/dto/classroom.dto'
import { SubjectDto } from 'src/subjects/dto/subject.dto'
import { TeacherDto } from 'src/teachers/dto/teacher.dto'

import { SectionMeetingDto } from './section-meeting.dto'
import { formatTime } from '../../utils'

export class SectionDto {
  @ApiProperty({ example: 'f3a6c004-1d1a-4d67-a2c2-1c5f9ed05b71' })
  @Expose()
  id: string

  @ApiProperty({ example: 'CHEM101-MWF-0800' })
  @Expose()
  code: string

  @ApiProperty({ example: 24, required: false })
  @Expose()
  capacity?: number | null

  @ApiProperty({ type: () => SubjectDto })
  @Expose()
  @Type(() => SubjectDto)
  subject: SubjectDto

  @ApiProperty({ type: () => TeacherDto })
  @Expose()
  @Type(() => TeacherDto)
  teacher: TeacherDto

  @ApiProperty({ type: () => ClassroomDto })
  @Expose()
  @Type(() => ClassroomDto)
  classroom: ClassroomDto

  @ApiProperty({ type: () => SectionMeetingDto, isArray: true })
  @Expose()
  @Type(() => SectionMeetingDto)
  meetings: SectionMeetingDto[]

  @ApiProperty({ example: '2024-08-01T12:00:00.000Z' })
  @Expose()
  @Transform(({ value }) => formatTime(value))
  createdAt: string

  @ApiProperty({ example: '2024-08-01T12:00:00.000Z' })
  @Expose()
  @Transform(({ value }) => formatTime(value))
  updatedAt: string
}
