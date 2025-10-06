-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM (
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY'
);

-- CreateEnum
CREATE TYPE "SectionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'GRADUATED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ENROLLED', 'DROPPED', 'WITHDRAWN', 'COMPLETED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password" TEXT,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "userId" UUID NOT NULL,
    "studentNumber" TEXT NOT NULL,
    "studentStatus" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "studentEnrollmentDate" DATE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "students_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "teachers" (
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "teachers_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(20) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,
    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classrooms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "building" VARCHAR(100) NOT NULL,
    "room" VARCHAR(50) NOT NULL,
    "capacity" INTEGER,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,
    CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "capacity" INTEGER,
    "status" "SectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "term" VARCHAR(50),
    "year" INTEGER,
    "startDate" DATE,
    "endDate" DATE,
    "subjectId" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "classroomId" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,
    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_meetings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sectionId" UUID NOT NULL,
    "day" "DayOfWeek" NOT NULL,
    "startTime" TIME(6) NOT NULL,
    "endTime" TIME(6) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "section_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "studentId" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',
    "grade" VARCHAR(5),
    "enrolledAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "droppedAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_lastName_firstName_idx" ON "users"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "students_studentNumber_key" ON "students"("studentNumber");

-- CreateIndex
CREATE INDEX "students_studentNumber_idx" ON "students"("studentNumber");

-- CreateIndex
CREATE INDEX "students_studentStatus_idx" ON "students"("studentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

-- CreateIndex
CREATE INDEX "subjects_code_idx" ON "subjects"("code");

-- CreateIndex
CREATE INDEX "classrooms_building_idx" ON "classrooms"("building");

-- CreateIndex
CREATE UNIQUE INDEX "classrooms_building_room_key" ON "classrooms"("building", "room");

-- CreateIndex
CREATE INDEX "sections_subjectId_idx" ON "sections"("subjectId");

-- CreateIndex
CREATE INDEX "sections_teacherId_idx" ON "sections"("teacherId");

-- CreateIndex
CREATE INDEX "sections_classroomId_idx" ON "sections"("classroomId");

-- CreateIndex
CREATE INDEX "sections_status_idx" ON "sections"("status");

-- CreateIndex
CREATE INDEX "sections_term_year_idx" ON "sections"("term", "year");

-- CreateIndex
CREATE UNIQUE INDEX "sections_code_key" ON "sections"("code");

-- CreateIndex
CREATE INDEX "section_meetings_sectionId_idx" ON "section_meetings"("sectionId");

-- CreateIndex
CREATE INDEX "section_meetings_day_idx" ON "section_meetings"("day");

-- CreateIndex
CREATE UNIQUE INDEX "section_meetings_sectionId_day_startTime_endTime_key" ON "section_meetings"("sectionId", "day", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "enrollments_studentId_idx" ON "enrollments"("studentId");

-- CreateIndex
CREATE INDEX "enrollments_sectionId_idx" ON "enrollments"("sectionId");

-- CreateIndex
CREATE INDEX "enrollments_status_idx" ON "enrollments"("status");

-- CreateIndex
CREATE INDEX "enrollments_studentId_enrolledAt_idx" ON "enrollments"("studentId", "enrolledAt");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_studentId_sectionId_key" ON "enrollments"("studentId", "sectionId");

-- AddForeignKey
ALTER TABLE
    "students"
ADD
    CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "teachers"
ADD
    CONSTRAINT "teachers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "sections"
ADD
    CONSTRAINT "sections_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "sections"
ADD
    CONSTRAINT "sections_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "sections"
ADD
    CONSTRAINT "sections_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "section_meetings"
ADD
    CONSTRAINT "section_meetings_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "enrollments"
ADD
    CONSTRAINT "enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "enrollments"
ADD
    CONSTRAINT "enrollments_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add Check Constraints for Data Integrity
-- Capacity must be positive
ALTER TABLE
    "sections"
ADD
    CONSTRAINT "sections_capacity_positive" CHECK (
        "capacity" IS NULL
        OR "capacity" > 0
    );

ALTER TABLE
    "classrooms"
ADD
    CONSTRAINT "classrooms_capacity_positive" CHECK (
        "capacity" IS NULL
        OR "capacity" > 0
    );

-- Section dates must be valid (endDate >= startDate)
ALTER TABLE
    "sections"
ADD
    CONSTRAINT "sections_dates_valid" CHECK (
        "endDate" IS NULL
        OR "startDate" IS NULL
        OR "endDate" >= "startDate"
    );

-- User names must not be empty
ALTER TABLE
    "users"
ADD
    CONSTRAINT "users_firstname_not_empty" CHECK (length(trim("firstName")) > 0);

ALTER TABLE
    "users"
ADD
    CONSTRAINT "users_lastname_not_empty" CHECK (length(trim("lastName")) > 0);