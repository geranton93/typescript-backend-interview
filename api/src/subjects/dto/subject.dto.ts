import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

export class SubjectDto {
  @ApiProperty({ example: 'f3a6c004-1d1a-4d67-a2c2-1c5f9ed05b71' })
  @Expose()
  id: string

  @ApiProperty({ example: 'CHEM101' })
  @Expose()
  code: string

  @ApiProperty({ example: 'General Chemistry I' })
  @Expose()
  title: string

  @ApiProperty({ example: 'Fundamentals of chemical principles with laboratory.', required: false })
  @Expose()
  description?: string | null
}
