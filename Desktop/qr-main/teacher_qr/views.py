from decimal import Decimal
from venv import logger
from django.db import IntegrityError
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings
from student_qr.serializers import GradesSerializer, StudentSerializer
from teacher_qr.models.attendance_t import Attendance_t
from .models import Teacher, Grades, Classe, Subject, Schedule_t
from .serializers import (
    TeacherSerializer,
    ClasseSerializer,
    SubjectSerializer,
    ScheduleTSerializer,
    AttendanceTSerializer,
)
from student_qr.models import Student, Level
from users.models import CustomUser
from datetime import datetime
import random
import string
from rest_framework.decorators import api_view, permission_classes
from channels.layers import get_channel_layer  # Import for WebSocket
from asgiref.sync import async_to_sync
class TeacherQRCodeView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk):
        try:
            teacher = get_object_or_404(Teacher, pk=pk, admin=request.user)
            qr = qrcode.QRCode(version=1, box_size=10, border=4)
            qr_data = (
                f"Nom: {teacher.nom}\n"
                f"Prenom: {teacher.prenom}\n"
                f"Adresse: {teacher.adresse}\n"
                f"Email: {teacher.mail}\n"
                f"Numero: {teacher.numero}\n"
                f"Photo: {teacher.photo.url if teacher.photo else 'N/A'}\n"
            )
            qr.add_data(qr_data)
            qr.make(fit=True)
            img = qr.make_image(fill="black", back_color="white")
            buffer = BytesIO()
            img.save(buffer, format="PNG")
            buffer.seek(0)
            return HttpResponse(buffer, content_type="image/png")
        except Exception as e:
            logger.error(f"Error generating QR code for teacher ID {pk}: {str(e)}")
            return HttpResponse(status=500)
        
# Helper function to generate a random password
def generate_random_password(length=12):
    characters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(random.choice(characters) for _ in range(length))
