Start-Sleep 10
$ports = @{8000='Backend General'; 3000='Perfil Usuario Web'; 3001='Perfil Empresa Web'}
foreach ($port in $ports.Keys) {
    try {
        $c = New-Object System.Net.Sockets.TcpClient
        $c.Connect('127.0.0.1', $port)
        $c.Close()
        Write-Host "  [OK]    Puerto $port - $($ports[$port])"
    } catch {
        Write-Host "  [FALLO] Puerto $port - $($ports[$port])"
    }
}
