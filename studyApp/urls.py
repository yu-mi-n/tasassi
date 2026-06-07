from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('tasks/', include('tasks.urls')),
    path('user/', include('user.urls')),
    # ルートURLにアクセスした際、タスク一覧へリダイレクトさせます
    path('', RedirectView.as_view(pattern_name='tasks:task_list', permanent=False)),
]
