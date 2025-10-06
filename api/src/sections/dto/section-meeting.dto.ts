import { ApiProperty } from '@nestjs/swagger'
import { DayOfWeek } from '@prisma/client'
import { Expose, Transform } from 'class-transformer'
import { formatTime } from '../../utils'

export class SectionMeetingDto {
  @ApiProperty({ enum: DayOfWeek })
  @Expose()
  day: DayOfWeek

  @ApiProperty({ example: '08:00' })
  @Expose()
  @Transform(({ value }) => formatTime(value))
  startTime: string

  @ApiProperty({ example: '08:50' })
  @Expose()
  @Transform(({ value }) => formatTime(value))
  endTime: string
}
