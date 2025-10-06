import { ApiProperty } from '@nestjs/swagger'
import { Expose, Transform } from 'class-transformer'

export class TeacherDto {
  @ApiProperty({ example: 'f3a6c004-1d1a-4d67-a2c2-1c5f9ed05b71' })
  @Expose()
  id: string

  @ApiProperty({ example: 'Jiayi' })
  @Expose()
  firstName: string

  @ApiProperty({ example: 'Chen' })
  @Expose()
  lastName: string

  @ApiProperty({ example: 'jiayi.chen@example.edu' })
  @Expose()
  email: string

  @ApiProperty({ example: 'Jiayi Chen' })
  @Expose()
  @Transform(({ obj }) => `${obj.firstName} ${obj.lastName}`.trim())
  fullName: string
}
