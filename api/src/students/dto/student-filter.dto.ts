import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator'
import { PaginationDto } from 'src/common/dto/pagination.dto'

export class StudentFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Match by student email' })
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @MaxLength(100)
  email?: string

  @ApiPropertyOptional({ description: 'Search within first and last names' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string
}
