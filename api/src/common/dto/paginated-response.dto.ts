import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'

export class PaginationMetaDto {
  @ApiProperty({ example: 150 })
  @Expose()
  total: number

  @ApiProperty({ example: 1 })
  @Expose()
  page: number

  @ApiProperty({ example: 50 })
  @Expose()
  limit: number

  @ApiProperty({ example: 3 })
  @Expose()
  totalPages: number

  @ApiProperty({ example: true })
  @Expose()
  hasNextPage: boolean

  @ApiProperty({ example: false })
  @Expose()
  hasPreviousPage: boolean
}

export function createPaginatedResponseDto<T>(ItemClass: new () => T) {
  class PaginatedResponseDto {
    @ApiProperty({ type: [ItemClass] })
    @Expose()
    @Type(() => ItemClass)
    data: T[]

    @ApiProperty({ type: PaginationMetaDto })
    @Expose()
    @Type(() => PaginationMetaDto)
    meta: PaginationMetaDto
  }

  return PaginatedResponseDto
}
