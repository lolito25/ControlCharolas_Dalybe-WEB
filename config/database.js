// =====================================================
// ARCHIVO: config/database.js (VERSIÓN PARA EJECUTABLE)
// Este archivo debe reemplazar el database.js original
// =====================================================

const sql = require('mssql');
const path = require('path');

// Para ejecutables PKG, necesitamos cargar .env de forma especial
if (process.pkg) {
    // Estamos en un ejecutable
    const envPath = path.join(path.dirname(process.execPath), '.env');
    console.log('📍 Buscando .env en:', envPath);
    
    // Cargar .env manualmente
    const fs = require('fs');
    try {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length) {
                const value = valueParts.join('=').trim();
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
        console.log('✅ Archivo .env cargado desde:', envPath);
    } catch (error) {
        console.error('❌ No se pudo leer .env:', error.message);
        console.log('⚠️  Asegúrate de que .env existe en la misma carpeta que el ejecutable');
    }
} else {
    // Desarrollo normal
    require('dotenv').config();
}

// Configuración de la base de datos
const config = {
    //server: process.env.DB_SERVER || 'DGDARK\\SQL2022',
    server: process.env.DB_SERVER || 'PRIGAMERR\\DEVELOPER',
    database: process.env.DB_DATABASE || 'ControlCharolas',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '147896321',
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        enableArithAbort: true,
        connectionTimeout: 30000,
        requestTimeout: 30000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Validar configuración
console.log('🔧 Configuración de BD:');
console.log('   Server:', config.server);
console.log('   Database:', config.database);
console.log('   User:', config.user || '(Windows Auth)');
console.log('   Encrypt:', config.options.encrypt);
console.log('   Trust Cert:', config.options.trustServerCertificate);

if (!config.server || config.server === '') {
    console.error('❌ ERROR: DB_SERVER no está configurado en .env');
    console.error('⚠️  Por favor edita el archivo .env y configura DB_SERVER');
}

// Pool de conexiones
let pool;

// Función para obtener conexión
async function getConnection() {
    try {
        if (!pool) {
            console.log('🔄 Creando pool de conexiones...');
            pool = await sql.connect(config);
            console.log('✅ Pool de conexiones creado');
        }
        return pool;
    } catch (error) {
        console.error('❌ Error al conectar con SQL Server:', error);
        throw error;
    }
}

// Función para cerrar conexión
async function closeConnection() {
    try {
        if (pool) {
            await pool.close();
            pool = null;
            console.log('✅ Conexión cerrada');
        }
    } catch (error) {
        console.error('❌ Error al cerrar conexión:', error);
    }
}

// Probar conexión al iniciar
async function testConnection() {
    try {
        console.log('🔄 Probando conexión a la base de datos...');
        const connection = await getConnection();
        const result = await connection.request().query('SELECT DB_NAME() as dbName, GETDATE() as serverDate');
        console.log('✅ Conexión a SQL Server establecida correctamente');
        console.log('🎯 Prueba de conexión exitosa:');
        console.log('   Base de datos:', result.recordset[0].dbName);
        console.log('   Fecha servidor:', result.recordset[0].serverDate);
        return true;
    } catch (error) {
        console.error('❌ Prueba de conexión fallida:', error.message);
        console.log('⚠️  No se pudo conectar a la base de datos');
        console.log('⚠️  Verifica tu archivo .env y la configuración de SQL Server');
        console.log('⚠️  El servidor continuará, pero las funciones de BD no estarán disponibles');
        return false;
    }
}

module.exports = {
    sql,
    getConnection,
    closeConnection,
    testConnection,
    config
};