class ReceiveQRDataTView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        qr_data = request.data.get('qr_data')
        if not qr_data:
            return Response({"status": "error", "message": "QR data not provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            lines = qr_data.split("\n")
            user_info = {line.split(":", 1)[0].strip(): line.split(":", 1)[1].strip() for line in lines if ":" in line}
            teacher_email = user_info.get("Email")
            if not teacher_email:
                return Response({"status": "error", "message": "Email not found in QR data"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": "error", "message": f"Invalid QR data format: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        teacher = Teacher.objects.filter(mail=teacher_email).first()
        if not teacher:
            return Response({"status": "error", "message": "Teacher not found"}, status=status.HTTP_404_NOT_FOUND)
        if teacher.admin != request.user and request.user.role != 'teacher':
            return Response({"status": "error", "message": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        current_time = timezone.now()
        current_day = current_time.strftime('%a').upper()[:3]
        current_date = current_time.date()

        schedules = Schedule_t.objects.filter(teacher=teacher, day=current_day)
        if not schedules.exists():
            print(f"No schedules found for teacher {teacher.id} on {current_day}")
            async_to_sync(get_channel_layer().group_send)(
                f"attendance_{teacher.id}",
                {"type": "attendance_update", "teacherId": teacher.id, "status": "error", "date": current_date.isoformat(), "subjectId": 0}
            )
            return Response({"status": "error", "message": "No class scheduled now"}, status=status.HTTP_400_BAD_REQUEST)

        current_schedule = None
        for schedule in schedules:
            start_time = timezone.make_aware(datetime.combine(current_date, schedule.start_time))
            end_time = timezone.make_aware(datetime.combine(current_date, schedule.end_time))
            if start_time <= current_time <= end_time:
                current_schedule = schedule
                break

        if not current_schedule:
            print(f"No active schedule for teacher {teacher.id} at {current_time}")
            async_to_sync(get_channel_layer().group_send)(
                f"attendance_{teacher.id}",
                {"type": "attendance_update", "teacherId": teacher.id, "status": "error", "date": current_date.isoformat(), "subjectId": 0}
            )
            return Response({"status": "error", "message": "No class scheduled now"}, status=status.HTTP_400_BAD_REQUEST)

        grace_period = start_time + timedelta(minutes=15)
        status_value = 'present' if current_time <= grace_period else 'absent'

        attendance, created = Attendance_t.objects.update_or_create(
            teacher=teacher,
            date__date=current_date,
            subject=current_schedule.subject,
            admin=request.user,
            defaults={
                'status': status_value,
                'subject': current_schedule.subject,
                'date': current_time
            }
        )
        async_to_sync(get_channel_layer().group_send)(
            f"attendance_{teacher.id}",
            {
                "type": "attendance_update",
                "teacherId": teacher.id,
                "date": current_date.isoformat(),
                "subjectId": current_schedule.subject.id,
                "status": status_value
            }
        )
        return Response({"status": "success", "message": f"Marked {status_value}"}, status=status.HTTP_200_OK)
class TeacherListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        teachers = Teacher.objects.filter(admin=request.user)
        serializer = TeacherSerializer(teachers, many=True)
        return Response(serializer.data)
class TeacherCreateView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        data = request.data
        if Teacher.objects.filter(mail=data["mail"], admin=request.user).exists():
            return Response({"error": "Email already in use"}, status=400)
        date_naissance = datetime.strptime(data["date_naissance"], "%Y-%m-%d").date() if data.get("date_naissance") else None
        subject = get_object_or_404(Subject, id=data["subject"], admin=request.user)
        teacher = Teacher(
            admin=request.user, nom=data["nom"], prenom=data["prenom"], date_naissance=date_naissance, subject=subject,
            adresse=data.get("adresse", "Unknown"), mail=data["mail"], numero=data["numero"],
            photo=request.FILES.get("photo") if "photo" in request.FILES else None
        )
        teacher.save()
        if "levels" in data:
            teacher.levels.set(data["levels"])
        serializer = TeacherSerializer(teacher)
        return Response(serializer.data, status=201)

class TeacherAccountUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    def put(self, request, pk):
        teacher = get_object_or_404(Teacher, pk=pk, admin=request.user)
        data = request.data

        if not teacher.is_account_created:
            return Response({"error": "No account exists for this teacher"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = CustomUser.objects.get(email=teacher.mail)
        except CustomUser.DoesNotExist:
            return Response({"error": "Associated user account not found"}, status=status.HTTP_404_NOT_FOUND)

        date_naissance = (
            datetime.strptime(data["date_naissance"], "%Y-%m-%d").date()
            if data.get("date_naissance") else teacher.date_naissance
        )
        teacher.nom = data.get("nom", teacher.nom)
        teacher.prenom = data.get("prenom", teacher.prenom)
        teacher.date_naissance = date_naissance
        teacher.subject = get_object_or_404(Subject, id=data.get("subject", teacher.subject.id), admin=request.user)
        teacher.adresse = data.get("adresse", teacher.adresse)
        new_mail = data.get("mail", teacher.mail)
        if new_mail != teacher.mail and CustomUser.objects.filter(email=new_mail).exclude(id=user.id).exists():
            return Response({"error": "New email already in use"}, status=400)
        teacher.mail = new_mail
        teacher.numero = data.get("numero", teacher.numero)
        if "photo" in request.FILES:
            teacher.photo = request.FILES["photo"]
        if "levels" in data:
            teacher.levels.set(data["levels"])

        user.username = data.get("username", user.username)
        user.email = teacher.mail
        user.first_name = teacher.prenom
        user.last_name = teacher.nom
        user.is_active = data.get("status", "Active") == "Active"
        teacher.status = "Active" if user.is_active else "Inactive"

        teacher.save()
        user.save()

        serializer = TeacherSerializer(teacher)
        return Response({
            "teacher": serializer.data,
            "account": {
                "username": user.username,
                "email": user.email,
                "status": "Active" if user.is_active else "Inactive",
                "role": user.role
            }
        }, status=status.HTTP_200_OK)

class TeacherDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, pk):
        teacher = get_object_or_404(Teacher, pk=pk, admin=request.user)
        teacher.delete()
        return Response({"message": "Teacher deleted successfully"}, status=204)


# teacher_qr/views.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.http import HttpResponse, JsonResponse
from .models import Teacher, Subject, Classe
from .serializers import TeacherSerializer, SubjectSerializer, ClasseSerializer
from student_qr.models import Student, Schedules_st, Level, Attendance  # Add Attendance import
from student_qr.serializers import StudentSerializer, SchedulesStSerializer, LevelSerializer, AttendanceSerializer
from datetime import datetime, timedelta, timezone
import json
import qrcode
from io import BytesIO

# ... other imports and views ...

class TeacherDetailView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk):
        teacher = get_object_or_404(Teacher, pk=pk, admin=request.user)
        schedules = Schedules_st.objects.filter(Teacher=teacher, admin=request.user)
        attendances = Attendance.objects.filter(schedule__Teacher=teacher, admin=request.user)
        students = Student.objects.filter(level__in=teacher.levels.all(), admin=request.user).distinct()
        # Filter grades by the teacher's subject
        grades = Grades.objects.filter(admin=request.user, subject=teacher.subject)
        
        teacher_serializer = TeacherSerializer(teacher)
        schedules_serializer = SchedulesStSerializer(schedules, many=True)
        attendance_serializer = AttendanceSerializer(attendances, many=True)
        student_serializer = StudentSerializer(students, many=True)
        grades_serializer = GradesSerializer(grades, many=True)
        
        return Response({
            "teacher": teacher_serializer.data,
            "schedules": schedules_serializer.data,
            "attendances": attendance_serializer.data,
            "students": student_serializer.data,
            "grades": grades_serializer.data
        })

# ... rest of the views ...

class GradesListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        student_id = request.query_params.get("student")
        teacher_id = request.query_params.get("teacher")
        grades = Grades.objects.filter(admin=request.user)
        
        if student_id:
            grades = grades.filter(student__id=student_id)
        if teacher_id:
            teacher = get_object_or_404(Teacher, id=teacher_id, admin=request.user)
            students = teacher.students.all()
            student_ids = [student.id for student in students]
            grades = grades.filter(student__id__in=student_ids)
            
        serializer = GradesSerializer(grades, many=True)
        return Response(serializer.data)

class GradesCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Ensure the user is a teacher
            if request.user.role != 'teacher':
                return Response(
                    {"error": "Only teachers can add grades"},
                    status=status.HTTP_403_FORBIDDEN
                )

            data = request.data
            # Fetch the teacher based on the authenticated user's email
            teacher = get_object_or_404(Teacher, mail=request.user.email)

            # Fetch the student without admin filter, but validate ownership
            student = get_object_or_404(Student, id=data["student"])
            if student.level not in teacher.levels.all():
                return Response(
                    {"error": "You can only grade students in your assigned levels"},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Verify the subject matches the teacher's subject
            if int(data["subject"]) != teacher.subject.id:
                return Response(
                    {"error": "You can only grade your subject"},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Fetch subject and level without admin filter
            subject = get_object_or_404(Subject, id=data["subject"])
            level = get_object_or_404(Level, id=data["level"])

            # Create the grade
            grade = Grades(
                student=student,
                subject=subject,
                grade=Decimal(data["grade"]),
                grade_type=data.get("grade_type", "Test1"),
                level=level,
                date_g=datetime.strptime(data["date_g"], "%Y-%m-%d").date()
                # admin=request.user  # Uncomment if the model requires it and set null=True, blank=True
            )
            grade.save()

            serializer = GradesSerializer(grade)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except KeyError as e:
            return Response(
                {"error": f"Missing field: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except ValueError as e:
            return Response(
                {"error": f"Invalid data format: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Teacher.DoesNotExist:
            return Response(
                {"error": "Teacher profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Student.DoesNotExist:
            return Response(
                {"error": "Student not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Subject.DoesNotExist:
            return Response(
                {"error": "Subject not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Level.DoesNotExist:
            return Response(
                {"error": "Level not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to add grade: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
class GradesUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    def put(self, request, grade_id):
        grade = get_object_or_404(Grades, id=grade_id, admin=request.user)
        data = request.data
        grade.student_id = data.get("student", grade.student.id)
        grade.subject_id = data.get("subject", grade.subject.id)
        grade.grade = Decimal(data.get("grade", grade.grade))
        grade.grade_type = data.get("grade_type", grade.grade_type)
        grade.level_id = data.get("level", grade.level.id)
        grade.date_g = datetime.strptime(data.get("date_g", grade.date_g.isoformat() if grade.date_g else datetime.now().isoformat().split("T")[0]), "%Y-%m-%d").date()
        grade.save()
        serializer = GradesSerializer(grade)
        return Response(serializer.data)

class GradesDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, grade_id):
        grade = get_object_or_404(Grades, id=grade_id, admin=request.user)
        grade.delete()
        return Response({"message": "Grade deleted"}, status=204)

class SubjectListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            if request.user.role == 'teacher':
                teacher = get_object_or_404(Teacher, mail=request.user.email)
                # Get subjects from the teacher's schedules
                subjects = Subject.objects.filter(schedule_t__teacher=teacher).distinct()
            else:
                subjects = Subject.objects.filter(admin=request.user)
            serializer = SubjectSerializer(subjects, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class SubjectCreateView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        data = request.data
        subject = Subject(admin=request.user, nom=data["nom"], description=data["description"])
        subject.save()
        serializer = SubjectSerializer(subject)
        return Response(serializer.data, status=201)

class SubjectDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, subject_id):
        subject = get_object_or_404(Subject, id=subject_id, admin=request.user)
        subject.delete()
        return Response({"message": "Subject deleted"}, status=204)

class ClasseListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            # If user is a teacher, get classes they teach
            if request.user.role == 'teacher':
                teacher = get_object_or_404(Teacher, mail=request.user.email)
                classes = Classe.objects.filter(schedule_t__teacher=teacher).distinct()
            else:
                classes = Classe.objects.filter(admin=request.user)
            serializer = ClasseSerializer(classes, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class ClasseCreateView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        data = request.data
        classe = Classe(admin=request.user, name=data["name"], capacity=data["capacity"])
        classe.save()
        serializer = ClasseSerializer(classe)
        return Response(serializer.data, status=201)

# Add missing update view
class ClasseUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    def put(self, request, id):
        classe = get_object_or_404(Classe, id=id, admin=request.user)
        data = request.data
        classe.name = data.get("name", classe.name)
        classe.capacity = data.get("capacity", classe.capacity)
        classe.save()
        serializer = ClasseSerializer(classe)
        return Response(serializer.data)

class ClasseDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, id):
        classe = get_object_or_404(Classe, id=id, admin=request.user)
        classe.delete()
        return Response({"message": "Room deleted successfully"}, status=204)

class ScheduleTListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, teacher_id):
        try:
            # Allow teachers to access their own schedules without admin filter
            if request.user.role == 'teacher':
                teacher = get_object_or_404(Teacher, mail=request.user.email)
                if teacher.id != teacher_id:
                    return Response({"error": "Unauthorized"}, status=403)
                schedules = Schedule_t.objects.filter(teacher_id=teacher_id)  # Remove admin filter
            else:
                # Keep admin filter for non-teacher users (e.g., admin users)
                schedules = Schedule_t.objects.filter(teacher_id=teacher_id, admin=request.user)
            serializer = ScheduleTSerializer(schedules, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
class ScheduleTCreateView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        data = request.data
        schedule = Schedule_t(
            admin=request.user, day=data["day"], teacher_id=data["teacher"], classe_id=data["classe"],
            subject_id=data["subject"], start_time=data["start_time"], end_time=data["end_time"], notes=data.get("notes")
        )
        schedule.save()
        serializer = ScheduleTSerializer(schedule)
        return Response(serializer.data, status=201)

class ScheduleTUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    def put(self, request, schedule_id):
        schedule = get_object_or_404(Schedule_t, id=schedule_id, admin=request.user)
        data = request.data
        schedule.day = data.get("day", schedule.day)
        schedule.teacher_id = data.get("teacher", schedule.teacher.id)
        schedule.classe_id = data.get("classe", schedule.classe.id)
        schedule.subject_id = data.get("subject", schedule.subject.id)
        schedule.start_time = data.get("start_time", schedule.start_time)
        schedule.end_time = data.get("end_time", schedule.end_time)
        schedule.notes = data.get("notes", schedule.notes)
        schedule.save()
        serializer = ScheduleTSerializer(schedule)
        return Response(serializer.data)

class ScheduleTDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, schedule_id):
        schedule = get_object_or_404(Schedule_t, id=schedule_id, admin=request.user)
        schedule.delete()
        return Response({"message": "Schedule deleted"}, status=204)

class AttendanceTListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            attendances = Attendance_t.objects.filter(admin=request.user)
            teacher_id = request.query_params.get("teacher")
            schedule_id = request.query_params.get("schedule_id")
            date = request.query_params.get("date")
            subject_id = request.query_params.get("subject")

            if request.user.role == 'teacher':
                teacher = get_object_or_404(Teacher, mail=request.user.email)
                if teacher_id and int(teacher_id) != teacher.id:
                    return Response({"error": "Unauthorized"}, status=403)
                attendances = Attendance_t.objects.filter(teacher=teacher)
            elif teacher_id:
                attendances = attendances.filter(teacher_id=teacher_id)

            if schedule_id:
                attendances = attendances.filter(schedule_id=schedule_id)
            if date:
                try:
                    date_obj = datetime.strptime(date, "%Y-%m-%d").date()
                    attendances = attendances.filter(date__date=date_obj)
                except ValueError:
                    return Response({"message": "Invalid date format. Use YYYY-MM-DD."}, status=400)
            if subject_id:
                attendances = attendances.filter(subject_id=subject_id)

            serializer = AttendanceTSerializer(attendances, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Failed to fetch attendance: {str(e)}", exc_info=True)
            return Response({"error": f"Failed to fetch attendance: {str(e)}"}, status=500)
import logging
class AttendanceTCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            data = request.data.copy()
            data['admin'] = request.user.id
            if 'date' not in data or not data['date']:
                return Response(
                    {"message": "Date is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer = AttendanceTSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(
                    {
                        'message': 'Attendance recorded successfully.',
                        'attendance': serializer.data
                    },
                    status=status.HTTP_201_CREATED
                )
            logger.error(f"Attendance creation errors: {serializer.errors}")
            return Response(
                {
                    'message': 'Failed to record attendance.',
                    'errors': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Failed to create attendance: {str(e)}")
            return Response(
                {"message": "Failed to create attendance. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
class AttendanceTUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        try:
            attendance = get_object_or_404(Attendance_t, pk=pk, admin=request.user)
            data = request.data.copy()
            data['admin'] = request.user.id
            serializer = AttendanceTSerializer(
                attendance,
                data=data,
                partial=True,
                context={'request': request}
            )
            if serializer.is_valid():
                serializer.save()
                return Response(
                    {
                        'message': 'Attendance updated successfully.',
                        'attendance': serializer.data
                    },
                    status=status.HTTP_200_OK
                )
            logger.error(f"Attendance update errors: {serializer.errors}")
            return Response(
                {
                    'message': 'Failed to update attendance.',
                    'errors': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        except Attendance_t.DoesNotExist:
            return Response(
                {"message": "Attendance record not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Failed to update attendance: {str(e)}")
            return Response(
                {"message": "Failed to update attendance. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
class AttendanceTDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            attendance = get_object_or_404(Attendance_t, pk=pk, admin=request.user)
            attendance.delete()
            return Response({"message": "Attendance deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Attendance_t.DoesNotExist:
            return Response({"message": "Attendance record not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Failed to delete attendance: {str(e)}")
            return Response(
                {"message": "Failed to delete attendance. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def TeacherAccountCreateView(request, teacher_id):
    teacher = get_object_or_404(Teacher, id=teacher_id, admin=request.user)
    if getattr(teacher, 'is_account_created', False):
        try:
            user = CustomUser.objects.get(email=teacher.mail)
            return Response({
                "id": teacher.id,
                "name": f"{teacher.prenom} {teacher.nom}",
                "email": user.email,
                "username": user.username,
                "password": teacher.plain_password or "Already set",
                "status": "Active" if user.is_active else "Inactive",
                "lastLogin": user.last_login.isoformat() if user.last_login else None,
                "created": user.date_joined.isoformat()
            }, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            teacher.is_account_created = False
            teacher.save()

    if CustomUser.objects.filter(email=teacher.mail).exists():
        return Response({"error": "Email already registered"}, status=400)
    password = generate_random_password()
    username = request.data.get("username", teacher.mail.split('@')[0])
    try:
        user = CustomUser.objects.create_user(
            username=username,
            email=teacher.mail,
            password=password,
            first_name=teacher.prenom,
            last_name=teacher.nom,
            role='teacher',
            is_active=True
        )
    except IntegrityError:
        return Response({"error": "Username or email already exists"}, status=status.HTTP_400_BAD_REQUEST)

    teacher.is_account_created = True
    teacher.plain_password = password
    teacher.username = username
    teacher.status = "Active"
    teacher.save()
    print(f"Teacher {teacher.id} updated: is_account_created={teacher.is_account_created}")

    try:
        send_mail(
            subject='Your Teacher Account Details',
            message=f'Username: {user.username}\nPassword: {password}\nPlease log in and change your password.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[teacher.mail],
            fail_silently=False
        )
    except Exception as e:
        return Response({
            "id": teacher.id,
            "name": f"{teacher.prenom} {teacher.nom}",
            "email": user.email,
            "username": user.username,
            "password": password,
            "status": "Active",
            "lastLogin": None,
            "created": user.date_joined.isoformat(),
            "warning": f"Account created, but email failed to send: {str(e)}"
        }, status=status.HTTP_201_CREATED)

    return Response({
        "id": teacher.id,
        "name": f"{teacher.prenom} {teacher.nom}",
        "email": user.email,
        "username": user.username,
        "password": password,
        "status": "Active",
        "lastLogin": None,
        "created": user.date_joined.isoformat()
    }, status=status.HTTP_201_CREATED)
class TeacherAccountDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, pk):
        teacher = get_object_or_404(Teacher, pk=pk, admin=request.user)
        if teacher.is_account_created:
            try:
                user = CustomUser.objects.get(email=teacher.mail)
                user.delete()
            except CustomUser.DoesNotExist:
                pass
            teacher.is_account_created = False
            teacher.username = None
            teacher.plain_password = None
            teacher.status = "Inactive"
            teacher.save()
            return Response({"message": "Teacher account deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        return Response({"message": "No account exists to delete"}, status=status.HTTP_400_BAD_REQUEST)

class TeacherAccountResetPasswordView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, pk):
        teacher = get_object_or_404(Teacher, pk=pk, admin=request.user)
        if not teacher.is_account_created:
            return Response({"error": "No account exists for this teacher"}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data
        new_password = data.get("password", generate_random_password())

        try:
            user = CustomUser.objects.get(email=teacher.mail)
            user.set_password(new_password)
            user.is_active = True
            user.save()
        except CustomUser.DoesNotExist:
            return Response({"error": "Associated user account not found"}, status=status.HTTP_404_NOT_FOUND)

        teacher.plain_password = new_password
        teacher.save()
        print(f"Password reset for teacher {teacher.id}: {new_password}")

        try:
            send_mail(
                subject="Your Teacher Account Password Has Been Reset",
                message=f"Dear {teacher.prenom} {teacher.nom},\n\nYour password has been reset.\n\nUsername: {user.username}\nNew Password: {new_password}\n\nPlease log in and change your password.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[teacher.mail],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Failed to send email: {e}")

        return Response({"message": "Password reset successfully", "new_password": new_password}, status=status.HTTP_200_OK)

class CurrentteacherProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            teacher = get_object_or_404(Teacher, mail=request.user.email)
            teacher_data = {
                "name": f"{teacher.prenom} {teacher.nom}",
                "photo": request.build_absolute_uri(teacher.photo.url) if teacher.photo else None,
                "teacher": str(teacher.id),
                "subject": {
                    "id": teacher.subject.id if teacher.subject else None,
                    "nom": teacher.subject.nom if teacher.subject else None
                }
            }
            return Response(teacher_data, status=status.HTTP_200_OK)
        except Teacher.DoesNotExist:
            return Response({"error": "Teacher profile not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CurrentteacherScheduleView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            # Get the teacher associated with the logged-in user
            teacher = get_object_or_404(Teacher, mail=request.user.email)
            
            # Fetch schedules for the teacher
            schedules = Schedule_t.objects.filter(teacher=teacher)
            
            # Serialize the data
            serializer = ScheduleTSerializer(schedules, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Teacher.DoesNotExist:
            return Response({"error": "Teacher profile not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class AttendanceTListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            attendances = Attendance_t.objects.filter(admin=request.user)
            teacher_id = request.query_params.get("teacher")
            schedule_id = request.query_params.get("schedule_id")
            date = request.query_params.get("date")

            if teacher_id:
                attendances = attendances.filter(teacher_id=teacher_id)
            if schedule_id:
                attendances = attendances.filter(schedule_id=schedule_id)
            if date:
                try:
                    date_obj = datetime.strptime(date, "%Y-%m-%d").date()
                    attendances = attendances.filter(date=date_obj)  # Direct filter on DateField
                except ValueError:
                    return Response(
                        {"message": "Invalid date format. Use YYYY-MM-DD."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            serializer = AttendanceTSerializer(attendances, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Failed to fetch attendance: {str(e)}")
            return Response(
                {"message": "Failed to fetch attendance. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
class GradesListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        grades = Grades.objects.filter(admin=request.user)
        student_id = request.query_params.get("student")
        teacher_id = request.query_params.get("teacher")
        if student_id:
            grades = grades.filter(student__id=student_id)
        if teacher_id:
            teacher = get_object_or_404(Teacher, id=teacher_id, admin=request.user)
            grades = grades.filter(subject=teacher.subject)
        serializer = GradesSerializer(grades, many=True)
        return Response(serializer.data)
class GradesCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Ensure the user is a teacher
            if request.user.role != 'teacher':
                return Response(
                    {"error": "Only teachers can add grades"},
                    status=status.HTTP_403_FORBIDDEN
                )

            data = request.data
            # Fetch the teacher based on the authenticated user's email
            teacher = get_object_or_404(Teacher, mail=request.user.email)

            # Fetch the student without admin filter, but validate ownership
            student = get_object_or_404(Student, id=data["student"])
            if student.level not in teacher.levels.all():
                return Response(
                    {"error": "You can only grade students in your assigned levels"},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Verify the subject matches the teacher's subject
            if int(data["subject"]) != teacher.subject.id:
                return Response(
                    {"error": "You can only grade your subject"},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Fetch subject and level without admin filter
            subject = get_object_or_404(Subject, id=data["subject"])
            level = get_object_or_404(Level, id=data["level"])

            # Create the grade
            grade = Grades(
                student=student,
                subject=subject,
                grade=Decimal(data["grade"]),
                grade_type=data.get("grade_type", "Test1"),
                level=level,
                date_g=datetime.strptime(data["date_g"], "%Y-%m-%d").date()
                # admin=request.user  # Uncomment if the model requires it and set null=True, blank=True
            )
            grade.save()

            serializer = GradesSerializer(grade)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except KeyError as e:
            return Response(
                {"error": f"Missing field: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except ValueError as e:
            return Response(
                {"error": f"Invalid data format: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Teacher.DoesNotExist:
            return Response(
                {"error": "Teacher profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Student.DoesNotExist:
            return Response(
                {"error": "Student not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Subject.DoesNotExist:
            return Response(
                {"error": "Subject not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Level.DoesNotExist:
            return Response(
                {"error": "Level not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to add grade: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
class GradesListView1(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        student_id = request.query_params.get("student")
        subject_id = request.query_params.get("subject")  # Add subject filter
        grades = Grades.objects.filter(admin=request.user)
        if student_id:
            grades = grades.filter(student__id=student_id)
        if subject_id:
            grades = grades.filter(subject__id=subject_id)
        serializer = GradesSerializer(grades, many=True)
        return Response(serializer.data)
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from teacher_qr.models import Teacher
from student_qr.models import Student, Schedules_st
from student_qr.serializers import StudentSerializer

class TeacherStudentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, teacher_id):
        try:
            # Determine if the user is a teacher or an admin
            if request.user.role == 'teacher':
                # For teachers, fetch their own profile using their email
                teacher = get_object_or_404(Teacher, id=teacher_id, mail=request.user.email)
                # Remove the admin filter for schedules and students
                schedules = Schedules_st.objects.filter(Teacher=teacher)
                students = Student.objects.filter(level__in=schedules.values_list('level__id', flat=True).distinct())
            else:
                # For admins, keep the admin filter
                teacher = get_object_or_404(Teacher, id=teacher_id, admin=request.user)
                schedules = Schedules_st.objects.filter(Teacher=teacher, admin=request.user)
                students = Student.objects.filter(level__in=schedules.values_list('level__id', flat=True).distinct(), admin=request.user)

            # If no schedules or students exist, return a 404 with a descriptive message
            if not schedules.exists():
                return Response(
                    {"error": "No schedules found for this teacher"},
                    status=status.HTTP_404_NOT_FOUND
                )

            if not students.exists():
                return Response(
                    {"error": "No students found for the teacher's levels"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Serialize the student data
            serializer = StudentSerializer(students, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Teacher.DoesNotExist:
            return Response(
                {"error": "Teacher not found or unauthorized"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# teacher_qr/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import AttendanceTSerializer

class AttendanceTListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            attendances = Attendance_t.objects.filter(admin=request.user)
            teacher_id = request.query_params.get("teacher")
            schedule_id = request.query_params.get("schedule_id")
            date = request.query_params.get("date")
            subject_id = request.query_params.get("subject")  # Add subject filter

            if teacher_id:
                attendances = attendances.filter(teacher_id=teacher_id)
            if schedule_id:
                attendances = attendances.filter(schedule_id=schedule_id)
            if date:
                try:
                    date_obj = datetime.strptime(date, "%Y-%m-%d").date()
                    attendances = attendances.filter(date=date_obj)  # Use direct filter on DateField
                except ValueError:
                    return Response(
                        {"message": "Invalid date format. Use YYYY-MM-DD."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            if subject_id:
                attendances = attendances.filter(subject_id=subject_id)

            serializer = AttendanceTSerializer(attendances, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Failed to fetch attendance: {str(e)}", exc_info=True)
            return Response(
                {"message": f"Failed to fetch attendance: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
class AttendanceTCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data.copy()
        data['admin'] = request.user.id
        if 'date' not in data or not data['date']:
            return Response(
                {"message": "Date is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = AttendanceTSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    'message': 'Attendance recorded successfully.',
                    'attendance': serializer.data
                },
                status=status.HTTP_201_CREATED
            )
        logger.error(f"Attendance creation errors: {serializer.errors}")
        return Response(
            {
                'message': 'Failed to record attendance.',
                'errors': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )

class AttendanceTUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        try:
            attendance = Attendance_t.objects.get(pk=pk, admin=request.user)
            data = request.data.copy()
            data['admin'] = request.user.id
            serializer = AttendanceTSerializer(
                attendance,
                data=data,
                partial=True,
                context={'request': request}
            )
            if serializer.is_valid():
                serializer.save()
                return Response(
                    {
                        'message': 'Attendance updated successfully.',
                        'attendance': serializer.data
                    },
                    status=status.HTTP_200_OK
                )
            logger.error(f"Attendance update errors: {serializer.errors}")
            return Response(
                {
                    'message': 'Failed to update attendance.',
                    'errors': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        except Attendance_t.DoesNotExist:
            return Response(
                {"message": "Attendance record not found."},
                status=status.HTTP_404_NOT_FOUND
            )
class AttendanceTDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            attendance = Attendance_t.objects.get(pk=pk, admin=request.user)
            attendance.delete()
            return Response(status=204)
        except Attendance_t.DoesNotExist:
            return Response({"detail": "Attendance record not found"}, status=404)
class GradesUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    def put(self, request, grade_id):
        grade = get_object_or_404(Grades, id=grade_id, admin=request.user)
        data = request.data
        grade.student_id = data.get("student", grade.student.id)
        grade.subject_id = data.get("subject", grade.subject.id)
        grade.grade = Decimal(data.get("grade", grade.grade))
        grade.grade_type = data.get("grade_type", grade.grade_type)
        grade.level_id = data.get("level", grade.level.id)
        grade.date_g = datetime.strptime(data.get("date_g", grade.date_g.isoformat() if grade.date_g else datetime.now().isoformat().split("T")[0]), "%Y-%m-%d").date()
        grade.save()
        serializer = GradesSerializer(grade)
        return Response(serializer.data)
    
class GradesDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, grade_id):
        grade = get_object_or_404(Grades, id=grade_id, admin=request.user)
        grade.delete()
        return Response({"message": "Grade deleted"}, status=204)
class TeacherByIdView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            teacher = get_object_or_404(Teacher, pk=pk)
            if teacher.mail != request.user.email and teacher.admin != request.user:
                return Response(
                    {"error": "You do not have permission to view this teacher's details"},
                    status=status.HTTP_403_FORBIDDEN
                )
            serializer = TeacherSerializer(teacher)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
class LevelListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            if request.user.role == 'teacher':
                try:
                    teacher = Teacher.objects.get(mail=request.user.email)
                    # Fetch levels directly from the teacher's levels field
                    levels = teacher.levels.all()
                    logger.info(f"Fetched {levels.count()} levels for teacher {teacher.id}")
                except Teacher.DoesNotExist:
                    logger.warning(f"No teacher found for email {request.user.email}")
                    return Response({"error": "Teacher profile not found"}, status=status.HTTP_404_NOT_FOUND)
            else:
                # Admins can see all their levels
                levels = Level.objects.filter(admin=request.user)
                logger.info(f"Fetched {levels.count()} levels for admin {request.user.id}")

            serializer = LevelSerializer(levels, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching levels: {str(e)}", exc_info=True)
            return Response({"error": f"Failed to fetch levels: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      