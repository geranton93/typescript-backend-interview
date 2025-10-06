/* eslint-disable no-console */
const { PrismaClient, DayOfWeek, UserRole } = require('@prisma/client')

const prisma = new PrismaClient()

const time = (hour, minute = 0) => new Date(Date.UTC(1970, 0, 1, hour, minute))

async function main() {
  await prisma.$transaction([
    prisma.enrollment.deleteMany(),
    prisma.sectionMeeting.deleteMany(),
    prisma.section.deleteMany(),
    prisma.classroom.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.user.deleteMany(),
  ])

  const [studentAlice, studentBob] = await prisma.$transaction([
    prisma.user.create({
      data: {
        role: UserRole.STUDENT,
        email: 'alice@example.edu',
        firstName: 'Alice',
        lastName: 'Johnson',
      },
    }),
    prisma.user.create({
      data: {
        role: UserRole.STUDENT,
        email: 'bob@example.edu',
        firstName: 'Bob',
        lastName: 'Smith',
      },
    }),
  ])

  await prisma.$transaction([
    prisma.student.upsert({
      where: { userId: studentAlice.id },
      update: {},
      create: {
        userId: studentAlice.id,
        studentNumber: 'STU-2024-001',
        studentStatus: 'ACTIVE',
        studentEnrollmentDate: new Date('2024-08-15'),
      },
    }),
    prisma.student.upsert({
      where: { userId: studentBob.id },
      update: {},
      create: {
        userId: studentBob.id,
        studentNumber: 'STU-2024-002',
        studentStatus: 'ACTIVE',
        studentEnrollmentDate: new Date('2024-08-15'),
      },
    }),
  ])

  const [teacherChen, teacherRivera] = await prisma.$transaction([
    prisma.user.create({
      data: {
        role: UserRole.TEACHER,
        email: 'jiayi.chen@example.edu',
        firstName: 'Jiayi',
        lastName: 'Chen',
      },
    }),
    prisma.user.create({
      data: {
        role: UserRole.TEACHER,
        email: 'maria.rivera@example.edu',
        firstName: 'Maria',
        lastName: 'Rivera',
      },
    }),
  ])

  await prisma.$transaction([
    prisma.teacher.upsert({ where: { userId: teacherChen.id }, update: {}, create: { userId: teacherChen.id } }),
    prisma.teacher.upsert({ where: { userId: teacherRivera.id }, update: {}, create: { userId: teacherRivera.id } }),
  ])

  const [chemistry, calculus, literature] = await prisma.$transaction([
    prisma.subject.create({
      data: {
        code: 'CHEM101',
        title: 'General Chemistry I',
        description: 'Fundamentals of chemical principles with laboratory.',
      },
    }),
    prisma.subject.create({
      data: {
        code: 'MATH201',
        title: 'Calculus II',
        description: 'Integral calculus and series applications.',
      },
    }),
    prisma.subject.create({
      data: {
        code: 'LIT205',
        title: 'World Literature',
        description: 'Comparative study of global literary works.',
      },
    }),
  ])

  const [labA, hallB] = await prisma.$transaction([
    prisma.classroom.create({
      data: {
        name: 'Chemistry Lab A',
        building: 'Science Center',
        room: '210',
        capacity: 24,
      },
    }),
    prisma.classroom.create({
      data: {
        name: 'Lecture Hall B',
        building: 'Main Hall',
        room: '105',
        capacity: 80,
      },
    }),
  ])

  const chemistrySection = await prisma.section.create({
    data: {
      code: 'CHEM101-MWF-0800',
      capacity: 24,
      status: 'ACTIVE',
      term: 'Fall 2024',
      year: 2024,
      startDate: new Date('2024-08-26'),
      endDate: new Date('2024-12-15'),
      subjectId: chemistry.id,
      teacherId: teacherChen.id,
      classroomId: labA.id,
      meetings: {
        createMany: {
          data: [
            { day: DayOfWeek.MONDAY, startTime: time(8, 0), endTime: time(8, 50) },
            { day: DayOfWeek.WEDNESDAY, startTime: time(8, 0), endTime: time(8, 50) },
            { day: DayOfWeek.FRIDAY, startTime: time(8, 0), endTime: time(8, 50) },
          ],
        },
      },
    },
    include: { meetings: true },
  })

  const calculusSection = await prisma.section.create({
    data: {
      code: 'MATH201-TR-0930',
      capacity: 30,
      status: 'ACTIVE',
      term: 'Fall 2024',
      year: 2024,
      startDate: new Date('2024-08-26'),
      endDate: new Date('2024-12-15'),
      subjectId: calculus.id,
      teacherId: teacherRivera.id,
      classroomId: hallB.id,
      meetings: {
        createMany: {
          data: [
            { day: DayOfWeek.TUESDAY, startTime: time(9, 30), endTime: time(10, 50) },
            { day: DayOfWeek.THURSDAY, startTime: time(9, 30), endTime: time(10, 50) },
          ],
        },
      },
    },
  })

  const literatureSection = await prisma.section.create({
    data: {
      code: 'LIT205-DAILY-1400',
      capacity: 20,
      status: 'ACTIVE',
      term: 'Fall 2024',
      year: 2024,
      startDate: new Date('2024-08-26'),
      endDate: new Date('2024-12-15'),
      subjectId: literature.id,
      teacherId: teacherRivera.id,
      classroomId: hallB.id,
      meetings: {
        createMany: {
          data: [
            { day: DayOfWeek.MONDAY, startTime: time(14, 0), endTime: time(14, 50) },
            { day: DayOfWeek.TUESDAY, startTime: time(14, 0), endTime: time(14, 50) },
            { day: DayOfWeek.WEDNESDAY, startTime: time(14, 0), endTime: time(14, 50) },
            { day: DayOfWeek.THURSDAY, startTime: time(14, 0), endTime: time(14, 50) },
            { day: DayOfWeek.FRIDAY, startTime: time(14, 0), endTime: time(14, 50) },
          ],
        },
      },
    },
  })

  await prisma.enrollment.create({
    data: {
      studentId: studentAlice.id,
      sectionId: chemistrySection.id,
    },
  })

  await prisma.enrollment.create({
    data: {
      studentId: studentBob.id,
      sectionId: calculusSection.id,
    },
  })

  await prisma.enrollment.create({
    data: {
      studentId: studentBob.id,
      sectionId: literatureSection.id,
    },
  })

  await prisma.user.upsert({
    where: { email: 'admin@example.edu' },
    update: {},
    create: {
      email: 'admin@example.edu',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    },
  })

  console.info('Seed data generated successfully')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async error => {
    console.error('Seed failed', error)
    await prisma.$disconnect()
    process.exit(1)
  })
