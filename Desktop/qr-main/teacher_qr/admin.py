from django.contrib import admin
 
from .models import Teacher,Teacher_perf,Schedule_t,Subject,Classe
 
admin.site.register(Teacher)
admin.site.register(Teacher_perf)
admin.site.register(Schedule_t)
admin.site.register(Subject)
admin.site.register(Classe)