from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User

class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # ユーザー名の注意書きを変更
        self.fields['username'].help_text = '半角アルファベット、半角数字、記号が使用可能です'
        
        # パスワードの注意書きを変更
        if 'password1' in self.fields:
            self.fields['password1'].help_text = (
                '<ul style="padding-left: 20px; margin-top: 5px; margin-bottom: 0;">'
                '<li>パスワードの文字数は 8 文字以上である必要があります。</li>'
                '<li>半角アルファベット、半角数字、記号を2種類以上組み合わせて設定してください。</li>'
                '<li>よく使われるパスワードは設定できません。</li>'
                '</ul>'
            )