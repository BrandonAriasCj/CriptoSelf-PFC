import os
import sys
import django
from django.urls import resolve

# Add the project root to sys.path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

try:
    django.setup()
except Exception as e:
    print(f"Error setting up Django: {e}")
    sys.exit(1)

def check_url(url):
    try:
        # resolve() expects the path part, e.g., '/api/backtesting/run-demo/'
        resolver_match = resolve(url)
        print(f"[OK] {url} resolves to '{resolver_match.view_name}' (func: {resolver_match.func.__name__})")
        return True
    except Exception as e:
        print(f"[FAIL] {url} could not be resolved. Error: {e}")
        return False

print("--- Checking URL Conflicts ---")
urls_to_check = [
    '/api/health/',
    '/api/backtesting/run-demo/',
    '/api/lessons/categories/',
    '/api/auth/register/',
    '/api/operaciones/',
    '/admin/login/',
]

results = {}
for url in urls_to_check:
    results[url] = check_url(url)

if all(results.values()):
    print("\nAll URLs resolved successfully.")
else:
    print("\nSome URLs failed to resolve. Conflicts detected.")
