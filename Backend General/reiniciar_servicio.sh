  #!/bin/bash
  # Script de control de servicio para Gunicorn
  
  SERVICE_NAME="gunicorn"  
  echo "Gestionando servicio: $SERVICE_NAME"
  
  # Detener el servicio
  echo "Deteniendo servicio..."
  sudo systemctl stop "$SERVICE_NAME"
  
  # Reiniciar el servicio
  echo "Reiniciando servicio..."
  sudo systemctl restart "$SERVICE_NAME"
  
  # Recargar configuraciÃ³n de systemd
  echo "Recargando configuraciÃ³n de systemd..."
  sudo systemctl daemon-reload
  
  # Limpiar estado fallido (opcional)
  echo "Limpiando estado fallido..."
  sudo systemctl reset-failed "$SERVICE_NAME"
  
  echo "Operaciones completadas para: $SERVICE_NAME"