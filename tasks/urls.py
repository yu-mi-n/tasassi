from django.urls import path
from . import views

app_name = 'tasks'

urlpatterns = [
    path('', views.task_list, name='task_list'),
    path('goal/create/', views.goal_create, name='goal_create'),
    path('create/', views.task_create, name='task_create'),
    path('<int:pk>/toggle/', views.task_toggle_complete, name='task_toggle_complete'),
    path('<int:pk>/delete/', views.task_delete, name='task_delete'),
    path('reorder/', views.task_reorder, name='task_reorder'),
]
