import { ApiProperty } from '@nestjs/swagger'
import { Expose, Transform } from 'class-transformer'

export class StudentDto {
  @ApiProperty({ example: 'f3a6c004-1d1a-4d67-a2c2-1c5f9ed05b71' })
  @Expose()
  id: string

  @ApiProperty({ example: 'alice@example.edu' })
  @Expose()
  email: string

  @ApiProperty({ example: 'Alice' })
  @Expose()
  firstName: string

  @ApiProperty({ example: 'Johnson' })
  @Expose()
  lastName: string

  @ApiProperty({ example: 'Alice Johnson' })
  @Expose()
  @Transform(({ obj }) => `${obj.firstName} ${obj.lastName}`.trim())
  fullName: string
}
