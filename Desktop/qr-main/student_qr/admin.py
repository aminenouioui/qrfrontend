from django.contrib import admin

from .models import Student, Grades, Attendance, Admissions, Schedules_st,level

# Registering the models individually
admin.site.register(Student)
admin.site.register(Grades)
admin.site.register(Attendance)
admin.site.register(Admissions)
admin.site.register(Schedules_st)



