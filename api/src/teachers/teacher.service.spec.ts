import { Test, TestingModule } from '@nestjs/testing'
import { TeacherService } from './teacher.service'
import { PrismaService } from '../prisma/prisma.service'

describe('TeacherService', () => {
  let service: TeacherService

  const mockPrismaService = {
    teacher: {
      findMany: jest.fn(),
    },
  }

  const mockTeacherRow = {
    userId: 'teacher-1',
    user: {
      email: 'john.doe@example.edu',
      firstName: 'John',
      lastName: 'Doe',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    service = module.get<TeacherService>(TeacherService)
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    it('should return all teachers without filters', async () => {
      const teachers = [mockTeacherRow]
      mockPrismaService.teacher.findMany.mockResolvedValue(teachers)

      const result = await service.findAll({})

      expect(result).toEqual([{ id: 'teacher-1', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.edu' }])
      expect(mockPrismaService.teacher.findMany).toHaveBeenCalledWith({
        include: { user: true },
        where: { user: {} },
        orderBy: [{ user: { lastName: 'asc' } }, { user: { firstName: 'asc' } }],
      })
    })

    it('should filter teachers by email', async () => {
      mockPrismaService.teacher.findMany.mockResolvedValue([mockTeacherRow])

      await service.findAll({ email: 'john.doe@example.edu' })

      expect(mockPrismaService.teacher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: expect.objectContaining({ email: { contains: 'john.doe@example.edu', mode: 'insensitive' } }),
          }),
        }),
      )
    })

    it('should filter teachers by name', async () => {
      mockPrismaService.teacher.findMany.mockResolvedValue([mockTeacherRow])

      await service.findAll({ name: 'John' })

      expect(mockPrismaService.teacher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: expect.objectContaining({
              OR: expect.arrayContaining([
                { firstName: { contains: 'John', mode: 'insensitive' } },
                { lastName: { contains: 'John', mode: 'insensitive' } },
              ]),
            }),
          }),
        }),
      )
    })

    it('should return teachers ordered by last name then first name', async () => {
      mockPrismaService.teacher.findMany.mockResolvedValue([mockTeacherRow])

      await service.findAll({})

      expect(mockPrismaService.teacher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ user: { lastName: 'asc' } }, { user: { firstName: 'asc' } }],
        }),
      )
    })

    it('should combine email and name filters', async () => {
      mockPrismaService.teacher.findMany.mockResolvedValue([mockTeacherRow])

      await service.findAll({ email: 'john', name: 'Doe' })

      expect(mockPrismaService.teacher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: expect.objectContaining({
              email: { contains: 'john', mode: 'insensitive' },
              OR: expect.any(Array),
            }),
          }),
        }),
      )
    })
  })
})
