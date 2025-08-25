# views.py
from venv import logger
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.http import HttpResponse, JsonResponse

from parent.models.parent import Parent
from teacher_qr.models.schedule_t import Schedule_t
from teacher_qr.serializers import SubjectSerializer, TeacherSerializer
from users.models import CustomUser
from .models import Student, Grades, Schedules_st, Level, Attendance
from .serializers import StudentSerializer, GradesSerializer, SchedulesStSerializer, LevelSerializer, AttendanceSerializer, StudentWithParentSerializer
from teacher_qr.models import Teacher, Subject, Classe
from datetime import datetime, timedelta, timezone
import json
from decimal import Decimal
import qrcode  # Import qrcode library
from io import BytesIO  # For handling image buffering
from rest_framework.decorators import action
from django.contrib.auth.models import User
from rest_framework import serializers, viewsets
from rest_framework.response import Response
from channels.layers import get_channel_layer


from asgiref.sync import async_to_sync

class ReceiveQRDataView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        qr_data = request.data.get('qr_data')
        if not qr_data:
            return Response({'error': 'No QR data provided'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'message': 'Student QR data received', 'data': qr_data}, status=status.HTTP_200_OK)


class StudentListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        students = Student.objects.filter(admin=request.user)
        serializer = StudentSerializer(students, many=True)
        return Response(serializer.data)
    
class StudentCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = StudentSerializer(data=request.data)
        if serializer.is_valid():
            student = serializer.save(admin=request.user)
            return Response(StudentSerializer(student).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class StudentWithParentCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = StudentWithParentSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            try:
                student = serializer.save(admin=request.user)
                return Response(StudentSerializer(student).data, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({"detail": f"Error creating student: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class StudentUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        try:
            student = get_object_or_404(Student, id=pk, admin=request.user)
            serializer = StudentSerializer(
                student,
                data=request.data,
                partial=True,
                context={'request': request}  # Pass the request in context
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error updating student {pk}: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
class StudentDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, pk):
        student = get_object_or_404(Student, id=pk, admin=request.user)
        student.delete()
        return Response({"message": "Student deleted"}, status=204)

class StudentDetailView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk):
        student = get_object_or_404(Student, pk=pk, admin=request.user)
        grades = Grades.objects.filter(student=student, admin=request.user)
        schedules = Schedules_st.objects.filter(level=student.level, admin=request.user)
        attendance = Attendance.objects.filter(student=student, admin=request.user)
        
        grades_data = [{"course": g.subject.nom, "assignment": g.grade_type, "score": float(g.grade), "max_score": 20} for g in grades]
        DAY_MAP = {'MON': 'Monday', 'TUE': 'Tuesday', 'WED': 'Wednesday', 'THU': 'Thursday', 'FRI': 'Friday', 'SAT': 'Saturday', 'SUN': 'Sunday'}
        schedules_data = [
            {
                "day": DAY_MAP.get(s.day, s.day),
                "courses": [{
                    "id": s.id, "name": s.subject.nom, "time": f"{s.start_time.strftime('%H:%M')} - {s.end_time.strftime('%H:%M')}",
                    "room": s.classe.name if s.classe else "N/A", "grade": get_grade_for_subject(student, s.subject),
                    "teacher": f"{s.Teacher.prenom} {s.Teacher.nom}" if s.Teacher else "N/A"
                }]
            } for s in schedules
        ]
        attendance_data = [{"date": a.date.isoformat(), "status": a.status} for a in attendance]
        
        student_data = {
            "id": str(student.id), "nom": student.nom, "prenom": student.prenom, "level": student.level.level if student.level else "N/A",
            "photo": student.photo.url if student.photo else None, "email": student.mail, "phone": student.numero,
            "birthdate": student.date_naissance.isoformat() if student.date_naissance else None, "address": student.adresse,
            "enrollmentDate": student.admission_s, "major": "Computer Science", "gpa": calculate_gpa(grades_data),
            "attendance": f"{calculate_attendance_percentage(attendance)}%", "courses": extract_courses(schedules, grades_data),
            "achievements": [], "attendance_records": attendance_data, "grades": grades_data, "schedule": schedules_data
        }
        return Response(student_data)

# Add QRCodeView here
class QRCodeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            student = get_object_or_404(Student, pk=pk, admin=request.user)
            print(f"Generating QR code for student ID: {pk}, Name: {student.nom} {student.prenom}")  # Debug log
            qr = qrcode.QRCode(version=1, box_size=10, border=4)
            qr.add_data(f"STUDENT_ID:{student.id}-{student.nom}-{student.prenom}")
            qr.make(fit=True)
            img = qr.make_image(fill="black", back_color="white")
            buffer = BytesIO()
            img.save(buffer, format="PNG")
            buffer.seek(0)
            return HttpResponse(buffer, content_type="image/png")
        except Exception as e:
            print(f"Error generating QR code for student ID {pk}: {str(e)}")  # Detailed error log
            return HttpResponse(status=500)

class LevelListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            # If user is a teacher, get levels they teach
            if request.user.role == 'teacher':
                teacher = get_object_or_404(Teacher, mail=request.user.email)
                levels = Level.objects.filter(schedule_t__teacher=teacher).distinct()
            else:
                levels = Level.objects.filter(admin=request.user)
            serializer = LevelSerializer(levels, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
class LevelCreateView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        data = request.data
        level = Level(admin=request.user, level=data["level"])
        level.save()
        serializer = LevelSerializer(level)
        return Response(serializer.data, status=201)

class LevelDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, level_id):
        level = get_object_or_404(Level, id=level_id, admin=request.user)
        level.delete()
        return Response({"message": "Level deleted"}, status=204)

class SchedulesListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        schedules = Schedules_st.objects.filter(admin=request.user)
        serializer = SchedulesStSerializer(schedules, many=True)
        return Response(serializer.data)

class SchedulesCreateView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        data = request.data
        schedule = Schedules_st(
            admin=request.user, subject_id=data["subject"], day=data["day"], start_time=data["start_time"],
            end_time=data["end_time"], Teacher_id=data["Teacher"], classe_id=data["classe"], level_id=data["level"],
            notes=data.get("notes", "")
        )
        schedule.save()
        serializer = SchedulesStSerializer(schedule)
        return Response(serializer.data, status=201)

class SchedulesUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    def put(self, request, schedule_id):
        schedule = get_object_or_404(Schedules_st, id=schedule_id, admin=request.user)
        data = request.data
        schedule.day = data.get("day", schedule.day)
        schedule.Teacher_id = data.get("Teacher", schedule.Teacher.id)
        schedule.level_id = data.get("level", schedule.level.id)
        schedule.classe_id = data.get("classe", schedule.classe.id)
        schedule.subject_id = data.get("subject", schedule.subject.id)
        schedule.start_time = data.get("start_time", schedule.start_time)
        schedule.end_time = data.get("end_time", schedule.end_time)
        schedule.notes = data.get("notes", schedule.notes)
        schedule.save()
        serializer = SchedulesStSerializer(schedule)
        return Response(serializer.data)

class SchedulesDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, schedule_id):
        schedule = get_object_or_404(Schedules_st, id=schedule_id, admin=request.user)
        schedule.delete()
        return Response({"message": "Schedule deleted successfully"}, status=204)

class SchedulesByLevelView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, level_id):
        try:
            level = get_object_or_404(Level, id=level_id, admin=request.user)
            schedules = Schedules_st.objects.filter(level=level, admin=request.user)
            print(f"Schedules for level {level_id}, admin {request.user.id}: {schedules.count()}")
            serializer = SchedulesStSerializer(schedules, many=True)
            print('Serialized schedules:', serializer.data)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error fetching schedules for level {level_id}: {str(e)}")
            return Response([], status=200)  # Return empty list to avoid breaking frontend

class AttendanceListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, student_id):
        student = get_object_or_404(Student, id=student_id, admin=request.user)
        attendances = Attendance.objects.filter(student=student, admin=request.user)
        data = {f"{a.date.strftime('%Y-%m-%d')}-{a.schedule.id}": a.status for a in attendances}
        return Response(data)

class AttendanceCreateUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        data = request.data
        student = get_object_or_404(Student, id=data["student_id"], admin=request.user)
        schedule = get_object_or_404(Schedules_st, id=data["schedule_id"], admin=request.user)
        date = datetime.strptime(data["date"], "%Y-%m-%d").date()
        status_value = data["status"].lower()  # Normalize status to lowercase
        existing = Attendance.objects.filter(student=student, schedule=schedule, date=date, admin=request.user).first()
        if existing:
            existing.status = status_value
            existing.save()
            attendance = existing
            created = False
        else:
            attendance = Attendance(admin=request.user, student=student, schedule=schedule, date=date, status=status_value)
            attendance.save()
            created = True

        # Send WebSocket update
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "attendance_group",
            {
                "type": "attendance_update",
                "studentId": student.id,
                "scheduleId": schedule.id,
                "date": data["date"],
                "status": status_value  # Send lowercase status
                
            }
        )
        serializer = AttendanceSerializer(attendance)
        return Response({"message": "Attendance updated successfully", "status": attendance.status, "created": created, "id": attendance.id}, status=201)

class AttendanceDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, student_id, schedule_id, date):
        student = get_object_or_404(Student, id=student_id, admin=request.user)
        schedule = get_object_or_404(Schedules_st, id=schedule_id, admin=request.user)
        date_obj = datetime.strptime(date, "%Y-%m-%d").date()
        attendance = get_object_or_404(Attendance, student=student, schedule=schedule, date=date_obj, admin=request.user)
        attendance.delete()
        return Response({"message": "Attendance deleted successfully"}, status=204)

class GradesListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        student_id = request.query_params.get("student")
        grades = Grades.objects.filter(admin=request.user)
        if student_id:
            grades = grades.filter(student__id=student_id)
            serializer = StudentGradesSerializer(grades, many=True)  # Use StudentGradesSerializer
        else:
            serializer = GradesSerializer(grades, many=True)
        print(f"Grades for user {request.user.id}, student {student_id or 'all'}: {serializer.data}")
        return Response(serializer.data)

class GradesCreateView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        data = request.data
        student = get_object_or_404(Student, id=data["student"], admin=request.user)
        subject = get_object_or_404(Subject, id=data["subject"], admin=request.user)
        level = get_object_or_404(Level, id=data["level"], admin=request.user)
        grade = Grades(admin=request.user, student=student, subject=subject, grade=Decimal(data["grade"]), grade_type=data["grade_type"], level=level)
        grade.save()
        serializer = GradesSerializer(grade)
        return Response(serializer.data, status=201)

class GradesUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    def put(self, request, grade_id):
        grade = get_object_or_404(Grades, id=grade_id, admin=request.user)
        data = request.data
        grade.student = get_object_or_404(Student, id=data.get("student", grade.student.id), admin=request.user)
        grade.subject = get_object_or_404(Subject, id=data.get("subject", grade.subject.id), admin=request.user)  # Validate subject
        grade.grade = Decimal(data.get("grade", grade.grade))
        grade.grade_type = data.get("grade_type", grade.grade_type)
        grade.level = get_object_or_404(Level, id=data.get("level", grade.level.id), admin=request.user)
        grade.save()
        serializer = StudentGradesSerializer(grade)  # Use StudentGradesSerializer
        return Response(serializer.data)
class GradesDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, grade_id):
        grade = get_object_or_404(Grades, id=grade_id, admin=request.user)
        grade.delete()
        return Response({"message": "Grade deleted"}, status=204)

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        current_students = Student.objects.filter(admin=request.user).count()
        current_teachers = Teacher.objects.filter(admin=request.user).count()
        current_rooms = Classe.objects.filter(admin=request.user).count()
        baseline_students, baseline_teachers, baseline_rooms = 1000, 70, 35
        def calculate_increase(current, baseline):
            return 0.0 if baseline == 0 else round(((current - baseline) / baseline) * 100, 1)
        stats = {
            "students": {"total": current_students, "increase": calculate_increase(current_students, baseline_students)},
            "teachers": {"total": current_teachers, "increase": calculate_increase(current_teachers, baseline_teachers)},
            "rooms": {"total": current_rooms, "increase": calculate_increase(current_rooms, baseline_rooms)},
        }
        return Response(stats)
