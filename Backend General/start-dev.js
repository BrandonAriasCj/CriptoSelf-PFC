#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

const log = (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

// Función para verificar si un puerto está en uso
const checkPort = (port) => {
    return new Promise((resolve) => {
        const net = require('net');
        const server = net.createServer();
        
        server.listen(port, () => {
            server.once('close', () => resolve(false));
            server.close();
        });
        
        server.on('error', () => resolve(true));
    });
};

// Función para verificar si un comando existe
const commandExists = (command) => {
    return new Promise((resolve) => {
        exec(`${command} --version`, (error) => {
            resolve(!error);
        });
    });
};

// Variables para los procesos
let backendProcess = null;
let frontendProcess = null;

// Función de limpieza
const cleanup = () => {
    log('\n🛑 Deteniendo servidores...', 'red');
    
    if (backendProcess) {
        backendProcess.kill('SIGTERM');
    }
    
    if (frontendProcess) {
        frontendProcess.kill('SIGTERM');
    }
    
    setTimeout(() => {
        log('✅ Servidores detenidos correctamente', 'green');
        process.exit(0);
    }, 1000);
};

// Registrar manejadores de señales
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

const main = async () => {
    log('🚀 Iniciando CriptoSelf - Desarrollo Completo', 'green');
    log('=======================================', 'cyan');
    
    // Verificar puertos
    log('🔍 Verificando puertos...', 'yellow');
    
    const backendPortInUse = await checkPort(8000);
    const frontendPortInUse = await checkPort(3000);
    
    if (backendPortInUse) {
        log('⚠️  Puerto 8000 (Backend) ya está en uso', 'red');
    }
    
    if (frontendPortInUse) {
        log('⚠️  Puerto 3000 (Frontend) ya está en uso', 'red');
    }
    
    // Verificar dependencias
    log('📦 Verificando dependencias...', 'yellow');
    
    const pythonExists = await commandExists('python') || await commandExists('python3');
    const nodeExists = await commandExists('node');
    
    if (!pythonExists) {
        log('❌ Python no encontrado. Por favor instala Python', 'red');
        process.exit(1);
    }
    
    if (!nodeExists) {
        log('❌ Node.js no encontrado. Por favor instala Node.js', 'red');
        process.exit(1);
    }
    
    log('✅ Dependencias verificadas', 'green');
    
    // Verificar entorno virtual
    const venvPath = path.join(__dirname, 'venv');
    if (!fs.existsSync(venvPath)) {
        log('📦 Creando entorno virtual...', 'yellow');
        const pythonCmd = await commandExists('python3') ? 'python3' : 'python';
        await new Promise((resolve, reject) => {
            const createVenv = spawn(pythonCmd, ['-m', 'venv', 'venv'], { stdio: 'inherit' });
            createVenv.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error('Error creando entorno virtual'));
            });
        });
    }
    
    // Verificar dependencias del frontend
    const nodeModulesPath = path.join(__dirname, 'frontent_oficial', 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
        log('📦 Instalando dependencias del frontend...', 'yellow');
        await new Promise((resolve, reject) => {
            const npmInstall = spawn('npm', ['install'], {
                cwd: path.join(__dirname, 'frontent_oficial'),
                stdio: 'inherit'
            });
            npmInstall.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error('Error instalando dependencias'));
            });
        });
    }
    
    log('🎯 Iniciando servidores...', 'green');
    
    // Iniciar Backend
    log('🐍 Iniciando Backend Django en puerto 8000...', 'blue');
    
    const isWindows = os.platform() === 'win32';
    const activateScript = isWindows ? 
        path.join(__dirname, 'venv', 'Scripts', 'activate.bat') :
        path.join(__dirname, 'venv', 'bin', 'activate');
    
    const pythonCmd = await commandExists('python3') ? 'python3' : 'python';
    const backendCmd = isWindows ? 
        `venv\\Scripts\\activate && ${pythonCmd} manage.py runserver 8000` :
        `source venv/bin/activate && ${pythonCmd} manage.py runserver 8000`;
    
    backendProcess = spawn(isWindows ? 'cmd' : 'bash', 
        isWindows ? ['/c', backendCmd] : ['-c', backendCmd], 
        {
            cwd: __dirname,
            stdio: ['pipe', 'pipe', 'pipe']
        }
    );
    
    backendProcess.stdout.on('data', (data) => {
        process.stdout.write(`${colors.blue}[BACKEND]${colors.reset} ${data}`);
    });
    
    backendProcess.stderr.on('data', (data) => {
        process.stderr.write(`${colors.red}[BACKEND ERROR]${colors.reset} ${data}`);
    });
    
    // Esperar un poco para que el backend se inicie
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Iniciar Frontend
    log('⚛️ Iniciando Frontend React en puerto 3000...', 'cyan');
    
    frontendProcess = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, 'frontent_oficial'),
        stdio: ['pipe', 'pipe', 'pipe']
    });
    
    frontendProcess.stdout.on('data', (data) => {
        process.stdout.write(`${colors.cyan}[FRONTEND]${colors.reset} ${data}`);
    });
    
    frontendProcess.stderr.on('data', (data) => {
        process.stderr.write(`${colors.yellow}[FRONTEND]${colors.reset} ${data}`);
    });
    
    log('\n🎉 ¡Servidores iniciados correctamente!', 'green');
    log('📱 Frontend: http://localhost:3000', 'cyan');
    log('🔧 Backend:  http://localhost:8000', 'blue');
    log('🔑 Admin:    http://localhost:8000/admin', 'magenta');
    log('\n💡 Presiona Ctrl+C para detener ambos servidores', 'yellow');
    
    // Manejar errores de los procesos
    backendProcess.on('error', (error) => {
        log(`❌ Error en Backend: ${error.message}`, 'red');
    });
    
    frontendProcess.on('error', (error) => {
        log(`❌ Error en Frontend: ${error.message}`, 'red');
    });
    
    backendProcess.on('close', (code) => {
        if (code !== 0) {
            log(`❌ Backend se cerró con código: ${code}`, 'red');
        }
    });
    
    frontendProcess.on('close', (code) => {
        if (code !== 0) {
            log(`❌ Frontend se cerró con código: ${code}`, 'red');
        }
    });
};

// Ejecutar el script principal
main().catch((error) => {
    log(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
});