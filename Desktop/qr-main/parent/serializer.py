from rest_framework import serializers
from parent.models.parent import Parent, RelationshipType
from student_qr.models.level import Level
from student_qr.serializers import StudentSerializer


class ParentSerializer(serializers.ModelSerializer):
    """
    Serializer for the Parent model.
    """
    class Meta:
        model = Parent
        exclude = ['admin', 'user_account', 'is_account_created']


class ParentAccountSerializer(serializers.ModelSerializer):
    """
    Serializer for parent accounts, including account-specific fields.
    """
    email = serializers.CharField(source="mail")
    username = serializers.CharField(source="user_account.username", read_only=True)
    name = serializers.SerializerMethodField()
    last_login = serializers.DateTimeField(source="user_account.last_login", read_only=True)
    temporary_password = serializers.CharField(read_only=True)  # Include temporary_password

    class Meta:
        model = Parent
        fields = ["id", "name", "email", "username", "temporary_password", "status", "last_login"]
        extra_kwargs = {
            "email": {"required": False},  # Allow updates without email
        }

    def get_name(self, obj):
        return f"{obj.prenom} {obj.nom}"


class ParentDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer that includes student information for each parent.
    """
    students = StudentSerializer(many=True, read_only=True)

    class Meta:
        model = Parent
        exclude = ['admin', 'user_account', 'is_account_created']


class StudentParentSerializer(serializers.Serializer):
    """
    Combined serializer for creating both student and parent in one request.
    """
    # Student fields
    student_nom = serializers.CharField(max_length=100)
    student_prenom = serializers.CharField(max_length=100)
    student_date_naissance = serializers.DateField()
    student_level = serializers.PrimaryKeyRelatedField(
        queryset=Level.objects.all()
    )
    student_adresse = serializers.CharField(max_length=255, required=False, allow_null=True)
    student_mail = serializers.EmailField()
    student_numero = serializers.CharField(max_length=15)
    student_photo = serializers.ImageField(required=False)

    # Parent fields
    parent_nom = serializers.CharField(max_length=100)
    parent_prenom = serializers.CharField(max_length=100)
    parent_adresse = serializers.CharField(max_length=255, required=False, allow_null=True)
    parent_mail = serializers.EmailField()
    parent_numero = serializers.CharField(max_length=15)
    parent_relationship = serializers.ChoiceField(
        choices=RelationshipType.choices,
        default=RelationshipType.GUARDIAN
    )
    parent_is_emergency_contact = serializers.BooleanField(default=True)
    parent_profession = serializers.CharField(max_length=100, required=False, allow_null=True)
