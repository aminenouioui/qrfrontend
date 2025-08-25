# users/urls.py
from django.urls import path
from .views import LogoutView, RegisterView, CustomTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('signup/', RegisterView.as_view(), name='admin_signup'),  # Changed from admin/signup/
    path('login/', CustomTokenObtainPairView.as_view(), name='admin_login'),  # Changed from admin/login/
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),

    
]