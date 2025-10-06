import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength } from 'class-validator'

export class ClassroomFilterDto {
  @ApiPropertyOptional({ description: 'Filter by building name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  building?: string

  @ApiPropertyOptional({ description: 'Filter by classroom name or room number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string
}
