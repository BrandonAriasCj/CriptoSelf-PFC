#!/usr/bin/env python
"""
Script para verificar que las credenciales AWS están configuradas correctamente
"""
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

print("=== Verificando configuración AWS ===\n")

# Verificar variables de entorno
aws_access_key = os.getenv('AWS_ACCESS_KEY_ID')
aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
aws_region = os.getenv('AWS_DEFAULT_REGION')
aws_bucket = os.getenv('AWS_S3_BUCKET')

print(f"AWS_ACCESS_KEY_ID: {'✓ Configurado' if aws_access_key else '✗ NO configurado'}")
if aws_access_key:
    print(f"  Valor: {aws_access_key[:4]}...{aws_access_key[-4:] if len(aws_access_key) > 8 else ''}")

print(f"\nAWS_SECRET_ACCESS_KEY: {'✓ Configurado' if aws_secret_key else '✗ NO configurado'}")
if aws_secret_key:
    print(f"  Valor: {aws_secret_key[:4]}...{aws_secret_key[-4:] if len(aws_secret_key) > 8 else ''}")

print(f"\nAWS_DEFAULT_REGION: {aws_region or '✗ NO configurado'}")
print(f"AWS_S3_BUCKET: {aws_bucket or '✗ NO configurado'}")

# Intentar conectar con boto3
if aws_access_key and aws_secret_key:
    print("\n=== Probando conexión con AWS ===\n")
    try:
        import boto3
        s3_client = boto3.client('s3')
        response = s3_client.list_buckets()
        print("✓ Conexión exitosa!")
        print(f"\nBuckets disponibles ({len(response['Buckets'])}):")
        for bucket in response['Buckets']:
            print(f"  - {bucket['Name']}")
    except Exception as e:
        print(f"✗ Error al conectar: {e}")
else:
    print("\n⚠️  Configura las credenciales en el archivo .env primero")
