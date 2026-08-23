import { baseApi } from '@/app/api/baseApi'
import type { PageResponse } from '@/shared/types/api'

export interface StaffStats {
  courses: number
  students: number
  assignments: number
  grades: number
}

export interface StaffCourse {
  id: string
  code: string
  name_key: string
  credits: number
  academic_year: string
  semester: string
}

export interface PendingSubmission {
  id: string
  student_name: string
  assignment_title_key: string
}

export interface RecentActivity {
  type: 'grade' | 'assignment' | 'submission'
  message_key: string
  created_at: string
}

export interface StaffDashboardData {
  today: string
  courses: StaffCourse[]
  stats: StaffStats
  pendingSubmissions: PendingSubmission[]
  recentActivity: RecentActivity[]
}

export interface StudentCourse {
  id: string
  code: string
  name_key: string
  credits: number
  instructor: string
  progress: number
}

export interface StudentGrade {
  title_key: string
  course_name_key: string
  score: number
  max_score: number
}

export interface StudentAssignment {
  id: string
  title_key: string
  course_name_key: string
  due_date: string
  is_urgent: boolean
  is_submitted: boolean
}

export interface StudentDashboardData {
  today: string
  courses: StudentCourse[]
  grades: StudentGrade[]
  assignments: StudentAssignment[]
  attendance: number
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    staffDashboard: build.query<PageResponse<StaffDashboardData>, void>({
      query: () => '/dashboard',
      providesTags: ['Dashboard'],
    }),
    studentDashboard: build.query<PageResponse<StudentDashboardData>, void>({
      query: () => '/dashboard',
      providesTags: ['Dashboard'],
    }),
  }),
})

export const { useStaffDashboardQuery, useStudentDashboardQuery } = dashboardApi