from django.contrib.auth.models import User
from django.core.mail import send_mail
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from student_qr.models import Student
import random
import string
# Helper functions (assumed to be defined elsewhere)
def calculate_gpa(grades_data): ...
def calculate_attendance_percentage(attendance_records): ...
def extract_courses(schedules, grades_data): ...
def get_grade_for_subject(student, subject): ...
def convert_score_to_letter(score): ...

# views.py (updated sections)
# views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from users.models import CustomUser
from student_qr.models import Student  # Assuming Student model is here
from rest_framework.views import APIView
from rest_framework import status
import random
import string

def generate_random_password(length=12):
    characters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(random.choice(characters) for _ in range(length))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_student_account(request, student_id):
    student = get_object_or_404(Student, id=student_id, admin=request.user)
    if student.is_account_created:
        user = CustomUser.objects.get(email=student.mail)
        return Response({
            "id": student.id,
            "name": f"{student.prenom} {student.nom}",
            "email": user.email,
            "username": user.username,
            "password": student.plain_password or "Already set (use reset if needed)",
            "status": "Active" if user.is_active else "Inactive",
            "lastLogin": user.last_login.isoformat() if user.last_login else None,
            "created": user.date_joined.isoformat()
        }, status=status.HTTP_200_OK)

    password = generate_random_password()
    user = CustomUser.objects.create_user(
        username=student.mail.split('@')[0],
        email=student.mail,
        password=password,
        first_name=student.prenom,
        last_name=student.nom,
        role='student'  # Set role to student
    )
    student.is_account_created = True
    student.plain_password = password
    student.save()

    # Send email (existing logic)
    subject = 'Your Student Account Details'
    message = f'''
    Hello {student.prenom} {student.nom},

    Your account has been created successfully. Below are your login details:
    Username: {user.username}
    Password: {password}

    Please log in and change your password as soon as possible.

    Regards,
    Admin Team
    '''
    from_email = 'your-email@gmail.com'
    recipient_list = [student.mail]
    try:
        send_mail(subject, message, from_email, recipient_list, fail_silently=False)
    except Exception as e:
        return Response({...})  # Existing error response

    return Response({
        "id": student.id,
        "name": f"{student.prenom} {student.nom}",
        "email": user.email,
        "username": user.username,
        "password": password,
        "status": "Active",
        "lastLogin": None,
        "created": user.date_joined.isoformat()
    }, status=status.HTTP_201_CREATED)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_student_accounts(request):
    print(f"User: {request.user}, Authenticated: {request.user.is_authenticated}, Admin: {request.user.is_staff or request.user.is_superuser}")
    students = Student.objects.filter(is_account_created=True, admin=request.user)
    data = []
    for student in students:
        user = CustomUser.objects.get(email=student.mail)
        data.append({
            "id": student.id,
            "name": f"{student.prenom} {student.nom}",
            "email": user.email,
            "username": user.username,
            "password": student.plain_password,  # Include the plain password
            "status": "Active" if user.is_active else "Inactive",
            "lastLogin": user.last_login.isoformat() if user.last_login else "Never",
            "created": user.date_joined.isoformat() if user.date_joined else "Unknown"
        })
    return Response(data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_student_account(request, student_id):
    student = get_object_or_404(Student, id=student_id, admin=request.user)
    user = get_object_or_404(CustomUser, email=student.mail)
    data = request.data
    user.username = data.get('username', user.username)
    user.email = data.get('email', user.email)
    user.is_active = data.get('status', user.is_active) == 'Active'
    user.save()
    return Response({
        "id": student.id,
        "name": f"{student.prenom} {student.nom}",
        "email": user.email,
        "username": user.username,
        "password": student.plain_password,
        "status": "Active" if user.is_active else "Inactive",
        "lastLogin": user.last_login.isoformat() if user.last_login else "Never",
        "created": user.date_joined.isoformat()
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reset_student_password(request, student_id):
    student = get_object_or_404(Student, id=student_id, admin=request.user)
    user = get_object_or_404(CustomUser, email=student.mail)
    new_password = request.data.get('password')
    if not new_password:
        return Response({"error": "Password is required"}, status=status.HTTP_400_BAD_REQUEST)
    user.set_password(new_password)
    user.save()
    student.plain_password = new_password  # Update the plain-text password
    student.save()
    return Response({"message": "Password reset successfully", "password": new_password})

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_student_account(request, student_id):
    student = get_object_or_404(Student, id=student_id, admin=request.user)
    user = get_object_or_404(CustomUser, email=student.mail)
    user.delete()
    student.is_account_created = False
    student.save()
    return Response({"message": "Account deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

# views.py
class CurrentStudentProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            student = get_object_or_404(Student, mail=request.user.email)
            student_data = {
                "name": f"{student.prenom} {student.nom}",
                "photo": request.build_absolute_uri(student.photo.url) if student.photo else None,
                "studentId": str(student.id),
                "email": student.mail,
                "prenom": student.prenom,
                "nom": student.nom,
                "level": student.level.id if student.level else None,
                "qrCode": request.build_absolute_uri(student.qr_code.url) if student.qr_code else None,
            }
            return Response(student_data, status=status.HTTP_200_OK)
        except Student.DoesNotExist:
            return Response({"error": "Student profile not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# views.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Student, Schedules_st
from .serializers import SchedulesStSerializer
from django.shortcuts import get_object_or_404

class CurrentStudentScheduleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Get the student associated with the logged-in user
            student = get_object_or_404(Student, mail=request.user.email)
            
            # Fetch schedules for the student's level
            schedules = Schedules_st.objects.filter(level=student.level, admin=student.admin)
            
            # Serialize the data
            serializer = SchedulesStSerializer(schedules, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Student.DoesNotExist:
            return Response({"error": "Student profile not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


            # New endpoints for students
# views.py
class SubjectListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            if request.user.role == 'student':
                student = get_object_or_404(Student, mail=request.user.email)
                subjects = Subject.objects.filter(
                    schedules_st__level=student.level,
                    schedules_st__admin=student.admin
                ).distinct()
            else:
                subjects = Subject.objects.filter(admin=request.user).distinct()
            serializer = SubjectSerializer(subjects, many=True)
            print(f"Subjects for user {request.user.id} (role: {request.user.role}): {serializer.data}")  # Debug log
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response({"error": "Student profile not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error fetching subjects: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StudentTeacherListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        teachers = Teacher.objects.all()  # No admin filter
        serializer = TeacherSerializer(teachers, many=True)
        return Response(serializer.data)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Grades, Student
from .serializers import StudentGradesSerializer  # Import the new serializer

class StudentGradesListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Get the student associated with the authenticated user
            student = get_object_or_404(Student, mail=request.user.email)
            # Fetch grades for this student
            grades = Grades.objects.filter(student=student, admin=student.admin)
            serializer = StudentGradesSerializer(grades, many=True)  # Use the new serializer
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Student.DoesNotExist:
            return Response({"error": "Student profile not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        from rest_framework.views import APIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from datetime import datetime
from student_qr.models import Student, Attendance
from student_qr.serializers import AttendanceSerializer

class AttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        print(f"Fetching student with ID: {student_id}")
        print(f"Authenticated user email: {request.user.email}")
        try:
            student = get_object_or_404(Student, id=student_id)
            print(f"Student found: {student.id}, {student.mail}")
            today = request.query_params.get('date', None)
            if today:
                year, month = today.split('-')[:2]
                attendance_records = Attendance.objects.filter(
                    student=student,
                    date__year=year,
                    date__month=month
                )
            else:
                year, month = datetime.now().year, datetime.now().month
                attendance_records = Attendance.objects.filter(
                    student=student,
                    date__year=year,
                    date__month=month
                )
            serializer = AttendanceSerializer(attendance_records, many=True)
            data = {f"{record['date']}-{record['schedule']}": record['status'] for record in serializer.data}
            return Response(data, status=status.HTTP_200_OK)
        except Student.DoesNotExist:
            print(f"Student with ID {student_id} not found")
            return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print("Received data:", request.data)  # Temporary debug print
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response(
                {"detail": "Both old and new passwords are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify old password
        if not user.check_password(old_password):
            return Response(
                {"detail": "Old password is incorrect"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Optional: Add password validation rules
        if len(new_password) < 8:
            return Response(
                {"detail": "New password must be at least 8 characters long"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Change password
        user.set_password(new_password)
        user.save()

        return Response(
            {"detail": "Password changed successfully"},
            status=status.HTTP_200_OK
        )
    
    from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from datetime import datetime
from student_qr.models import Student, Attendance
from student_qr.serializers import AttendanceSerializer

class StudentAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            student = get_object_or_404(Student, mail=request.user.email)
            today = request.query_params.get('date', None)
            if today:
                year, month = today.split('-')[:2]
                attendance_records = Attendance.objects.filter(
                    student=student,
                    date__year=year,
                    date__month=month
                )
            else:
                year, month = datetime.now().year, datetime.now().month
                attendance_records = Attendance.objects.filter(
                    student=student,
                    date__year=year,
                    date__month=month
                )

            serializer = AttendanceSerializer(attendance_records, many=True)
            data = {f"{record['date']}-{record['schedule_id']}": record['status'].lower() for record in serializer.data}
            print(f"Attendance records fetched for student {student.id}: {data}")
            return Response(data, status=status.HTTP_200_OK)
        except Student.DoesNotExist:
            return Response({"error": "Student profile not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
import csv
import io
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q  # Added import for Q
from .models import Student, Level
from .serializers import StudentExportSerializer
from datetime import datetime  # Added for filename timestamp

class StudentExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        level = request.query_params.get('level', 'All')
        search = request.query_params.get('search', '')

        # Filter students
        queryset = Student.objects.filter(admin=request.user)
        if level != 'All':
            try:
                level_obj = Level.objects.get(level=level, admin=request.user)
                queryset = queryset.filter(level=level_obj)
            except Level.DoesNotExist:
                queryset = queryset.none()
        if search:
            queryset = queryset.filter(
                Q(nom__icontains=search) |
                Q(prenom__icontains=search) |
                Q(id__icontains=search)
            )

        # Serialize data
        serializer = StudentExportSerializer(queryset, many=True)
        data = serializer.data

        # Create CSV response
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="students_level_{level}_{datetime.now().strftime("%Y-%m-%d")}.csv"'

        # Add UTF-8 BOM for Excel compatibility
        response.write(b'\xEF\xBB\xBF')

        writer = csv.writer(response, quoting=csv.QUOTE_ALL)
        # Write header
        writer.writerow(['ID', 'Prénom', 'Nom', 'Level', 'Email', 'Numéro', 'Admission Status', 'Date de Naissance', 'Adresse'])

        # Write data
        for item in data:
            writer.writerow([
                item['id'],
                item['prenom'] or '',
                item['nom'] or '',
                item['level'] or '',
                item['mail'] or '',
                item['numero'] or '',
                item['admission_s'] or '',
                item['date_naissance'] or '',
                item['adresse'] or ''
            ])

        return response
class TeacherScheduledStudentsView(APIView):
    def get(self, request, teacher_id):
        try:
            # Get schedules for the teacher
            schedules = Schedule_t.objects.filter(teacher_id=teacher_id)
            if not schedules.exists():
                return Response(
                    {"error": "No schedules found for this teacher"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Get levels from schedules
            level_ids = schedules.values_list('level_id', flat=True).distinct()

            # Get students enrolled in these levels
            students = Student.objects.filter(level_id__in=level_ids).distinct()
            serializer = StudentSerializer(students, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
# student_qr/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Attendance, Student
from .serializers import AttendanceSerializer

class ParentChildrenAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            parent = request.user.parent
            children = parent.students.all()  # Use 'students' instead of 'student_set'
            attendance = Attendance.objects.filter(student__in=children).select_related('schedule')
            serializer = AttendanceSerializer(attendance, many=True)
            return Response(serializer.data)
        except Parent.DoesNotExist:
            return Response({"error": "Parent profile not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)