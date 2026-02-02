// =====================================================
// POST-BUILD AUTOMATICO
// Sistema de Control de Charolas
// Copia archivos necesarios a dist/ después de compilar
// =====================================================

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════╗');
console.log('║  POST-BUILD: Preparando carpeta dist              ║');
console.log('╚════════════════════════════════════════════════════╝\n');

const distDir = path.join(__dirname, 'dist');

// Verificar que dist existe
if (!fs.existsSync(distDir)) {
    console.error('❌ Error: La carpeta dist no existe');
    console.error('   Primero ejecuta: npm run build');
    process.exit(1);
}

// Archivos a copiar
const filesToCopy = [
    { src: '.env', dest: '.env' },
    { src: '_env', dest: '.env' },
    { src: 'instalar.bat', dest: 'instalar.bat' },
    { src: 'desinstalar.bat', dest: 'desinstalar.bat' },
    { src: 'START.bat', dest: 'START.bat' },
    { src: 'iniciar.bat', dest: 'iniciar.bat' },
    { src: 'ver_estado.bat', dest: 'ver_estado.bat' }
];

let copiedCount = 0;

// Copiar archivos
filesToCopy.forEach(file => {
    const srcPath = path.join(__dirname, file.src);
    const destPath = path.join(distDir, file.dest);
    
    if (fs.existsSync(srcPath)) {
        try {
            fs.copyFileSync(srcPath, destPath);
            console.log(`  ✅ ${file.dest} copiado`);
            copiedCount++;
        } catch (error) {
            console.log(`  ❌ Error al copiar ${file.dest}`);
        }
    }
});

// Crear .env de ejemplo si no existe
const envPath = path.join(distDir, '.env');
if (!fs.existsSync(envPath)) {
    console.log('\n  ℹ️  Creando .env de ejemplo...');
    
    const envContent = `# Configuración de Base de Datos SQL Server
DB_USER=sa
DB_PASSWORD=TU_PASSWORD_AQUI
DB_SERVER=TU_SERVIDOR\\TU_INSTANCIA
DB_DATABASE=ControlCharolas

# Puerto del servidor
PORT=3000

# Secreto para sesiones (cambiar en producción)
SESSION_SECRET=CAMBIAR_ESTE_SECRETO_POR_UNO_UNICO

# Ambiente
NODE_ENV=production
`;
    
    try {
        fs.writeFileSync(envPath, envContent, 'utf8');
        console.log('  ✅ .env de ejemplo creado');
        console.log('  ⚠️  IMPORTANTE: Editar con datos del cliente');
        copiedCount++;
    } catch (error) {
        console.log('  ❌ Error al crear .env');
    }
}

// Crear LEEME.txt
console.log('\n  ℹ️  Creando LEEME.txt...');
const leemeContent = `════════════════════════════════════════════════════
  SISTEMA DE CONTROL DE CHAROLAS - Versión 1.0
════════════════════════════════════════════════════

CONTENIDO:
  • ControlCharolas.exe    - Aplicación principal
  • .env                   - Configuración (EDITAR)
  • instalar.bat           - Instalador (Ejecutar como Admin)
  • desinstalar.bat        - Desinstalador (Ejecutar como Admin)

════════════════════════════════════════════════════
INSTALACIÓN RÁPIDA:
════════════════════════════════════════════════════

1. CONFIGURAR .env
   - Abrir .env con Notepad
   - Cambiar DB_SERVER a tu servidor SQL
   - Cambiar DB_PASSWORD a tu contraseña
   - Guardar y cerrar

2. INSTALAR
   - Clic derecho en instalar.bat
   - Ejecutar como administrador
   - Esperar confirmación

3. ACCEDER
   - Abrir navegador
   - Ir a: http://localhost:3000
   - Usuario: admin
   - Password: admin123

════════════════════════════════════════════════════
CONFIGURACIÓN DEL .env:
════════════════════════════════════════════════════

DB_SERVER=NOMBRE_PC\\INSTANCIA_SQL
DB_USER=sa
DB_PASSWORD=tu_password_real
DB_DATABASE=ControlCharolas
PORT=3000
SESSION_SECRET=cambiar_a_valor_unico
NODE_ENV=production

════════════════════════════════════════════════════
REQUISITOS:
════════════════════════════════════════════════════

• Windows 10 o superior
• SQL Server 2019+ instalado y corriendo
• Base de datos ControlCharolas creada

════════════════════════════════════════════════════
DESINSTALACIÓN:
════════════════════════════════════════════════════

1. Clic derecho en desinstalar.bat
2. Ejecutar como administrador

════════════════════════════════════════════════════
SOPORTE:
════════════════════════════════════════════════════

Email: soporte@tuempresa.com
Tel: XXX-XXX-XXXX

════════════════════════════════════════════════════
`;

try {
    fs.writeFileSync(path.join(distDir, 'LEEME.txt'), leemeContent, 'utf8');
    console.log('  ✅ LEEME.txt creado');
    copiedCount++;
} catch (error) {
    console.log('  ❌ Error al crear LEEME.txt');
}

// Resumen
console.log('\n╔════════════════════════════════════════════════════╗');
console.log('║  ✅ CARPETA dist PREPARADA                        ║');
console.log('╚════════════════════════════════════════════════════╝\n');
console.log(`  Archivos procesados: ${copiedCount}\n`);

// Listar contenido
console.log('Contenido de dist/:');
const distFiles = fs.readdirSync(distDir);
distFiles.forEach(file => {
    const filePath = path.join(distDir, file);
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`  • ${file} (${sizeMB} MB)`);
    }
});

console.log('\n════════════════════════════════════════════════════');
console.log('  SIGUIENTE PASO:');
console.log('════════════════════════════════════════════════════\n');
console.log('  1. Editar dist\\.env con datos del cliente');
console.log('  2. Probar: cd dist && ControlCharolas.exe');
console.log('  3. Crear ZIP de la carpeta dist\n');
