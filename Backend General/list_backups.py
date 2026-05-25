#!/usr/bin/env python
"""
Script para listar backups disponibles en S3
"""
import os
import boto3
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

S3_BUCKET = os.getenv('AWS_S3_BUCKET', 'criptoself')
S3_PREFIX = os.getenv('AWS_S3_PREFIX', 'criptoself/')

def list_backups():
    """Lista todos los backups en S3"""
    s3_client = boto3.client('s3')
    
    print(f"=== Backups en S3 (s3://{S3_BUCKET}/{S3_PREFIX}) ===\n")
    
    try:
        response = s3_client.list_objects_v2(
            Bucket=S3_BUCKET,
            Prefix=S3_PREFIX
        )
        
        if 'Contents' not in response:
            print("No se encontraron backups")
            return
        
        backups = [obj for obj in response['Contents'] if obj['Key'].endswith('.sql')]
        backups.sort(key=lambda x: x['LastModified'], reverse=True)
        
        if not backups:
            print("No se encontraron archivos .sql")
            return
        
        print(f"Total de backups: {len(backups)}\n")
        
        for i, backup in enumerate(backups, 1):
            size_mb = backup['Size'] / (1024 * 1024)
            modified = backup['LastModified'].strftime('%Y-%m-%d %H:%M:%S')
            filename = os.path.basename(backup['Key'])
            
            print(f"{i}. {filename}")
            print(f"   Tamaño: {size_mb:.2f} MB")
            print(f"   Fecha: {modified}")
            print()
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    list_backups()
