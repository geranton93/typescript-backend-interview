import { Test, TestingModule } from '@nestjs/testing'
import { SectionService } from './section.service'
import { PrismaService } from '../prisma/prisma.service'
import { DayOfWeek, SectionStatus } from '../common/enums'

describe('SectionService', () => {
  let service: SectionService

  const mockPrismaService = {
    section: {
      findMany: jest.fn(),
    },
  }

  const mockSectionDb = {
    id: 'section-1',
    code: 'CHEM101-01',
    capacity: 30,
    status: SectionStatus.ACTIVE,
    term: 'Fall 2024',
    year: 2024,
    startDate: new Date('2024-08-26'),
    endDate: new Date('2024-12-15'),
    subjectId: 'subject-1',
    teacherId: 'teacher-1',
    classroomId: 'classroom-1',
    subject: {
      id: 'subject-1',
      code: 'CHEM101',
      title: 'General Chemistry 1',
    },
    teacher: {
      userId: 'teacher-1',
      user: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.edu',
      },
    },
    classroom: {
      id: 'classroom-1',
      name: 'Science Lab',
      building: 'Science',
      room: '101',
    },
    meetings: [
      {
        id: 'meeting-1',
        sectionId: 'section-1',
        day: DayOfWeek.MONDAY,
        startTime: new Date('1970-01-01T08:00:00.000Z'),
        endTime: new Date('1970-01-01T08:50:00.000Z'),
      },
    ],
  }

  const mockSection = {
    ...mockSectionDb,
    teacher: {
      id: 'teacher-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.edu',
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SectionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    service = module.get<SectionService>(SectionService)
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    it('should return all sections without filters', async () => {
      const sections = [mockSectionDb]
      mockPrismaService.section.findMany.mockResolvedValue(sections)

      const result = await service.findAll({})

      expect(result).toEqual([mockSection])
      expect(mockPrismaService.section.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          subject: true,
          teacher: { include: { user: true } },
          classroom: true,
          meetings: {
            orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
          },
        },
        orderBy: [{ code: 'asc' }],
      })
    })

    it('should filter sections by subjectId', async () => {
      mockPrismaService.section.findMany.mockResolvedValue([mockSectionDb])

      await service.findAll({ subjectId: 'subject-1' })

      expect(mockPrismaService.section.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            subjectId: 'subject-1',
          }),
        }),
      )
    })

    it('should filter sections by teacherId', async () => {
      mockPrismaService.section.findMany.mockResolvedValue([mockSectionDb])

      await service.findAll({ teacherId: 'teacher-1' })

      expect(mockPrismaService.section.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            teacherId: 'teacher-1',
          }),
        }),
      )
    })

    it('should filter sections by classroomId', async () => {
      mockPrismaService.section.findMany.mockResolvedValue([mockSectionDb])

      await service.findAll({ classroomId: 'classroom-1' })

      expect(mockPrismaService.section.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            classroomId: 'classroom-1',
          }),
        }),
      )
    })

    it('should filter sections by code', async () => {
      mockPrismaService.section.findMany.mockResolvedValue([mockSectionDb])

      await service.findAll({ code: 'CHEM101' })

      expect(mockPrismaService.section.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            code: { contains: 'CHEM101', mode: 'insensitive' },
          }),
        }),
      )
    })

    it('should filter sections by day', async () => {
      mockPrismaService.section.findMany.mockResolvedValue([mockSectionDb])

      await service.findAll({ day: DayOfWeek.MONDAY })

      expect(mockPrismaService.section.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            meetings: {
              some: {
                day: DayOfWeek.MONDAY,
              },
            },
          }),
        }),
      )
    })

    it('should combine multiple filters', async () => {
      mockPrismaService.section.findMany.mockResolvedValue([mockSectionDb])

      await service.findAll({
        subjectId: 'subject-1',
        teacherId: 'teacher-1',
        code: 'CHEM',
      })

      expect(mockPrismaService.section.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            subjectId: 'subject-1',
            teacherId: 'teacher-1',
            code: { contains: 'CHEM', mode: 'insensitive' },
          }),
        }),
      )
    })

    it('should return sections ordered by code', async () => {
      const sections = [mockSectionDb]
      mockPrismaService.section.findMany.mockResolvedValue(sections)

      await service.findAll({})

      expect(mockPrismaService.section.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ code: 'asc' }],
        }),
      )
    })

    it('should include all relationships', async () => {
      mockPrismaService.section.findMany.mockResolvedValue([mockSectionDb])

      await service.findAll({})

      expect(mockPrismaService.section.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            subject: true,
            teacher: { include: { user: true } },
            classroom: true,
            meetings: expect.any(Object),
          },
        }),
      )
    })
  })
})
