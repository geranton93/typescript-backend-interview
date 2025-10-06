import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength } from 'class-validator'

export class SubjectFilterDto {
  @ApiPropertyOptional({ description: 'Filter by matching subject code (exact or partial)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string

  @ApiPropertyOptional({ description: 'Filter subjects where the title contains this value' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string
}
