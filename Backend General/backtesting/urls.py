from django.urls import path
from . import views

urlpatterns = [
    path('run-demo/', views.run_backtesting_demo, name='run_backtesting_demo'),
    path('run-custom/', views.run_custom_backtesting, name='run_custom_backtesting'),
    path('strategy-info/', views.get_strategy_info, name='get_strategy_info'),
    path('events/', views.get_historical_events, name='get_historical_events'),
]