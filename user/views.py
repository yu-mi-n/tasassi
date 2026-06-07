from django.shortcuts import render, redirect
from django.contrib.auth import login
from .forms import CustomUserCreationForm

def signup(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)  # 登録直後にログインさせる
            return redirect('tasks:task_list')
    else:
        form = CustomUserCreationForm()
    return render(request, 'signup.html', {'form': form})
