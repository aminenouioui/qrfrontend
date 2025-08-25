from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from parent.views import (
    CreateParentAccountView,
    ParentAccountDetailView,
    ParentAccountListView,
    ParentChildGradesAPIView,
    ParentChildrenSchedulesView,
    ParentDetailView,
    ParentProfileView,
    ParentViewSet,
    
    ResetParentPasswordView,
    StudentParentRegistrationView,
    ParentChildAttendanceView,  # Added explicitly
)

urlpatterns = [
    # Parent CRUD endpoints (using ViewSet)
    path('api/parents/list/', ParentViewSet.as_view({'get': 'list'}), name='parent_list'),
    path('api/parents/add/', ParentViewSet.as_view({'post': 'create'}), name='add_parent'),
    path('api/parents/<int:pk>/', ParentViewSet.as_view({'get': 'retrieve'}), name='parent_detail'),
    path('api/parents/edit/<int:pk>/', ParentViewSet.as_view({'put': 'update'}), name='edit_parent'),
    path('api/parents/delete/<int:pk>/', ParentViewSet.as_view({'delete': 'destroy'}), name='delete_parent'),
    
    # Custom action to link a student to a parent
    path('api/parents/<int:pk>/link-student/', ParentViewSet.as_view({'post': 'link_student'}), name='link_student'),
    
    # Student and parent registration endpoint
    path('api/register-student-parent/', StudentParentRegistrationView.as_view(), name='student_parent_register'),
    
    # Parent account management
    path('api/parent-accounts/', ParentAccountListView.as_view(), name='parent_account_list'),
    path('api/parent-accounts/<int:pk>/', ParentAccountDetailView.as_view(), name='parent_account_detail'),
    path('api/parent-accounts/add/<int:parent_id>/', CreateParentAccountView.as_view(), name='create_parent_account'),
    path('api/parent-accounts/<int:parent_id>/reset-password/', ResetParentPasswordView.as_view(), name='reset_parent_password'),
    
    # Parent profile and child-related endpoints
    path('api/parent/profile/', ParentProfileView.as_view(), name='parent_profile'),
    path('api/parent/children/schedules/', ParentChildrenSchedulesView.as_view(), name='parent_children_schedules'),
    path('api/parent/children/grades/', ParentChildGradesAPIView.as_view(), name='parent_child_grades'),
    path('api/parent/children/attendance/', ParentChildAttendanceView.as_view(), name='parent_child_attendance'),

]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)