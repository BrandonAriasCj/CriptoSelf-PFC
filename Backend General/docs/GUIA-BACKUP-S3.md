# Guía Rápida - Backup SQLite a AWS S3

## ✅ Configuración Completada

Tu sistema de backup ya está configurado y funcionando:

- ✓ Credenciales AWS configuradas
- ✓ Bucket S3: `criptoself`
- ✓ Conexión verificada
- ✓ Primer backup creado exitosamente

## Comandos Disponibles

### 1. Hacer Backup

```bash
python backup_to_s3.py
```

Esto creará un dump SQL de tu base de datos y lo subirá a S3 automáticamente.

### 2. Listar Backups

```bash
python list_backups.py
```

Muestra todos los backups disponibles en S3 con fecha y tamaño.

### 3. Restaurar Backup

```bash
python restore_from_s3.py
```

Te mostrará los backups disponibles y te permitirá seleccionar cuál restaurar.

### 4. Verificar Credenciales

```bash
python test_aws_credentials.py
```

Verifica que las credenciales AWS estén configuradas correctamente.

## Automatización

### Backup Diario con Task Scheduler (Windows)

1. Abre **Task Scheduler** (Programador de tareas)
2. Click en **"Create Basic Task"**
3. Nombre: "Backup Base de Datos"
4. Trigger: **Daily** a las 2:00 AM
5. Action: **Start a program**
   - Program: `C:\ruta\a\tu\proyecto\Backend General\venv\Scripts\python.exe`
   - Arguments: `backup_to_s3.py`
   - Start in: `C:\ruta\a\tu\proyecto\Backend General`
6. Finish

### Backup Manual Rápido

Puedes usar el archivo `backup_to_s3.bat`:

```bash
backup_to_s3.bat
```

## Ubicación de Archivos

### Local
```
backups/
├── db_backup_20251212_021148.sql  (último backup)
└── restore/                        (backups descargados)
```

### S3
```
s3://criptoself/criptoself/
└── db_backup_20251212_021148.sql
```

## Seguridad

- ✓ Archivos encriptados con AES256 en S3
- ✓ Credenciales en `.env` (no en git)
- ✓ Backups locales limitados a los últimos 5

## Costos AWS

Con tu uso actual:
- Backup de ~0.12 MB
- Si haces backup diario: ~3.6 MB/mes
- Costo estimado: **$0.00** (dentro de capa gratuita)

La capa gratuita de S3 incluye:
- 5 GB de almacenamiento
- 20,000 solicitudes GET
- 2,000 solicitudes PUT

## Troubleshooting

### Error: sqlite3 command not found

Descarga SQLite desde: https://www.sqlite.org/download.html
Y agrégalo al PATH de Windows.

### Error: No credentials

Verifica que el archivo `.env` tenga las credenciales:
```bash
python test_aws_credentials.py
```

### Ver logs de backup

Los mensajes de éxito/error se muestran en la consola.

## Próximos Pasos

1. **Probar restauración**: Ejecuta `python restore_from_s3.py` para familiarizarte
2. **Automatizar**: Configura Task Scheduler para backups diarios
3. **Monitorear**: Revisa periódicamente con `python list_backups.py`

## Notas Importantes

- Los backups son incrementales por fecha (no sobrescriben)
- El formato SQL dump es portable y legible
- Puedes abrir los archivos .sql con cualquier editor de texto
- Para bases de datos grandes, considera comprimir los dumps
