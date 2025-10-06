import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'

import { SectionDto } from 'src/sections/dto/section.dto'

import { StudentDto } from './student.dto'

export class StudentScheduleDto {
  @ApiProperty({ type: () => StudentDto })
  @Expose()
  @Type(() => StudentDto)
  student: StudentDto

  @ApiProperty({ type: () => SectionDto, isArray: true })
  @Expose()
  @Type(() => SectionDto)
  sections: SectionDto[]
}
