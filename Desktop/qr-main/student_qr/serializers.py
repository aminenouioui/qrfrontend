import random
import string
from rest_framework import serializers
from teacher_qr.serializers import SubjectSerializer
from student_qr.models import Student, Grades, Schedules_st, Level, Attendance
from parent.models.parent import Parent, RelationshipType


class StudentSerializer(serializers.ModelSerializer):
    level = serializers.PrimaryKeyRelatedField(queryset=Level.objects.all())
    level_name = serializers.CharField(source='level.level', read_only=True)
    photo = serializers.ImageField(allow_null=True, required=False)

    class Meta:
        model = Student
        exclude = ['admin', 'qr_code', 'is_account_created']

    def validate_level(self, value):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            if value.admin != request.user:
                raise serializers.ValidationError("Level does not belong to the current admin.")
        else:
            raise serializers.ValidationError("Authentication required to validate level.")
        return value

    def validate_mail(self, value):
        student = self.instance
        if Student.objects.exclude(id=student.id if student else None).filter(mail=value).exists():
            raise serializers.ValidationError("A student with this email already exists.")
        return value
class StudentWithParentSerializer(serializers.ModelSerializer):
    parent_id = serializers.PrimaryKeyRelatedField(queryset=Parent.objects.all(), required=False)
    parent_nom = serializers.CharField(max_length=100, write_only=True, required=False)
    parent_prenom = serializers.CharField(max_length=100, write_only=True, required=False)
    parent_adresse = serializers.CharField(max_length=255, write_only=True, required=False, allow_null=True, allow_blank=True)
    parent_mail = serializers.EmailField(write_only=True, required=False)
    parent_numero = serializers.CharField(max_length=15, write_only=True, required=False)
    parent_relationship = serializers.ChoiceField(choices=RelationshipType.choices, write_only=True, required=False, default=RelationshipType.GUARDIAN)
    parent_is_emergency_contact = serializers.BooleanField(write_only=True, required=False, default=True)
    parent_profession = serializers.CharField(max_length=100, write_only=True, required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = Student
        fields = [
            'nom', 'prenom', 'date_naissance', 'level', 'adresse', 'mail', 'numero', 'photo', 'admission_s',
            'parent_id', 'parent_nom', 'parent_prenom', 'parent_adresse', 'parent_mail', 'parent_numero',
            'parent_relationship', 'parent_is_emergency_contact', 'parent_profession'
        ]

    def validate(self, data):
        if not data.get('parent_id'):
            required_fields = ['parent_nom', 'parent_prenom', 'parent_mail', 'parent_numero']
            for field in required_fields:
                if not data.get(field):
                    raise serializers.ValidationError({field: "This field is required when creating a new parent."})
            # Check parent email uniqueness
            parent_mail = data.get('parent_mail')
            if Parent.objects.filter(mail=parent_mail).exists():
                raise serializers.ValidationError({'parent_mail': 'A parent with this email already exists.'})
        # Check student email uniqueness
        student_mail = data.get('mail')
        if Student.objects.filter(mail=student_mail).exists():
            raise serializers.ValidationError({'mail': 'A student with this email already exists.'})
        # Ensure parent belongs to the same admin (if parent_id is provided)
        if data.get('parent_id'):
            request = self.context.get('request')
            if not request or not request.user.is_authenticated:
                raise serializers.ValidationError({"parent_id": "Request context is missing or user is not authenticated."})
            if data['parent_id'].admin != request.user:
                raise serializers.ValidationError({"parent_id": "Parent does not belong to the current admin."})
        return data

    def create(self, validated_data):
        parent_id = validated_data.pop('parent_id', None)
        parent_data = {
            'nom': validated_data.pop('parent_nom', None),
            'prenom': validated_data.pop('parent_prenom', None),
            'adresse': validated_data.pop('parent_adresse', None),
            'mail': validated_data.pop('parent_mail', None),
            'numero': validated_data.pop('parent_numero', None),
            'relationship': validated_data.pop('parent_relationship', RelationshipType.GUARDIAN),
            'is_emergency_contact': validated_data.pop('parent_is_emergency_contact', True),
            'profession': validated_data.pop('parent_profession', None),
        }

        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Request context is missing or user is not authenticated.")
        validated_data['admin'] = request.user

        student = Student.objects.create(**validated_data)

        if parent_id:
            parent = parent_id
        else:
            parent, created = Parent.objects.get_or_create(
                mail=parent_data['mail'],
                admin=student.admin,
                defaults=parent_data
            )

        parent.students.add(student)
        return student


class GradesSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    subject = SubjectSerializer(read_only=True)

    class Meta:
        model = Grades
        fields = ['id', 'student', 'subject', 'grade', 'grade_type', 'level', 'date_g']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['grade'] = str(instance.grade)
        return representation
        
class SchedulesStSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedules_st
        exclude = ['admin']


class LevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Level
        fields = '__all__'

class AttendanceSerializer(serializers.ModelSerializer):
    child_names = serializers.SerializerMethodField()
    subject = serializers.CharField(source='schedule.subject.nom', read_only=True)
    start_time = serializers.CharField(source='schedule.start_time', read_only=True)
    end_time = serializers.CharField(source='schedule.end_time', read_only=True)
    notes = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    schedule_id = serializers.IntegerField(source='schedule.id', read_only=True)  # Add schedule ID

    class Meta:
        model = Attendance
        fields = ['child_names', 'date', 'status', 'subject', 'start_time', 'end_time', 'notes', 'schedule_id']

    def get_child_names(self, obj):
        return f"{obj.student.prenom} {obj.student.nom}"

    def get_notes(self, obj):
        return ""  # No notes field in Attendance model

    def get_status(self, obj):
        status_map = {
            'present': 'Present',
            'absent': 'Absent',
            'retard': 'Late',
            'att': 'Pending'
        }
        return status_map.get(obj.status, 'Pending')
class StudentGradesSerializer(serializers.ModelSerializer):
    subject = SubjectSerializer()

    class Meta:
        model = Grades
        fields = ['id', 'subject', 'grade', 'grade_type']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['grade'] = str(instance.grade)
        return representation


class StudentExportSerializer(serializers.ModelSerializer):
    level = serializers.CharField(source='level.level')  # Get level.level string
    admission_s = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = ['id', 'prenom', 'nom', 'level', 'mail', 'numero', 'admission_s', 'date_naissance', 'adresse']

    def get_admission_s(self, obj):
        return {
            'att': 'En Attente',
            'acc': 'Accepté',
            'ref': 'Refusé'
        }.get(obj.admission_s, 'Unknown')
