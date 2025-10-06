import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength } from 'class-validator'

export class TeacherFilterDto {
  @ApiPropertyOptional({ description: 'Match a teacher by email address' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string

  @ApiPropertyOptional({ description: 'Filter by name (matches first or last name, case insensitive)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string
}
