import { ApiProperty } from '@nestjs/swagger'
import { IsUUID } from 'class-validator'

export class EnrollSectionDto {
  @ApiProperty({ description: 'Identifier of the section to enroll the student in', format: 'uuid' })
  @IsUUID()
  sectionId: string
}
