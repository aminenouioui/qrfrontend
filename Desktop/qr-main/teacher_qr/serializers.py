from datetime import datetime
from rest_framework import serializers
from teacher_qr.models.attendance_t import Attendance_t
from .models import Teacher, Grades, Classe, Subject, Schedule_t
from student_qr.models import Level
from users.models import CustomUser

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'nom', 'description']

class ClasseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Classe
        fields = ['id', 'name', 'capacity']

class TeacherSerializer(serializers.ModelSerializer):
    subject = SubjectSerializer(read_only=True)
    class Meta:
        model = Teacher
        fields = [
            'id', 'nom', 'prenom', 'date_naissance', 'adresse', 'subject', 'mail',
            'numero', 'photo', 'qr_code', 'levels', 'students', 'is_account_created',
            'plain_password', 'username', 'status'
        ]
        extra_kwargs = {
            'qr_code': {'read_only': True},
        }
    def to_representation(self, instance):
        data = super().to_representation(instance)
        try:
            user = CustomUser.objects.get(email=instance.mail)
            data['username'] = user.username
            data['lastLogin'] = user.last_login.isoformat() if user.last_login else None
            data['status'] = "Active" if user.is_active else "Inactive"
        except CustomUser.DoesNotExist:
            data['lastLogin'] = None
        return data

class ScheduleTSerializer(serializers.ModelSerializer):
    subject = SubjectSerializer(read_only=True)
    classe = ClasseSerializer(read_only=True)
    class Meta:
        model = Schedule_t
        fields = ['id', 'day', 'teacher', 'classe', 'subject', 'start_time', 'end_time', 'notes']

class AttendanceTSerializer(serializers.ModelSerializer):
    teacher = serializers.PrimaryKeyRelatedField(queryset=Teacher.objects.all())
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all())
    schedule = serializers.PrimaryKeyRelatedField(queryset=Schedule_t.objects.all(), required=False, allow_null=True)
    date = serializers.DateField(input_formats=['%Y-%m-%d'], format='%Y-%m-%d')

    class Meta:
        model = Attendance_t
        fields = ['id', 'admin', 'teacher', 'schedule', 'subject', 'status', 'date']

    def validate_status(self, value):
        valid_statuses = [choice[0] for choice in Attendance_t._meta.get_field('status').choices]
        if value not in valid_statuses:
            raise serializers.ValidationError(f"Invalid status. Choose from {valid_statuses}")
        return value

    def validate(self, data):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")

        teacher = data.get('teacher')
        if teacher and teacher.admin != request.user:
            raise serializers.ValidationError({"teacher": "Teacher does not belong to the current admin."})

        subject = data.get('subject')
        if subject and subject.admin != request.user:
            raise serializers.ValidationError({"subject": "Subject does not belong to the current admin."})

        schedule = data.get('schedule')
        if schedule:
            if schedule.teacher != teacher:
                raise serializers.ValidationError({"schedule": "Schedule teacher must match the provided teacher."})
            if schedule.subject != subject:
                raise serializers.ValidationError({"schedule": "Schedule subject must match the provided subject."})

        return data

    def create(self, validated_data):
        validated_data['admin'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data['admin'] = self.context['request'].user
        return super().update(instance, validated_data)
class LevelSerializer(serializers.ModelSerializer):
       class Meta:
           model = Level
           fields = ['id', 'level']