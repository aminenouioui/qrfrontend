from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

from student_qr import views as student_views
from teacher_qr import views as teacher_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('student_qr.urls')),
    path('api/qr-data/', student_views.ReceiveQRDataView.as_view(), name='receive_qr_data'),  # Fixed with .as_view()
    path('', include('teacher_qr.urls')),
    path('api/qr-data-t/', teacher_views.ReceiveQRDataTView.as_view(), name='receive_qr_data_t'),  # Fixed with .as_view()
    path('auth/', include('users.urls')), 
    path('', include('parent.urls')),  
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)