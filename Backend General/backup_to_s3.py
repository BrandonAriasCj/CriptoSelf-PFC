#!/usr/bin/env python
"""
Script para hacer backup de SQLite a AWS S3 en formato dump
"""
import os
import subprocess
import boto3
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# Configuración
DB_PATH = 'db.sqlite3'
BACKUP_DIR = 'backups'
S3_BUCKET = os.getenv('AWS_S3_BUCKET', 'your-bucket-name')
S3_PREFIX = os.getenv('AWS_S3_PREFIX', 'database-backups/')

def create_dump():
    """Crea un dump SQL de la base de datos SQLite"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    dump_filename = f'db_backup_{timestamp}.sql'
    dump_path = os.path.join(BACKUP_DIR, dump_filename)
    
    # Crear directorio de backups si no existe
    Path(BACKUP_DIR).mkdir(exist_ok=True)
    
    # Crear dump usando sqlite3
    print(f"Creando dump de {DB_PATH}...")
    with open(dump_path, 'w', encoding='utf-8') as f:
        subprocess.run(['sqlite3', DB_PATH, '.dump'], stdout=f, check=True)
    
    print(f"Dump creado: {dump_path}")
    return dump_path, dump_filename

def upload_to_s3(file_path, filename):
    """Sube el archivo a AWS S3"""
    s3_key = f"{S3_PREFIX}{filename}"
    
    print(f"Subiendo a S3: s3://{S3_BUCKET}/{s3_key}")
    
    s3_client = boto3.client('s3')
    s3_client.upload_file(
        file_path,
        S3_BUCKET,
        s3_key,
        ExtraArgs={'ServerSideEncryption': 'AES256'}
    )
    
    print(f"Backup subido exitosamente a S3")
    return s3_key

def cleanup_old_local_backups(keep_last=5):
    """Limpia backups locales antiguos, mantiene los últimos N"""
    backups = sorted(Path(BACKUP_DIR).glob('db_backup_*.sql'))
    
    if len(backups) > keep_last:
        for backup in backups[:-keep_last]:
            print(f"Eliminando backup local antiguo: {backup}")
            backup.unlink()

def main():
    try:
        # Crear dump
        dump_path, dump_filename = create_dump()
        
        # Subir a S3
        s3_key = upload_to_s3(dump_path, dump_filename)
        
        # Limpiar backups locales antiguos
        cleanup_old_local_backups()
        
        print("\n✓ Backup completado exitosamente")
        print(f"  Archivo local: {dump_path}")
        print(f"  S3 location: s3://{S3_BUCKET}/{s3_key}")
        
    except Exception as e:
        print(f"\n✗ Error durante el backup: {e}")
        raise

if __name__ == '__main__':
    main()
