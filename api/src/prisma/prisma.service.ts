import { INestApplication, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaClient } from '@prisma/client'

import type { AppConfigType } from 'src/config'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly configService: ConfigService<AppConfigType>) {
    super({
      datasources: {
        db: {
          url: configService.get<AppConfigType['database']>('database')?.url,
        },
      },
    })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }

  async enableShutdownHooks(app: INestApplication) {
    app.enableShutdownHooks()

    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']

    signals.forEach(signal => {
      process.once(signal, async () => {
        await app.close()
      })
    })
  }
}
