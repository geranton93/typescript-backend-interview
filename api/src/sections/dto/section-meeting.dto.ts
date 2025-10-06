import { ApiProperty } from '@nestjs/swagger'
import { Expose, Transform } from 'class-transformer'
import { DayOfWeek } from '../../common/enums'
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
