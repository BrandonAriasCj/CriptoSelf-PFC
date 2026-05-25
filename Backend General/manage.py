#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

# Forzar UTF-8 en stdout/stderr — Windows usa cp1252 por defecto y rompe con
# emojis u otros caracteres unicode en prints/logs.
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

if __name__ == '__main__':
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)