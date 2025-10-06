import { ApiPropertyOptional } from '@nestjs/swagger'
import { DayOfWeek } from '@prisma/client'
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'

export class SectionFilterDto {
  @ApiPropertyOptional({ description: 'Filter sections by subject identifier', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  subjectId?: string

  @ApiPropertyOptional({ description: 'Filter sections by teacher identifier', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  teacherId?: string

  @ApiPropertyOptional({ description: 'Filter sections by classroom identifier', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  classroomId?: string

  @ApiPropertyOptional({ description: 'Filter sections meeting on a specific day of the week', enum: DayOfWeek })
  @IsOptional()
  @IsEnum(DayOfWeek)
  day?: DayOfWeek

  @ApiPropertyOptional({ description: 'Search by section code', example: 'CHEM101' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string
}
