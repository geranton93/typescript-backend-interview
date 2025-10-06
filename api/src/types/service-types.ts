import {
  User,
  Student,
  Teacher,
  Subject,
  Classroom,
  Section,
  SectionMeeting,
  Enrollment,
  DayOfWeek,
  Prisma,
} from '@prisma/client'

// Pagination types
export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PaginatedResult<T> {
  data: T[]
  meta: PaginationMeta
}

// User with relations
export type UserWithStudent = User & {
  student: Student | null
}

export type UserWithTeacher = User & {
  teacher: Teacher | null
}

// Teacher with user data
export type TeacherWithUser = Teacher & {
  user: User
}

// Flattened teacher for API responses
export interface TeacherFlattened {
  id: string
  firstName: string
  lastName: string
  email: string
}

// Section with all relations
export type SectionWithRelations = Section & {
  subject: Subject
  teacher: TeacherWithUser
  classroom: Classroom
  meetings: SectionMeeting[]
}

export type SectionWithCount = SectionWithRelations & {
  _count: {
    enrollments: number
  }
}

// Flattened section for API responses
export type SectionFlattened = Omit<Section, 'teacher'> & {
  subject: Subject
  teacher: TeacherFlattened
  classroom: Classroom
  meetings: SectionMeeting[]
}

// Enrollment with relations
export type EnrollmentWithSection = Enrollment & {
  section: Section & {
    subject: Subject
  }
}

// Student schedule response
export interface StudentSchedule {
  student: User
  sections: SectionFlattened[]
}

// PDF export response
export interface PDFExportResult {
  buffer: Buffer
  fileName: string
}

// Meeting group for PDF generation
export interface MeetingGroup {
  day: DayOfWeek
  slots: string[]
}

// Transaction client type from Prisma
export type PrismaTransactionClient = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

// Section for conflict checking
export interface SectionForConflictCheck {
  id: string
  code: string
  subject: {
    title: string
  }
  meetings: {
    day: DayOfWeek
    startTime: Date
    endTime: Date
  }[]
}

// Section with meetings for conflict checking
export type SectionWithMeetings = Section & {
  subject: Subject
  meetings: SectionMeeting[]
}
