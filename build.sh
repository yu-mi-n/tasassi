#!/usr/bin/env bash
# エラーが発生した場合はそこで処理を停止する
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate
