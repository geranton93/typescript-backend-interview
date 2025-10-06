import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { TerminusModule } from '@nestjs/terminus'

import config from './config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ClassroomModule } from './classrooms/classroom.module'
import { PrismaModule } from './prisma/prisma.module'
import { SectionModule } from './sections/section.module'
import { StudentModule } from './students/student.module'
import { SubjectModule } from './subjects/subject.module'
import { TeacherModule } from './teachers/teacher.module'
import { UserModule } from './user/user.module'
import { HealthModule } from './health/health.module'

@Module({
  imports: [
    SubjectModule,
    TeacherModule,
    ClassroomModule,
    SectionModule,
    StudentModule,
    UserModule,
    PrismaModule,
    HealthModule,
    TerminusModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute
      },
    ]),
    ConfigModule.forRoot({
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env', `.env.${process.env.NODE_ENV}.local`, '.env.local'],
      isGlobal: true,
      load: [config],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
