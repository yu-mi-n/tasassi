import json
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from django.db.models import Max, Min
from django.utils import timezone
from .models import Task, Goal

@login_required
def task_list(request):
    # 未完了のタスクを取得（Metaクラスのorderingにより自動的にステップ番号順になります）
    tasks = Task.objects.filter(user=request.user, is_completed=False)
    # 完了済みのタスクを取得
    completed_tasks = Task.objects.filter(user=request.user, is_completed=True)
    
    # 最終目標による絞り込み
    goal_id = request.GET.get('goal_id')
    if goal_id:
        tasks = tasks.filter(goal_id=goal_id)
        completed_tasks = completed_tasks.filter(goal_id=goal_id)

    goals = Goal.objects.filter(user=request.user)
    
    # カテゴリの選択肢をテンプレートに渡す
    categories = Task.CATEGORY_CHOICES
    
    return render(request, 'tasks/task_list.html', {
        'tasks': tasks,
        'completed_tasks': completed_tasks,
        'categories': categories,
        'goals': goals,
        'priorities': Task.PRIORITY_CHOICES,
        'selected_goal_id': goal_id,
        'today': timezone.localdate(),
        'last_goal_id': str(request.session.get('last_goal_id', '')),
    })

@login_required
@require_POST
def goal_create(request):
    title = request.POST.get('title')
    description = request.POST.get('description', '')
    if title:
        Goal.objects.create(user=request.user, title=title, description=description)
    return redirect('tasks:task_list')

@login_required
@require_POST
def task_create(request):
    name = request.POST.get('name')
    description = request.POST.get('description', '')
    category = request.POST.get('category')
    goal_id = request.POST.get('goal_id')
    due_date = request.POST.get('due_date')
    priority = request.POST.get('priority', '2')

    if name and category:
        # 既存タスクのステップ番号の最大値を取得し、+1 を設定する（タスクがない場合は1）
        max_step = Task.objects.filter(user=request.user).aggregate(Max('step_number'))['step_number__max']
        step_number = 1 if max_step is None else max_step + 1

        task = Task(user=request.user, name=name, description=description, category=category, step_number=step_number, priority=priority)
        if goal_id:
            task.goal_id = goal_id
        if due_date:
            task.due_date = due_date
            
        # 直近選択した目標をセッションに保存（空の場合は「なし」として保存）
        request.session['last_goal_id'] = goal_id or ''
        task.save()
    return redirect('tasks:task_list')

@login_required
@require_POST
def task_toggle_complete(request, pk):
    task = get_object_or_404(Task, pk=pk, user=request.user)
    task.is_completed = not task.is_completed
    task.save()
    return redirect('tasks:task_list')

@login_required
@require_POST
def task_delete(request, pk):
    task = get_object_or_404(Task, pk=pk, user=request.user)
    task.delete()
    return redirect('tasks:task_list')

@login_required
@require_POST
def task_reorder(request):
    try:
        data = json.loads(request.body)
        task_ids = data.get('task_ids', [])
        
        if task_ids:
            min_step = Task.objects.filter(id__in=task_ids, user=request.user).aggregate(Min('step_number'))['step_number__min']
            start_index = 1 if min_step is None else min_step
        else:
            start_index = 1
            
        for index, task_id in enumerate(task_ids, start=start_index):
            Task.objects.filter(id=task_id, user=request.user).update(step_number=index)
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
