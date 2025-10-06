import { Logger, ValidationPipe, VersioningType } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { NextFunction, Request, Response } from 'express'
import helmet from 'helmet'
import { json, urlencoded } from 'express'

import { AppModule } from './app.module'
import type { AppConfigType } from './config'
import { PrismaService } from './prisma/prisma.service'

async function bootstrap() {
  const logger = new Logger('bootstrap')
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: process.env.NODE_ENV === 'development' ? ['debug', 'error', 'log', 'verbose', 'warn'] : ['error', 'warn'],
  })

  // Security headers
  app.use(helmet())

  // Request size limits
  app.use(json({ limit: '10mb' }))
  app.use(urlencoded({ extended: true, limit: '10mb' }))

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  app.enableVersioning({ type: VersioningType.URI })
  app.setGlobalPrefix('api')

  const swaggerConfig = new DocumentBuilder()
    .setTitle('University Scheduling API')
    .setDescription('Endpoints for managing students, sections, and scheduling constraints.')
    .setVersion('1.0.0')
    .build()

  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  })

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.removeHeader('x-powered-by')
    res.removeHeader('date')
    next()
  })

  const configService: ConfigService<AppConfigType> = app.get(ConfigService)
  const { apiPort } = configService.get<AppConfigType['api']>('api')!

  app.enableCors({
    origin: '*',
    credentials: true,
    exposedHeaders: ['Authorization', 'Authorization-Refresh'],
  })

  const prismaService = app.get(PrismaService)
  await prismaService.enableShutdownHooks(app)

  await app.listen(apiPort, '0.0.0.0')
  logger.log(`Application is running on: ${await app.getUrl()}`)
}

bootstrap()
