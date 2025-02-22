1. User Management APIs
Authentication
POST /api/auth/register - Register a new user (student, teacher, parent, admin).

POST /api/auth/login - Login and generate JWT token.

POST /api/auth/logout - Logout and invalidate token.

POST /api/auth/forgot-password - Request password reset.

POST /api/auth/reset-password - Reset password using token.

User Profile
GET /api/users/me - Get current user profile.

PUT /api/users/me - Update current user profile.

GET /api/users/:userId - Get user profile by ID (admin-only).

DELETE /api/users/:userId - Delete a user (admin-only).

Parent-Specific
GET /api/users/me/children - Get children details (for parents).

POST /api/users/me/children - Add a child to parent profile.

2. Course Management APIs
Course CRUD
POST /api/courses - Create a new course (teacher/admin).

GET /api/courses - Get all courses (filter by level, grade, subject).

GET /api/courses/:courseId - Get course details.

PUT /api/courses/:courseId - Update course details (teacher/admin).

DELETE /api/courses/:courseId - Delete a course (admin).

Course Enrollment
POST /api/courses/:courseId/enroll - Enroll a student in a course.

DELETE /api/courses/:courseId/enroll - Unenroll a student from a course.

GET /api/courses/:courseId/students - Get all enrolled students (teacher/admin).

3. Content Management APIs
Videos
POST /api/videos - Upload a video (teacher/admin).

GET /api/videos - Get all videos (filter by course, type, language).

GET /api/videos/:videoId - Get video details.

PUT /api/videos/:videoId - Update video details (teacher/admin).

DELETE /api/videos/:videoId - Delete a video (teacher/admin).

Assignments
POST /api/assignments - Create an assignment (teacher/admin).

GET /api/assignments - Get all assignments (filter by course).

GET /api/assignments/:assignmentId - Get assignment details.

PUT /api/assignments/:assignmentId - Update assignment details (teacher/admin).

DELETE /api/assignments/:assignmentId - Delete an assignment (teacher/admin).

Quizzes
POST /api/quizzes - Create a quiz (teacher/admin).

GET /api/quizzes - Get all quizzes (filter by course).

GET /api/quizzes/:quizId - Get quiz details.

PUT /api/quizzes/:quizId - Update quiz details (teacher/admin).

DELETE /api/quizzes/:quizId - Delete a quiz (teacher/admin).

4. Student-Specific APIs
Assignments
POST /api/assignments/:assignmentId/submit - Submit an assignment.

GET /api/assignments/:assignmentId/submission - Get submission details.

PUT /api/assignments/:assignmentId/submission - Update submission.

Quizzes
POST /api/quizzes/:quizId/attempt - Attempt a quiz.

GET /api/quizzes/:quizId/attempt - Get quiz attempt details.

Progress Tracking
GET /api/students/me/progress - Get student progress (courses, assignments, quizzes).

GET /api/students/me/streak - Get activity streak.

5. Teacher-Specific APIs
Content Management
GET /api/teachers/me/courses - Get all courses taught by the teacher.

POST /api/teachers/me/courses/:courseId/videos - Upload a video to a course.

POST /api/teachers/me/courses/:courseId/assignments - Add an assignment to a course.

POST /api/teachers/me/courses/:courseId/quizzes - Add a quiz to a course.

Grading
POST /api/assignments/:assignmentId/grade - Grade an assignment.

POST /api/quizzes/:quizId/grade - Grade a quiz attempt.

Reports
GET /api/teachers/me/reports - Get AI-generated reports for courses.

6. Parent-Specific APIs
Monitoring
GET /api/parents/me/children/progress - Get children’s progress.

GET /api/parents/me/children/assignments - Get children’s assignments.

GET /api/parents/me/children/quizzes - Get children’s quiz attempts.

Meetings
GET /api/parents/me/meetings - Get scheduled parent-teacher meetings.

POST /api/parents/me/meetings - Schedule a meeting with a teacher.

7. Admin-Specific APIs
User Management
GET /api/admin/users - Get all users (filter by role).

PUT /api/admin/users/:userId - Update any user’s details.

DELETE /api/admin/users/:userId - Delete any user.

Content Management
GET /api/admin/courses - Get all courses.

DELETE /api/admin/courses/:courseId - Delete any course.

GET /api/admin/videos - Get all videos.

DELETE /api/admin/videos/:videoId - Delete any video.

Reports
GET /api/admin/reports - Get system-wide reports (AI-generated).

8. Live Streaming APIs
POST /api/live-streams - Start a live stream (teacher/admin).

GET /api/live-streams - Get all live streams (filter by course).

GET /api/live-streams/:streamId - Get live stream details.

POST /api/live-streams/:streamId/join - Join a live stream (student).

POST /api/live-streams/:streamId/end - End a live stream (teacher/admin).

9. Meeting Management APIs
POST /api/meetings - Schedule a meeting (teacher/parent/admin).

GET /api/meetings - Get all meetings (filter by type, participant).

PUT /api/meetings/:meetingId - Update meeting details.

DELETE /api/meetings/:meetingId - Delete a meeting.

10. AI and Analytics APIs
AI Features
POST /api/ai/generate-blog - Generate a blog from a video.

POST /api/ai/translate-audio - Translate video audio to another language.

POST /api/ai/generate-report - Generate a report for a course/student.

Analytics
GET /api/analytics/student/:studentId - Get analytics for a student.

GET /api/analytics/course/:courseId - Get analytics for a course.

11. Miscellaneous APIs
Notifications
GET /api/notifications - Get all notifications for the user.

POST /api/notifications/mark-read - Mark notifications as read.

Dashboard
GET /api/dashboard - Get dashboard data (varies by role).