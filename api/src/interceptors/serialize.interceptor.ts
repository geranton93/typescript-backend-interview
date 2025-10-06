import { UseInterceptors, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { plainToInstance } from 'class-transformer'

type ClassConstructor<T = object> = new (...args: unknown[]) => T

interface ApiResponse<T = unknown> {
  data: T | T[]
  [key: string]: unknown
}

export class SerializeInterceptor<T extends object> implements NestInterceptor<unknown, ApiResponse<T>> {
  constructor(private dto: ClassConstructor<T>) {}

  intercept(context: ExecutionContext, handler: CallHandler): Observable<ApiResponse<T>> {
    return handler.handle().pipe(
      map((response: ApiResponse<unknown>) => {
        if (Array.isArray(response.data)) {
          return {
            ...response,
            data: response.data.map(data => {
              return plainToInstance(this.dto, data, {
                excludeExtraneousValues: true,
              })
            }),
          }
        }

        return {
          ...response,
          data: plainToInstance(this.dto, response.data, {
            excludeExtraneousValues: true,
          }),
        }
      }),
    )
  }
}

export function Serialize<T extends object>(dto: ClassConstructor<T>) {
  return UseInterceptors(new SerializeInterceptor(dto))
}
