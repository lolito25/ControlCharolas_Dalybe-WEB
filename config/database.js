
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

// =====================================================
// PARSEAR DB_SERVER para separar servidor y puerto
// =====================================================
function parseServerString(serverString) {
    if (!serverString) {
        return { server: 'localhost', port: undefined, instanceName: undefined };
    }

    console.log('🔍 Parseando DB_SERVER:', serverString);

    // Verificar si contiene coma (formato: SERVIDOR,PUERTO)
    if (serverString.includes(',')) {
        const parts = serverString.split(',');
        const serverPart = parts[0].trim();
        const port = parseInt(parts[1].trim());
        
        // Verificar si el serverPart tiene instancia (contiene \)
        let server = serverPart;
        let instanceName = undefined;
        
        if (serverPart.includes('\\')) {
            const instanceParts = serverPart.split('\\');
            server = instanceParts[0].trim();
            instanceName = instanceParts[1].trim();
        }
        
        console.log('   ✅ Formato: SERVIDOR,PUERTO');
        console.log('   Servidor:', server);
        console.log('   Puerto:', port);
        if (instanceName) {
            console.log('   Instancia:', instanceName, '(ignorada cuando se usa puerto explícito)');
        }
        
        return { server, port, instanceName: undefined };
    }
    
    // Verificar si contiene instancia (formato: SERVIDOR\INSTANCIA)
    if (serverString.includes('\\')) {
        const parts = serverString.split('\\');
        const server = parts[0].trim();
        const instanceName = parts[1].trim();
        
        console.log('   ✅ Formato: SERVIDOR\\INSTANCIA');
        console.log('   Servidor:', server);
        console.log('   Instancia:', instanceName);
        console.log('   Puerto: (dinámico vía SQL Browser)');
        
        return { server, port: undefined, instanceName };
    }
    
    // Formato simple: solo SERVIDOR
    console.log('   ✅ Formato: SERVIDOR (sin instancia)');
    console.log('   Servidor:', serverString);
    console.log('   Puerto: 1433 (por defecto)');
    
    return { server: serverString, port: undefined, instanceName: undefined };
}

const serverConfig = parseServerString(process.env.DB_SERVER || 'DGDARK\\SQL2022');

// Configuración de la base de datos
const config = {
    server: serverConfig.server,
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

// Agregar puerto solo si fue especificado explícitamente
if (serverConfig.port) {
    config.port = serverConfig.port;
    console.log('   🔌 Puerto explícito configurado:', config.port);
}

// Agregar instanceName solo si existe y NO hay puerto explícito
if (serverConfig.instanceName && !serverConfig.port) {
    config.options.instanceName = serverConfig.instanceName;
    console.log('   🏢 Instancia configurada:', serverConfig.instanceName);
}

// Validar configuración
console.log('\n🔧 Configuración final de BD:');
console.log('   Server:', config.server);
if (config.port) {
    console.log('   Port:', config.port);
}
if (config.options.instanceName) {
    console.log('   Instance:', config.options.instanceName);
}
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
            console.log('\n🔄 Creando pool de conexiones...');
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
        console.log('\n🔄 Probando conexión a la base de datos...');
        const connection = await getConnection();
        const result = await connection.request().query('SELECT DB_NAME() as dbName, GETDATE() as serverDate');
        console.log('✅ Conexión a SQL Server establecida correctamente');
        console.log('🎯 Prueba de conexión exitosa:');
        console.log('   Base de datos:', result.recordset[0].dbName);
        console.log('   Fecha servidor:', result.recordset[0].serverDate);
        return true;
    } catch (error) {
        console.error('❌ Prueba de conexión fallida:', error.message);
        console.log('\n⚠️  No se pudo conectar a la base de datos');
        console.log('⚠️  Verifica tu archivo .env y la configuración de SQL Server');
        console.log('⚠️  El servidor continuará, pero las funciones de BD no estarán disponibles');
        
        // Mostrar sugerencias según el error
        if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
            console.log('\n💡 SUGERENCIA:');
            console.log('   El servidor no pudo ser encontrado.');
            console.log('   Verifica que DB_SERVER en .env sea correcto.');
        } else if (error.message.includes('Port for')) {
            console.log('\n💡 SUGERENCIA:');
            console.log('   No se pudo encontrar el puerto de la instancia.');
            console.log('   Verifica que SQL Server Browser esté corriendo:');
            console.log('   net start SQLBrowser');
        } else if (error.message.includes('Login failed')) {
            console.log('\n💡 SUGERENCIA:');
            console.log('   Las credenciales son incorrectas.');
            console.log('   Verifica DB_USER y DB_PASSWORD en .env');
        }
        
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