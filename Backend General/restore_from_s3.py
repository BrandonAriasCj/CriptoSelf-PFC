#!/usr/bin/env python
"""
Script para restaurar backup de SQLite desde AWS S3
"""
import os
import sys
import boto3
import subprocess
from pathlib import Path
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# Configuración
S3_BUCKET = os.getenv('AWS_S3_BUCKET', 'your-bucket-name')
S3_PREFIX = os.getenv('AWS_S3_PREFIX', 'database-backups/')
RESTORE_DIR = 'backups/restore'

def list_s3_backups():
    """Lista los backups disponibles en S3"""
    s3_client = boto3.client('s3')
    response = s3_client.list_objects_v2(
        Bucket=S3_BUCKET,
        Prefix=S3_PREFIX
    )
    
    if 'Contents' not in response:
        print("No se encontraron backups en S3")
        return []
    
    backups = [obj['Key'] for obj in response['Contents'] if obj['Key'].endswith('.sql')]
    backups.sort(reverse=True)
    
    return backups

def download_from_s3(s3_key):
    """Descarga un backup desde S3"""
    filename = os.path.basename(s3_key)
    local_path = os.path.join(RESTORE_DIR, filename)
    
    Path(RESTORE_DIR).mkdir(parents=True, exist_ok=True)
    
    print(f"Descargando desde S3: s3://{S3_BUCKET}/{s3_key}")
    
    s3_client = boto3.client('s3')
    s3_client.download_file(S3_BUCKET, s3_key, local_path)
    
    print(f"Descargado a: {local_path}")
    return local_path

def restore_database(dump_path, db_path='db.sqlite3'):
    """Restaura la base de datos desde un dump SQL"""
    print(f"\n⚠️  ADVERTENCIA: Esto sobrescribirá {db_path}")
    response = input("¿Continuar? (yes/no): ")
    
    if response.lower() != 'yes':
        print("Restauración cancelada")
        return False
    
    # Backup de la DB actual
    if os.path.exists(db_path):
        backup_current = f"{db_path}.backup_before_restore"
        print(f"Creando backup de seguridad: {backup_current}")
        os.replace(db_path, backup_current)
    
    # Restaurar desde dump
    print(f"Restaurando desde {dump_path}...")
    with open(dump_path, 'r', encoding='utf-8') as f:
        subprocess.run(['sqlite3', db_path], stdin=f, check=True)
    
    print("✓ Base de datos restaurada exitosamente")
    return True

def main():
    try:
        # Listar backups disponibles
        print("Backups disponibles en S3:")
        backups = list_s3_backups()
        
        if not backups:
            return
        
        for i, backup in enumerate(backups[:10], 1):
            print(f"  {i}. {os.path.basename(backup)}")
        
        # Seleccionar backup
        if len(sys.argv) > 1:
            selection = int(sys.argv[1]) - 1
        else:
            selection = int(input("\nSelecciona el número de backup (1 = más reciente): ")) - 1
        
        if selection < 0 or selection >= len(backups):
            print("Selección inválida")
            return
        
        selected_backup = backups[selection]
        
        # Descargar y restaurar
        dump_path = download_from_s3(selected_backup)
        restore_database(dump_path)
        
    except Exception as e:
        print(f"\n✗ Error durante la restauración: {e}")
        raise

if __name__ == '__main__':
    main()
