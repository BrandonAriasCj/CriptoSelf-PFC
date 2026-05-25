# Backup de SQLite a AWS S3

Sistema automatizado para hacer backup de la base de datos SQLite a AWS S3 en formato dump SQL.

## Configuración Inicial

### 1. Instalar dependencias

```bash
pip install boto3
```

O actualizar desde requirements.txt:
```bash
pip install -r requirements.txt
```

### 2. Configurar credenciales AWS

Agrega estas variables a tu archivo `.env`:

```env
AWS_ACCESS_KEY_ID=tu-access-key
AWS_SECRET_ACCESS_KEY=tu-secret-key
AWS_DEFAULT_REGION=us-east-1
AWS_S3_BUCKET=nombre-de-tu-bucket
AWS_S3_PREFIX=database-backups/
```

### 3. Crear bucket S3

En AWS Console o usando AWS CLI:

```bash
aws s3 mb s3://nombre-de-tu-bucket
```

Configurar política de ciclo de vida (opcional) para eliminar backups antiguos automáticamente.

## Uso

### Hacer Backup

**Windows:**
```bash
backup_to_s3.bat
```

**Linux/Mac:**
```bash
python backup_to_s3.py
```

Esto creará:
- Un dump SQL de `db.sqlite3`
- Lo subirá a S3 con timestamp
- Mantendrá los últimos 5 backups locales

### Restaurar Backup

```bash
python restore_from_s3.py
```

El script te mostrará los backups disponibles y te permitirá seleccionar cuál restaurar.

## Automatización

### Cron Job (Linux/Mac)

Agregar a crontab para backup diario a las 2 AM:

```bash
crontab -e
```

Agregar línea:
```
0 2 * * * cd /ruta/a/tu/proyecto && /usr/bin/python backup_to_s3.py >> /var/log/db_backup.log 2>&1
```

### Task Scheduler (Windows)

1. Abrir Task Scheduler
2. Crear tarea básica
3. Trigger: Diario a las 2:00 AM
4. Acción: Ejecutar `backup_to_s3.bat`

### GitHub Actions (CI/CD)

Crear `.github/workflows/backup.yml`:

```yaml
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Diario a las 2 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: pip install boto3
      
      - name: Run backup
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: us-east-1
          AWS_S3_BUCKET: ${{ secrets.AWS_S3_BUCKET }}
        run: python backup_to_s3.py
```

## Estructura de Archivos

```
backups/
├── db_backup_20241212_140530.sql
├── db_backup_20241211_140530.sql
└── restore/
    └── db_backup_20241210_140530.sql
```

En S3:
```
s3://tu-bucket/database-backups/
├── db_backup_20241212_140530.sql
├── db_backup_20241211_140530.sql
└── db_backup_20241210_140530.sql
```

## Seguridad

- Los archivos se suben con encriptación AES256
- Las credenciales AWS deben estar en `.env` (no en git)
- Considera usar IAM roles en producción en lugar de access keys
- Configura políticas de bucket para acceso restringido

## Política IAM Recomendada

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::tu-bucket/database-backups/*",
        "arn:aws:s3:::tu-bucket"
      ]
    }
  ]
}
```

## Troubleshooting

### Error: sqlite3 command not found

Instalar SQLite:
- **Windows**: Descargar desde https://www.sqlite.org/download.html
- **Linux**: `sudo apt-get install sqlite3`
- **Mac**: `brew install sqlite3`

### Error: AWS credentials not found

Verificar que las variables de entorno estén configuradas:
```bash
python -c "import os; print(os.getenv('AWS_ACCESS_KEY_ID'))"
```

### Error: Access Denied en S3

Verificar permisos del bucket y las credenciales IAM.

## Notas

- El formato dump SQL es portable y fácil de inspeccionar
- Los backups incluyen toda la estructura y datos
- Para bases de datos grandes, considera comprimir los dumps
- Monitorea el tamaño del bucket S3 para controlar costos
