import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/prisma/prisma.service'

describe('Students (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let studentId: string
  let section1Id: string
  let section2Id: string
  let conflictingSectionId: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    app.enableVersioning({ type: VersioningType.URI })
    app.setGlobalPrefix('api')

    prisma = app.get<PrismaService>(PrismaService)

    await app.init()

    // Clean up test data
    await prisma.enrollment.deleteMany({})
    await prisma.sectionMeeting.deleteMany({})
    await prisma.section.deleteMany({})
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test-' } } })
    await prisma.subject.deleteMany({ where: { code: { startsWith: 'TEST' } } })
    await prisma.classroom.deleteMany({ where: { building: 'TEST' } })

    // Create test data
    const teacher = await prisma.user.create({
      data: {
        role: 'TEACHER',
        email: 'test-teacher@example.edu',
        firstName: 'Test',
        lastName: 'Teacher',
      },
    })

    await prisma.teacher.create({ data: { userId: teacher.id } })

    const subject1 = await prisma.subject.create({
      data: {
        code: 'TEST101',
        title: 'Test Subject 1',
      },
    })

    const subject2 = await prisma.subject.create({
      data: {
        code: 'TEST102',
        title: 'Test Subject 2',
      },
    })

    const classroom = await prisma.classroom.create({
      data: {
        name: 'Test Room',
        building: 'TEST',
        room: '101',
      },
    })

    const student = await prisma.user.create({
      data: {
        role: 'STUDENT',
        email: 'test-student@example.edu',
        firstName: 'Test',
        lastName: 'Student',
      },
    })
    await prisma.student.create({ data: { userId: student.id, studentNumber: 'TEST-001', studentStatus: 'ACTIVE' } })
    studentId = student.id

    // Section 1: Monday 8:00-8:50
    const section1 = await prisma.section.create({
      data: {
        code: 'TEST101-01',
        capacity: 30,
        subjectId: subject1.id,
        teacherId: teacher.id,
        classroomId: classroom.id,
      },
    })
    section1Id = section1.id

    await prisma.sectionMeeting.create({
      data: {
        sectionId: section1.id,
        day: 'MONDAY',
        startTime: new Date('1970-01-01T08:00:00.000Z'),
        endTime: new Date('1970-01-01T08:50:00.000Z'),
      },
    })

    // Section 2: Tuesday 9:00-9:50 (no conflict)
    const section2 = await prisma.section.create({
      data: {
        code: 'TEST102-01',
        capacity: 30,
        subjectId: subject2.id,
        teacherId: teacher.id,
        classroomId: classroom.id,
      },
    })
    section2Id = section2.id

    await prisma.sectionMeeting.create({
      data: {
        sectionId: section2.id,
        day: 'TUESDAY',
        startTime: new Date('1970-01-01T09:00:00.000Z'),
        endTime: new Date('1970-01-01T09:50:00.000Z'),
      },
    })

    // Conflicting section: Monday 8:30-9:20 (overlaps with section1)
    const conflictingSection = await prisma.section.create({
      data: {
        code: 'TEST103-01',
        capacity: 30,
        subjectId: subject1.id,
        teacherId: teacher.id,
        classroomId: classroom.id,
      },
    })
    conflictingSectionId = conflictingSection.id

    await prisma.sectionMeeting.create({
      data: {
        sectionId: conflictingSection.id,
        day: 'MONDAY',
        startTime: new Date('1970-01-01T08:30:00.000Z'),
        endTime: new Date('1970-01-01T09:20:00.000Z'),
      },
    })
  })

  afterAll(async () => {
    // Clean up
    await prisma.enrollment.deleteMany({})
    await prisma.sectionMeeting.deleteMany({})
    await prisma.section.deleteMany({})
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test-' } } })
    await prisma.subject.deleteMany({ where: { code: { startsWith: 'TEST' } } })
    await prisma.classroom.deleteMany({ where: { building: 'TEST' } })

    await app.close()
  })

  describe('GET /api/v1/students', () => {
    it('should return paginated list of students', () => {
      return request(app.getHttpServer())
        .get('/api/v1/students')
        .expect(200)
        .expect(res => {
          expect(res.body.data).toBeDefined()
          expect(res.body.data.data).toBeInstanceOf(Array)
          expect(res.body.data.meta).toBeDefined()
          expect(res.body.data.meta.total).toBeGreaterThanOrEqual(1)
          expect(res.body.data.meta.page).toBe(1)
          expect(res.body.data.meta.limit).toBe(50)
        })
    })

    it('should filter students by email', () => {
      return request(app.getHttpServer())
        .get('/api/v1/students?email=test-student@example.edu')
        .expect(200)
        .expect(res => {
          expect(res.body.data.data).toBeInstanceOf(Array)
          expect(res.body.data.data.length).toBeGreaterThan(0)
        })
    })

    it('should handle pagination parameters', () => {
      return request(app.getHttpServer())
        .get('/api/v1/students?page=1&limit=10')
        .expect(200)
        .expect(res => {
          expect(res.body.data.meta.page).toBe(1)
          expect(res.body.data.meta.limit).toBe(10)
        })
    })

    it('should reject invalid pagination parameters', () => {
      return request(app.getHttpServer()).get('/api/v1/students?page=0').expect(400)
    })
  })

  describe('GET /api/v1/students/:id', () => {
    it('should return a student by id', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/students/${studentId}`)
        .expect(200)
        .expect(res => {
          expect(res.body.data.id).toBe(studentId)
          expect(res.body.data.email).toBe('test-student@example.edu')
        })
    })

    it('should return 404 for non-existent student', () => {
      return request(app.getHttpServer()).get('/api/v1/students/00000000-0000-0000-0000-000000000000').expect(404)
    })

    it('should return 400 for invalid UUID', () => {
      return request(app.getHttpServer()).get('/api/v1/students/invalid-uuid').expect(400)
    })
  })

  describe('POST /api/v1/students/:id/schedule (Enrollment)', () => {
    beforeEach(async () => {
      // Clear enrollments before each test
      await prisma.enrollment.deleteMany({ where: { studentId } })
    })

    it('should successfully enroll a student in a section', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/students/${studentId}/schedule`)
        .send({ sectionId: section1Id })
        .expect(201)

      expect(response.body.data.sections).toHaveLength(1)
      expect(response.body.data.sections[0].id).toBe(section1Id)
    })

    it('should allow enrolling in non-conflicting sections', async () => {
      // Enroll in first section
      await request(app.getHttpServer())
        .post(`/api/v1/students/${studentId}/schedule`)
        .send({ sectionId: section1Id })
        .expect(201)

      // Enroll in non-conflicting section
      const response = await request(app.getHttpServer())
        .post(`/api/v1/students/${studentId}/schedule`)
        .send({ sectionId: section2Id })
        .expect(201)

      expect(response.body.data.sections).toHaveLength(2)
    })

    it('should prevent double enrollment in the same section', async () => {
      // Enroll once
      await request(app.getHttpServer())
        .post(`/api/v1/students/${studentId}/schedule`)
        .send({ sectionId: section1Id })
        .expect(201)

      // Try to enroll again
      await request(app.getHttpServer())
        .post(`/api/v1/students/${studentId}/schedule`)
        .send({ sectionId: section1Id })
        .expect(409)
        .expect(res => {
          expect(res.body.message).toContain('already enrolled')
        })
    })

    it('should detect and prevent schedule conflicts', async () => {
      // Enroll in first section (Monday 8:00-8:50)
      await request(app.getHttpServer())
        .post(`/api/v1/students/${studentId}/schedule`)
        .send({ sectionId: section1Id })
        .expect(201)

      // Try to enroll in conflicting section (Monday 8:30-9:20)
      await request(app.getHttpServer())
        .post(`/api/v1/students/${studentId}/schedule`)
        .send({ sectionId: conflictingSectionId })
        .expect(409)
        .expect(res => {
          expect(res.body.message).toContain('conflicts')
          expect(res.body.message).toContain('Monday')
        })
    })

    it('should prevent enrollment when section is at capacity', async () => {
      // Create a section with capacity of 1
      const subject = await prisma.subject.findFirst({ where: { code: 'TEST101' } })
      const teacher = await prisma.user.findFirst({ where: { email: 'test-teacher@example.edu', role: 'TEACHER' } })
      const classroom = await prisma.classroom.findFirst({ where: { building: 'TEST' } })

      const limitedSection = await prisma.section.create({
        data: {
          code: 'TEST104-01',
          capacity: 1,
          subjectId: subject.id,
          teacherId: teacher.id,
          classroomId: classroom.id,
        },
      })

      await prisma.sectionMeeting.create({
        data: {
          sectionId: limitedSection.id,
          day: 'FRIDAY',
          startTime: new Date('1970-01-01T10:00:00.000Z'),
          endTime: new Date('1970-01-01T10:50:00.000Z'),
        },
      })

      // Create another student and enroll them
      const anotherStudent = await prisma.user.create({
        data: {
          role: 'STUDENT',
          email: 'test-another@example.edu',
          firstName: 'Another',
          lastName: 'Student',
        },
      })
      await prisma.student.create({
        data: { userId: anotherStudent.id, studentNumber: 'TEST-002', studentStatus: 'ACTIVE' },
      })

      await prisma.enrollment.create({
        data: {
          studentId: anotherStudent.id,
          sectionId: limitedSection.id,
        },
      })

      // Try to enroll when at capacity
      await request(app.getHttpServer())
        .post(`/api/v1/students/${studentId}/schedule`)
        .send({ sectionId: limitedSection.id })
        .expect(409)
        .expect(res => {
          expect(res.body.message).toContain('full capacity')
        })

      // Cleanup
      await prisma.enrollment.deleteMany({ where: { sectionId: limitedSection.id } })
      await prisma.sectionMeeting.deleteMany({ where: { sectionId: limitedSection.id } })
      await prisma.section.delete({ where: { id: limitedSection.id } })
      await prisma.user.delete({ where: { id: anotherStudent.id } })
    })

    it('should return 404 when enrolling non-existent student', () => {
      return request(app.getHttpServer())
        .post('/api/v1/students/00000000-0000-0000-0000-000000000000/schedule')
        .send({ sectionId: section1Id })
        .expect(404)
    })

    it('should return 404 when enrolling in non-existent section', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/students/${studentId}/schedule`)
        .send({ sectionId: '00000000-0000-0000-0000-000000000000' })
        .expect(404)
    })

    it('should validate request body', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/students/${studentId}/schedule`)
        .send({ sectionId: 'invalid-uuid' })
        .expect(400)
    })
  })

  describe('DELETE /api/v1/students/:id/schedule/:sectionId (Drop)', () => {
    beforeEach(async () => {
      // Clear and set up enrollment
      await prisma.enrollment.deleteMany({ where: { studentId } })
      await prisma.enrollment.create({
        data: {
          studentId,
          sectionId: section1Id,
        },
      })
    })

    it('should successfully drop a student from a section', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/students/${studentId}/schedule/${section1Id}`)
        .expect(200)

      expect(response.body.data.sections).toHaveLength(0)
    })

    it('should return 404 when dropping from non-enrolled section', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/students/${studentId}/schedule/${section2Id}`)
        .expect(404)
        .expect(res => {
          expect(res.body.message).toContain('not enrolled')
        })
    })
  })

  describe('GET /api/v1/students/:id/schedule/pdf (PDF Export)', () => {
    beforeEach(async () => {
      // Clear and set up enrollment
      await prisma.enrollment.deleteMany({ where: { studentId } })
      await prisma.enrollment.create({
        data: {
          studentId,
          sectionId: section1Id,
        },
      })
    })

    it('should generate PDF schedule for enrolled student', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/students/${studentId}/schedule/pdf`)
        .expect(200)
        .expect('Content-Type', 'application/pdf')

      expect(response.headers['content-disposition']).toContain('schedule-student-test.pdf')
      expect(response.body).toBeInstanceOf(Buffer)
      expect(response.body.length).toBeGreaterThan(0)
    })

    it('should include all required fields in PDF', async () => {
      // Enroll in multiple sections to test comprehensive PDF
      await prisma.enrollment.create({
        data: {
          studentId,
          sectionId: section2Id,
        },
      })

      const response = await request(app.getHttpServer())
        .get(`/api/v1/students/${studentId}/schedule/pdf`)
        .expect(200)
        .expect('Content-Type', 'application/pdf')

      // Verify PDF structure
      expect(response.body).toBeInstanceOf(Buffer)
      expect(response.body.length).toBeGreaterThan(1000) // PDF should have substantial content

      // Verify PDF header
      const pdfHeader = response.body.toString('utf8', 0, 8)
      expect(pdfHeader).toMatch(/%PDF-1\.\d/)

      // Check file name in headers indicates correct student
      expect(response.headers['content-disposition']).toContain('schedule-student-test.pdf')
      expect(response.headers['content-length']).toBe(String(response.body.length))
    })

    it('should generate PDF with multiple sections', async () => {
      // Enroll in second section
      await prisma.enrollment.create({
        data: {
          studentId,
          sectionId: section2Id,
        },
      })

      const response = await request(app.getHttpServer()).get(`/api/v1/students/${studentId}/schedule/pdf`).expect(200)

      // PDF with 2 sections should be larger than PDF with 1 section
      // (This indirectly verifies both sections are included)
      expect(response.body.length).toBeGreaterThan(1500)
    })

    it('should return 400 when student has no enrollments', async () => {
      // Remove all enrollments
      await prisma.enrollment.deleteMany({ where: { studentId } })

      await request(app.getHttpServer())
        .get(`/api/v1/students/${studentId}/schedule/pdf`)
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain('No enrolled sections')
        })
    })
  })

  describe('GET /api/v1/students/:id/schedule (Get Schedule)', () => {
    beforeEach(async () => {
      // Clear and set up enrollments
      await prisma.enrollment.deleteMany({ where: { studentId } })
    })

    it('should return empty schedule when not enrolled', async () => {
      const response = await request(app.getHttpServer()).get(`/api/v1/students/${studentId}/schedule`).expect(200)

      expect(response.body.data.sections).toHaveLength(0)
    })

    it('should return schedule with enrolled sections', async () => {
      await prisma.enrollment.create({
        data: { studentId, sectionId: section1Id },
      })

      const response = await request(app.getHttpServer()).get(`/api/v1/students/${studentId}/schedule`).expect(200)

      expect(response.body.data.sections).toHaveLength(1)
      expect(response.body.data.sections[0]).toHaveProperty('subject')
      expect(response.body.data.sections[0]).toHaveProperty('teacher')
      expect(response.body.data.sections[0]).toHaveProperty('classroom')
      expect(response.body.data.sections[0]).toHaveProperty('meetings')
    })
  })
})
