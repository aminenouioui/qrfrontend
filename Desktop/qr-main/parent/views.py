import logging
from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, generics, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.hashers import make_password
import string
import random
from datetime import datetime

from parent.models.parent import Parent
from parent.serializer import ParentAccountSerializer, ParentDetailSerializer, ParentSerializer
from student_qr.models.grades import Grades
from student_qr.models.schedules_st import Schedules_st
from student_qr.models.student import Student
from student_qr.models.attendance import Attendance
from student_qr.serializers import GradesSerializer, SchedulesStSerializer, StudentSerializer, StudentWithParentSerializer, AttendanceSerializer
from users.models import CustomUser

logger = logging.getLogger(__name__)

def generate_password():
    """Generate a random password for account creation"""
    characters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(random.choice(characters) for _ in range(8))

class ParentProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            parent = Parent.objects.get(user_account=request.user)
            serializer = ParentDetailSerializer(parent)
            data = serializer.data
            data['name'] = f"{parent.prenom} {parent.nom}"
            data['email'] = parent.mail
            data['photo'] = None  # Add photo URL if you have a photo field
            return Response(data, status=status.HTTP_200_OK)
        except Parent.DoesNotExist:
            return Response({"detail": "Parent profile not found"}, status=status.HTTP_404_NOT_FOUND)

class ParentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for CRUD operations on Parent model.
    """
    serializer_class = ParentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Parent.objects.filter(admin=self.request.user)

    def get_serializer_class(self):
        if self.action == 'retrieve' or self.action == 'list':
            return ParentDetailSerializer
        return ParentSerializer

    def perform_create(self, serializer):
        serializer.save(admin=self.request.user)

    @action(detail=True, methods=['post'])
    def link_student(self, request, pk=None):
        """Link an existing student to a parent"""
        parent = self.get_object()
        student_id = request.data.get('student_id')

        try:
            student = Student.objects.get(id=student_id, admin=request.user)
            parent.students.add(student)
            return Response({'status': 'Student linked to parent'}, status=status.HTTP_200_OK)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

class StudentParentRegistrationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = StudentWithParentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            student = serializer.save()
            return Response({
                'student': StudentSerializer(student).data,
                'message': 'Student and parent registered successfully.'
            }, status=status.HTTP_201_CREATED)
        # Return detailed serializer errors
        logger.error(f"Serializer errors: {serializer.errors}")
        return Response({
            'errors': serializer.errors,
            'message': 'Failed to register student and parent.'
        }, status=status.HTTP_400_BAD_REQUEST)
class ParentDetailView(generics.RetrieveAPIView):
    queryset = Parent.objects.all()
    serializer_class = ParentDetailSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return Parent.objects.filter(admin=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        logger.info(f"Parent detail retrieved: id={instance.id}, user={request.user}")
        return Response(serializer.data)

class ParentListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ParentSerializer

    def get_queryset(self):
        return Parent.objects.filter(admin=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        logger.info(f"Parent list retrieved: count={queryset.count()}, user={request.user}")
        return Response(serializer.data)

class ParentAccountListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ParentAccountSerializer

    def get_queryset(self):
        return Parent.objects.filter(admin=self.request.user, is_account_created=True)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        logger.info(f"Parent accounts retrieved: count={queryset.count()}, user={request.user}")
        return Response(serializer.data)

class ParentAccountDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ParentAccountSerializer
    lookup_field = 'pk'

    def get_queryset(self):
        return Parent.objects.filter(admin=self.request.user, is_account_created=True)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        data = {
            'prenom': request.data.get('name', '').split(' ')[0],
            'nom': ' '.join(request.data.get('name', '').split(' ')[1:]) if len(request.data.get('name', '').split(' ')) > 1 else instance.nom,
            'mail': request.data.get('email', instance.mail),
            'status': request.data.get('status', instance.status),
        }
        if 'email' in request.data and request.data['email'] != instance.mail:
            # Update user_account email if changed
            if instance.user_account:
                instance.user_account.email = request.data['email']
                instance.user_account.save()
        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        logger.info(f"Parent account updated: id={instance.id}, user={request.user}")
        return Response(serializer.data)

class CreateParentAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, parent_id):
        logger.info(f"Creating account for parent_id={parent_id}, user={request.user}")
        parent = get_object_or_404(Parent, id=parent_id, admin=request.user)
        if parent.is_account_created:
            logger.warning(f"Parent {parent_id} already has an account")
            return Response({"error": "Parent account already exists"}, status=status.HTTP_400_BAD_REQUEST)

        raw_password = request.data.get("password", generate_password())
        username_base = parent.mail.split("@")[0]
        username = username_base
        suffix = 1
        while CustomUser.objects.filter(username=username).exists():
            username = f"{username_base}{suffix}"
            suffix += 1
        with transaction.atomic():
            try:
                user = CustomUser.objects.create(
                    username=username,
                    email=parent.mail,
                    password=make_password(raw_password),
                    role="parent"
                )
                logger.info(f"Created CustomUser {username} for parent {parent_id}")
            except Exception as e:
                logger.error(f"Failed to create CustomUser for parent {parent_id}: {str(e)}")
                return Response({"error": f"Failed to create user: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

            parent.user_account = user
            parent.is_account_created = True
            parent.status = "Active"
            parent.temporary_password = raw_password  # Save raw password
            parent.save()
            logger.info(f"Updated parent {parent_id}: is_account_created=True, status=Active")

        serializer = ParentAccountSerializer(parent)
        data = serializer.data
        data["password"] = raw_password
        data["username"] = username
        return Response(data, status=status.HTTP_201_CREATED)

class ResetParentPasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, parent_id):
        logger.info(f"Resetting password for parent_id={parent_id}, user={request.user}")
        parent = get_object_or_404(Parent, id=parent_id, admin=request.user)
        if not parent.is_account_created or not parent.user_account:
            logger.warning(f"Parent {parent_id} has no account")
            return Response({"error": "Parent account not found"}, status=status.HTTP_404_NOT_FOUND)

        new_password = request.data.get("password")
        if not new_password:
            logger.error(f"Password not provided for parent {parent_id}")
            return Response({"error": "Password is required"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            parent.user_account.password = make_password(new_password)
            parent.user_account.save()
            parent.temporary_password = new_password  # Save new raw password
            parent.save()
            logger.info(f"Password reset for parent {parent_id}")

        return Response({"message": "Password reset successfully", "password": new_password}, status=status.HTTP_200_OK)

class DeleteParentAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, parent_id):
        logger.info(f"Deleting account for parent_id={parent_id}, user={request.user}")
        parent = get_object_or_404(Parent, id=parent_id, admin=request.user)
        if not parent.is_account_created or not parent.user_account:
            logger.warning(f"Parent {parent_id} has no account to delete")
            return Response({"error": "Parent account not found"}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            try:
                user = parent.user_account
                parent.user_account = None
                parent.is_account_created = False
                parent.status = "Inactive"
                parent.temporary_password = None  # Clear temporary password
                parent.save()
                user.delete()
                logger.info(f"Deleted CustomUser and reset parent {parent_id}")
                return Response({"message": "Parent account deleted successfully"}, status=status.HTTP_200_OK)
            except Exception as e:
                logger.error(f"Failed to delete account for parent {parent_id}: {str(e)}")
                return Response({"error": f"Failed to delete account: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class ParentChildrenSchedulesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            parent = Parent.objects.get(user_account=request.user)
            students = parent.students.all()
            student_levels = students.values_list('level', flat=True).distinct()
            schedules = Schedules_st.objects.filter(level__in=student_levels).select_related('Teacher', 'level', 'classe', 'subject')
            response_data = []
            for schedule in schedules:
                level_students = students.filter(level=schedule.level)
                child_names = [f"{s.prenom} {s.nom}" for s in level_students]
                child_names_str = ", ".join(child_names) if child_names else "Unknown"
                response_data.append({
                    'child_names': child_names_str,
                    'day': schedule.day,
                    'start_time': str(schedule.start_time),
                    'end_time': str(schedule.end_time),
                    'subject': schedule.subject.nom if schedule.subject else 'N/A',
                    'teacher': f"{schedule.Teacher.prenom} {schedule.Teacher.nom}" if schedule.Teacher else 'N/A',
                    'classe': schedule.classe.name if schedule.classe else 'N/A',
                    'notes': schedule.notes or '',
                })
            return Response(response_data, status=status.HTTP_200_OK)
        except Parent.DoesNotExist:
            return Response({"detail": "Parent profile not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": f"Error fetching schedules: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ParentChildGradesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            parent = Parent.objects.get(user_account=request.user)
            students = Student.objects.filter(parents=parent)
            grades = Grades.objects.filter(student__in=students)
            serializer = GradesSerializer(grades, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Parent.DoesNotExist:
            return Response({"error": "Parent profile not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"Error fetching grades: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ParentChildrenListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            parent = Parent.objects.get(user_account=request.user)
            students = Student.objects.filter(parents=parent)
            serializer = StudentSerializer(students, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Parent.DoesNotExist:
            return Response({"error": "Parent profile not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error fetching children: {str(e)}")
            return Response({"error": f"Error fetching children: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ParentChildrenAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            parent = Parent.objects.get(user_account=request.user)
            students = Student.objects.filter(parents=parent)
            attendance = Attendance.objects.filter(student__in=students)
            attendance_data = {}
            for student in students:
                student_attendance = attendance.filter(student=student)
                attendance_data[str(student.id)] = {
                    f"{record.date}-{record.schedule.id}": record.status.lower()
                    for record in student_attendance
                }
            return Response(attendance_data, status=status.HTTP_200_OK)
        except Parent.DoesNotExist:
            return Response({"error": "Parent profile not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error fetching attendance: {str(e)}")
            return Response({"error": f"Error fetching attendance: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ParentChildScheduleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        try:
            parent = Parent.objects.get(user_account=request.user)
            student = Student.objects.get(id=student_id, parents=parent)
            schedules = Schedules_st.objects.filter(level=student.level)
            serializer = SchedulesStSerializer(schedules, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Parent.DoesNotExist:
            return Response({"error": "Parent profile not found"}, status=status.HTTP_404_NOT_FOUND)
        except Student.DoesNotExist:
            return Response({"error": "Student not found or not linked to parent"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error fetching schedule for student {student_id}: {str(e)}")
            return Response({"error": f"Error fetching schedule: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ParentChildAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        logger.debug(f"Request user: {request.user}, query params: {request.query_params}")
        try:
            parent = get_object_or_404(Parent, mail=request.user.email)
            logger.debug(f"Parent found: {parent}")
            students = parent.students.all()
            student_ids = students.values_list('id', flat=True)
            logger.debug(f"Student IDs: {list(student_ids)}")
            attendances = Attendance.objects.filter(student__id__in=student_ids, admin=request.user)
            student_id = request.query_params.get('student_id')
            date = request.query_params.get('date')
            attendance_status = request.query_params.get('status')  # Renamed to avoid shadowing

            if student_id:
                attendances = attendances.filter(student__id=student_id)
            if date:
                try:
                    datetime.strptime(date, '%Y-%m-%d')
                    attendances = attendances.filter(date=date)
                except ValueError:
                    return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
            if attendance_status:
                attendances = attendances.filter(status=attendance_status)

            serializer = AttendanceSerializer(attendances, many=True)
            logger.debug(f"Returning {len(serializer.data)} attendance records")
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Parent.DoesNotExist:
            logger.error("Parent profile not found")
            return Response({"error": "Parent profile not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error fetching attendance: {str(e)}", exc_info=True)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
from django.core.mail import send_mail



class ParentDeleteView(APIView):
    def delete(self, request, pk):
        try:
            parent = Parent.objects.get(pk=pk)
            if parent.students.exists():
                return Response(
                    {"detail": "Cannot delete parent with associated students."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            parent.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Parent.DoesNotExist:
            return Response(
                {"detail": "Parent not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": f"Database error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )