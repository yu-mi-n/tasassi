from django.db import models
from django.contrib.auth.models import User

class Goal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, verbose_name='ユーザー')
    title = models.CharField(max_length=255, verbose_name='最終目標')
    description = models.TextField(blank=True, verbose_name='目標の詳細')

    class Meta:
        verbose_name = '目標'
        verbose_name_plural = '目標'

    def __str__(self):
        return self.title

class Task(models.Model):
    CATEGORY_CHOICES = [
        ('テキスト学習', 'テキスト学習'),
        ('過去問演習', '過去問演習'),
        ('弱点補強', '弱点補強'),
    ]
    PRIORITY_CHOICES = [
        ('3', '★★★'),
        ('2', '★★'),
        ('1', '★'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, verbose_name='ユーザー')
    name = models.CharField(max_length=255, verbose_name='タスク名')
    description = models.TextField(blank=True, verbose_name='詳細')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, verbose_name='カテゴリ')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='2', verbose_name='重要度')
    step_number = models.IntegerField(verbose_name='ステップ番号')
    is_completed = models.BooleanField(default=False, verbose_name='完了フラグ')
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, null=True, blank=True, related_name='tasks', verbose_name='最終目標')
    due_date = models.DateField(null=True, blank=True, verbose_name='期限')

    class Meta:
        ordering = ['step_number']  # ステップ番号の昇順で並び替え
        verbose_name = 'タスク'
        verbose_name_plural = 'タスク'

    def __str__(self):
        return f"Step {self.step_number}: {self.name}"
