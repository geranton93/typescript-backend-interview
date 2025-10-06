import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

export class ClassroomDto {
  @ApiProperty({ example: 'f3a6c004-1d1a-4d67-a2c2-1c5f9ed05b71' })
  @Expose()
  id: string

  @ApiProperty({ example: 'Chemistry Lab A' })
  @Expose()
  name: string

  @ApiProperty({ example: 'Science Center' })
  @Expose()
  building: string

  @ApiProperty({ example: '210' })
  @Expose()
  room: string

  @ApiProperty({ example: 24, required: false })
  @Expose()
  capacity?: number | null
}
