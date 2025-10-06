# Goji Labs Interview Take-Home Project


## Overview
For our technical interview, we want you to build the foundation for a university course scheduling system. There should be teachers, subjects, classrooms, students, and another model called sections. A section represents a teacher teaching a subject in a specific classroom at a specfic time with students who attend the class. Think of it like the join model between all the other entities, and with specific times. Some sections are taught only on Monday, Wednesday, and Friday, others are only taught on Tuesdays and Thursdays, and some are every day. Sections typically are 50 minutes long, but they can also be 80 minutes. The earliest sections start at 7:30am and the latest ones end at 10pm.

## Goals
1. Students should be able to add/remove sections to their schedule
  - A student cannot be in two sections that overlap
  - For instance, if I add General Chemistry 1 to my schedule, and it's on MWF from 8:00 to 8:50am, I cannot enroll in any other sections between 8:00 and 8:50am on Mondays, Wednesdays, or Fridays.
2. Students should be able to download a PDF of their schedule.
  - For each section include subject, start time, end time, teacher name, and classroom name

## Guidelines
This is meant as a backend-only take home test project. You will not be scored on any styling or frontend choices. The entire application can be API-only, unless you're able to quickly set up a dashboard scaffold. This project is based on [NestJS](https://nestjs.com/) and [Prisma](https://prisma.io/). You can [seed](https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding) the database with the provided seed.cjs (you can replace it with seed.ts if you prefer) file. Some default configuration has been provided. Please make sure to use Postgres as your database (we've provided a docker-compose file).

## Time Constraints
Do not spend more than 4 hours implementing the goals above. It's not mandatory that the goals above are 100% working, due to the time constraint, we're most interested in seeing your best work. Write this code as if you're contributing to a larger project with multiple developers who will critique your work. If you're running out of time and something isn't funcional yet, that's okay, make sure that whatever is functional is both complete and polished.
If you’d like to build a more feature-rich application to better showcase your skills, feel free to spend more than 8 hours. This is entirely up to you and not a requirement. We’ve found that many candidates appreciate the opportunity to demonstrate their abilities in more depth.

## Setup

### Quick Start
```bash
# Start the database
docker-compose up -d db

# Navigate to API directory
cd api

# Install dependencies
npm install

# Run migrations and seed the database
npm run db:reset:seed

# Start the development server
npm run start:dev
```

The API will be available at http://localhost:3000 (or http://localhost:3002 when using Docker).

### Available Database Scripts
- `npm run db:seed` - Seeds the database with sample data
- `npm run db:reset` - Resets the database (drops all data, re-runs migrations)
- `npm run db:reset:seed` - Resets and seeds the database in one command
- `npm run db:studio` - Opens Prisma Studio for visual database browsing
- `npm run prisma:generate:client` - Regenerates Prisma client after schema changes
- `npm run prisma:migrate:deploy` - Applies pending migrations

## Database Schema

The system uses a PostgreSQL database with the following schema:

### Core Tables

#### 1. `users`
Stores core user information for all system users (students, teachers, admins).
- **id** (UUID): Primary key
- **email** (String): Unique email address
- **password** (String?): Optional password for authentication
- **firstName** (String): User's first name
- **lastName** (String): User's last name
- **role** (UserRole): STUDENT, TEACHER, or ADMIN
- **createdAt** (DateTime): Record creation timestamp
- **updatedAt** (DateTime): Last update timestamp
- **deletedAt** (DateTime?): Soft delete timestamp

#### 2. `students`
Stores student-specific information (extends users table).
- **userId** (UUID): Primary key, foreign key to users.id
- **studentNumber** (String): Unique student identifier (e.g., "STU-2024-001")
- **studentStatus** (StudentStatus): ACTIVE, INACTIVE, GRADUATED, or SUSPENDED
- **studentEnrollmentDate** (Date?): Date when student enrolled
- **createdAt** (DateTime): Record creation timestamp
- **updatedAt** (DateTime): Last update timestamp

#### 3. `teachers`
Stores teacher-specific information (extends users table).
- **userId** (UUID): Primary key, foreign key to users.id
- **createdAt** (DateTime): Record creation timestamp
- **updatedAt** (DateTime): Last update timestamp

### Academic Tables

#### 4. `subjects`
Course catalog containing all available subjects.
- **id** (UUID): Primary key
- **code** (String): Unique course code (e.g., "CHEM101")
- **title** (String): Full course title (e.g., "General Chemistry I")
- **description** (String?): Optional course description
- **createdAt** (DateTime): Record creation timestamp
- **updatedAt** (DateTime): Last update timestamp
- **deletedAt** (DateTime?): Soft delete timestamp

#### 5. `classrooms`
Physical locations where sections meet.
- **id** (UUID): Primary key
- **name** (String): Room name (e.g., "Chemistry Lab A")
- **building** (String): Building name
- **room** (String): Room number
- **capacity** (Int?): Optional maximum capacity
- **createdAt** (DateTime): Record creation timestamp
- **updatedAt** (DateTime): Last update timestamp
- **deletedAt** (DateTime?): Soft delete timestamp
- **Unique constraint**: (building, room)

#### 6. `sections`
Course instances - represents a teacher teaching a subject in a classroom.
- **id** (UUID): Primary key
- **code** (String): Unique section code (e.g., "CHEM101-MWF-0800")
- **capacity** (Int?): Optional enrollment limit
- **status** (SectionStatus): DRAFT, ACTIVE, CANCELLED, or COMPLETED
- **term** (String?): Academic term (e.g., "Fall 2024")
- **year** (Int?): Academic year
- **startDate** (Date?): Course start date
- **endDate** (Date?): Course end date
- **subjectId** (UUID): Foreign key to subjects.id
- **teacherId** (UUID): Foreign key to teachers.userId
- **classroomId** (UUID): Foreign key to classrooms.id
- **version** (Int): Optimistic locking version
- **createdAt** (DateTime): Record creation timestamp
- **updatedAt** (DateTime): Last update timestamp
- **deletedAt** (DateTime?): Soft delete timestamp

#### 7. `section_meetings`
Schedule information for when sections meet.
- **id** (UUID): Primary key
- **sectionId** (UUID): Foreign key to sections.id
- **day** (DayOfWeek): MONDAY through SUNDAY
- **startTime** (Time): Meeting start time
- **endTime** (Time): Meeting end time
- **createdAt** (DateTime): Record creation timestamp
- **updatedAt** (DateTime): Last update timestamp
- **Unique constraint**: (sectionId, day, startTime, endTime)

#### 8. `enrollments`
Join table linking students to sections they're enrolled in.
- **id** (UUID): Primary key
- **studentId** (UUID): Foreign key to students.userId
- **sectionId** (UUID): Foreign key to sections.id
- **status** (EnrollmentStatus): ENROLLED, DROPPED, WITHDRAWN, or COMPLETED
- **grade** (String?): Final grade (e.g., "A", "B+")
- **enrolledAt** (DateTime): Enrollment timestamp
- **droppedAt** (DateTime?): Drop timestamp
- **completedAt** (DateTime?): Completion timestamp
- **createdAt** (DateTime): Record creation timestamp
- **updatedAt** (DateTime): Last update timestamp
- **Unique constraint**: (studentId, sectionId)

### Enumerations

- **UserRole**: STUDENT, TEACHER, ADMIN
- **StudentStatus**: ACTIVE, INACTIVE, GRADUATED, SUSPENDED
- **SectionStatus**: DRAFT, ACTIVE, CANCELLED, COMPLETED
- **EnrollmentStatus**: ENROLLED, DROPPED, WITHDRAWN, COMPLETED
- **DayOfWeek**: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY

### Key Relationships

1. **User Hierarchy**: The `users` table is the base table, with `students` and `teachers` tables extending it via 1:1 relationships using userId as both primary and foreign key.

2. **Section Relationships**: 
   - A section belongs to one subject (many-to-one)
   - A section has one teacher (many-to-one to teachers)
   - A section uses one classroom (many-to-one)
   - A section has many meetings (one-to-many)
   - A section has many enrollments (one-to-many)

3. **Enrollment**: Links students to sections with additional metadata (status, grade, timestamps)

### Database Constraints & Business Rules

1. **Schedule Conflict Prevention**: Students cannot enroll in sections with overlapping meeting times
2. **Capacity Limits**: Sections can have optional enrollment capacity limits
3. **Unique Student Numbers**: Each student has a unique student number
4. **Cascade Deletes**: 
   - Deleting a section cascades to its meetings
   - Deleting a student cascades to their enrollments
   - Deleting a user cascades to their student/teacher record
5. **Referential Integrity**: 
   - Cannot delete subjects, teachers, or classrooms that have active sections
   - Foreign key constraints ensure data consistency

### Sample Data (Created by Seed)

The seed script creates:
- 2 Students (Alice Johnson, Bob Smith)
- 2 Teachers (Jiayi Chen, Maria Rivera)
- 1 Admin user
- 3 Subjects (Chemistry, Calculus, Literature)
- 2 Classrooms (Chemistry Lab, Lecture Hall)
- 3 Sections with various meeting patterns (MWF, TR, Daily)
- Sample enrollments
