#!/usr/bin/env bash
# Render build step for the Partnernet API.
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
