[CmdletBinding()]
param(
    [string]$StackName     = 'criptoself',
    [string]$Region        = 'us-east-1',
    [string]$ParametersFile = (Join-Path (Split-Path $PSScriptRoot -Parent) 'cloudformation\parameters.example.json'),
    [string]$TemplateFile   = (Join-Path (Split-Path $PSScriptRoot -Parent) 'cloudformation\criptoself.yml'),
    [ValidateSet('create','update','delete','status','outputs')]
    [string]$Action = 'create'
)

$ErrorActionPreference = 'Stop'

function Show-Outputs {
    Write-Host ""
    Write-Host "Outputs del stack:" -ForegroundColor Cyan
    & aws cloudformation describe-stacks `
        --stack-name $StackName --region $Region `
        --query "Stacks[0].Outputs[].[OutputKey,OutputValue]" `
        --output table
}

switch ($Action) {
    'status' {
        & aws cloudformation describe-stacks `
            --stack-name $StackName --region $Region `
            --query "Stacks[0].StackStatus" --output text
        return
    }
    'outputs' {
        Show-Outputs
        return
    }
    'delete' {
        Write-Host "Borrando stack $StackName..." -ForegroundColor Yellow
        & aws cloudformation delete-stack --stack-name $StackName --region $Region
        Write-Host "Esperando delete-complete..." -ForegroundColor Yellow
        & aws cloudformation wait stack-delete-complete --stack-name $StackName --region $Region
        Write-Host "Stack borrado." -ForegroundColor Green
        return
    }
}

# Validar template
Write-Host "Validando template..." -ForegroundColor Cyan
& aws cloudformation validate-template `
    --template-body "file://$TemplateFile" `
    --region $Region | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Template invalido." }

if ($Action -eq 'create') {
    Write-Host "Creando stack $StackName en $Region..." -ForegroundColor Cyan
    & aws cloudformation create-stack `
        --stack-name $StackName `
        --region $Region `
        --template-body "file://$TemplateFile" `
        --parameters "file://$ParametersFile" `
        --capabilities CAPABILITY_IAM
    if ($LASTEXITCODE -ne 0) { throw "create-stack fallo." }

    Write-Host "Esperando create-complete (puede tardar ~5-8 min)..." -ForegroundColor Yellow
    & aws cloudformation wait stack-create-complete --stack-name $StackName --region $Region
    if ($LASTEXITCODE -ne 0) { throw "Stack no llego a CREATE_COMPLETE. Revisa eventos en consola." }

} elseif ($Action -eq 'update') {
    Write-Host "Actualizando stack $StackName..." -ForegroundColor Cyan
    & aws cloudformation update-stack `
        --stack-name $StackName `
        --region $Region `
        --template-body "file://$TemplateFile" `
        --parameters "file://$ParametersFile" `
        --capabilities CAPABILITY_IAM
    if ($LASTEXITCODE -ne 0) {
        # update-stack devuelve error si no hay cambios; tolerarlo
        Write-Host "Nota: update-stack puede haber fallado por 'no updates to perform'." -ForegroundColor Yellow
    } else {
        Write-Host "Esperando update-complete..." -ForegroundColor Yellow
        & aws cloudformation wait stack-update-complete --stack-name $StackName --region $Region
    }
}

Show-Outputs
