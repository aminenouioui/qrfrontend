from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from parent import views
from .views import (
    AttendanceView, ChangePasswordView, CurrentStudentProfileView, CurrentStudentScheduleView, ParentChildrenAttendanceView, QRCodeView, ReceiveQRDataView, StudentAttendanceView, StudentExportView, StudentGradesListView, StudentListView, StudentCreateView, StudentTeacherListView, StudentUpdateView, StudentDeleteView, StudentDetailView,
    LevelListView, LevelCreateView, LevelDeleteView, SchedulesListView, SchedulesCreateView, SchedulesUpdateView,
    SchedulesDeleteView, SchedulesByLevelView, AttendanceListView, AttendanceCreateUpdateView, AttendanceDeleteView,
    GradesListView, GradesCreateView, GradesUpdateView, GradesDeleteView, DashboardStatsView, StudentWithParentCreateView, SubjectListView, TeacherScheduledStudentsView, create_student_account, delete_student_account, list_student_accounts, reset_student_password, update_student_account
)
from django.urls import re_path

urlpatterns = [
    path('api/qr/receive/', ReceiveQRDataView.as_view(), name='receive_qr_data'),
    path('api/qrcode/<int:pk>/', QRCodeView.as_view(), name='student_qrcode'),  # Add QR code endpoint
    path('api/students/list/', StudentListView.as_view(), name='student_list'),
    path('api/students/add/', StudentWithParentCreateView.as_view(), name='add_student'),
    path('api/parent/children/attendance/', ParentChildrenAttendanceView.as_view(), name='parent-children-attendance'),

    path('api/students/edit/<int:pk>/', StudentUpdateView.as_view(), name='edit_student'),
    path('api/students/delete/<int:pk>/', StudentDeleteView.as_view(), name='delete_student'),
    path('api/students/<int:pk>/', StudentDetailView.as_view(), name='student_detail_json'),
    path('api/levels/list/', LevelListView.as_view(), name='list_levels'),
    path('api/levels/add/', LevelCreateView.as_view(), name='add_level'),
    path('api/levels/delete/<int:level_id>/', LevelDeleteView.as_view(), name='delete_level'),
    path('api/schedules/list/', SchedulesListView.as_view(), name='list_schedules_json'),
    path('api/schedules/create/', SchedulesCreateView.as_view(), name='create_schedule_json'),
    path('api/schedules/<int:schedule_id>/update/', SchedulesUpdateView.as_view(), name='update_schedule_json'),
    path('api/schedules/<int:schedule_id>/delete/', SchedulesDeleteView.as_view(), name='delete_schedule_json'),
    path('api/schedules/level/<int:level_id>/', SchedulesByLevelView.as_view(), name='schedules_by_level'),
    path('api/attendance/<int:student_id>/', AttendanceListView.as_view(), name='student_attendance_json'),
    path('api/attendance/add/', AttendanceCreateUpdateView.as_view(), name='add_or_update_attendance_json'),
    path('api/attendance/delete/<int:student_id>/<int:schedule_id>/<str:date>/', AttendanceDeleteView.as_view(), name='delete_attendance_json'),
    path('api/grades/list/', GradesListView.as_view(), name='list_grades'),
    path('api/grades/add/', GradesCreateView.as_view(), name='add_grade'),
    path('api/grades/edit/<int:grade_id>/', GradesUpdateView.as_view(), name='edit_grade'),
    path('api/grades/delete/<int:grade_id>/', GradesDeleteView.as_view(), name='delete_grade'),
    path('api/dashboard-stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('create-student-account/<int:student_id>/', create_student_account, name='create_student_account'),
    path('api/student-accounts/', list_student_accounts, name='list_student_accounts'),
    path('api/student-accounts/<int:student_id>/', update_student_account, name='update_student_account'),
    path('api/student-accounts/<int:student_id>/reset-password/', reset_student_password, name='reset_student_password'),
    path('api/student-accounts/<int:student_id>/delete/', delete_student_account, name='delete_student_account'),
    path('api/student/profile/', CurrentStudentProfileView.as_view(), name='current_student_profile'),  
    path('api/student/schedule/', CurrentStudentScheduleView.as_view(), name='current_student_profile'),  
    path('api/student/schedule/', CurrentStudentScheduleView.as_view(), name='student_schedule'),
    path('api/student/subjects/', SubjectListView.as_view(), name='student_subject_list'),
    path('api/student/teachers/', StudentTeacherListView.as_view(), name='student_teacher_list'),
    path('api/student/grades/', StudentGradesListView.as_view(), name='student_grades'),
    path('api/attendance/<int:student_id>/', AttendanceView.as_view(), name='attendance'),
    path('api/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('api/attendance/<int:student_id>/', AttendanceView.as_view(), name='attendance'),
    path('api/student/attendance/', StudentAttendanceView.as_view(), name='student-attendance'),
    path("api/export/students/", StudentExportView.as_view(), name="student-export"),
    path('api/teachers/<int:teacher_id>/scheduled-students/', TeacherScheduledStudentsView.as_view(), name='teacher-scheduled-students'),


] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)