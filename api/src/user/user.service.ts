import { Injectable } from '@nestjs/common'
import { User } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import { FilterUserDto } from './dto/user.dto'

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers(filter: FilterUserDto): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: {
        email: filter.email,
      },
    })

    return users
  }
}
