// server.js
// Servidor principal de la aplicación

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');

// Importar rutas
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// CONFIGURACIÓN DE MIDDLEWARE
// ============================================

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de sesiones
app.use(session({
    secret: process.env.SESSION_SECRET || 'control-charolas-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Cambiar a true en producción con HTTPS
        httpOnly: true,
        maxAge: 8 * 60 * 60 * 1000 // 8 horas
    }
}));

// Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/login.html');
    }
};

// ============================================
// RUTAS
// ============================================

// Rutas de autenticación
app.use('/auth', authRoutes);

// Rutas de API (protegidas)
app.use('/api', requireAuth, apiRoutes);

// Ruta raíz - redirigir a login si no está autenticado
app.get('/', (req, res) => {
    if (req.session && req.session.user) {
        res.redirect('/dashboard.html');
    } else {
        res.redirect('/login.html');
    }
});

// Ruta para cerrar sesión
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
        }
        res.redirect('/login.html');
    });
});

// Ruta para verificar estado de sesión
app.get('/check-session', (req, res) => {
    if (req.session && req.session.user) {
        res.json({
            authenticated: true,
            user: {
                username: req.session.user.username,
                rol: req.session.user.rol
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// ============================================
// MANEJO DE ERRORES
// ============================================

// Error 404
app.use((req, res) => {
    res.status(404).send('Página no encontrada');
});

// Error handler general
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Ha ocurrido un error'
    });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

const startServer = async () => {
    try {
        // Probar conexión a la base de datos
        console.log('🔄 Probando conexión a la base de datos...');
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('⚠️  No se pudo conectar a la base de datos');
            console.error('⚠️  Verifica tu archivo .env y la configuración de SQL Server');
            console.error('⚠️  El servidor continuará, pero las funciones de BD no estarán disponibles');
        }

        // Iniciar servidor
        app.listen(PORT, () => {
            console.log('');
            console.log('╔════════════════════════════════════════════════════╗');
            console.log('║   🚀 SISTEMA DE CONTROL DE CHAROLAS              ║');
            console.log('║                                                    ║');
            console.log(`║   ✅ Servidor ejecutándose en:                    ║`);
            console.log(`║      http://localhost:${PORT}                         ║`);
            console.log('║                                                    ║');
            console.log(`║   🌐 Ambiente: ${process.env.NODE_ENV || 'development'}                      ║`);
            console.log(`║   📦 Base de datos: ${process.env.DB_DATABASE || 'ControlCharolas'}              ║`);
            console.log('║                                                    ║');
            console.log('║   📝 Endpoints disponibles:                       ║');
            console.log(`║      • http://localhost:${PORT}/login.html           ║`);
            console.log(`║      • http://localhost:${PORT}/dashboard.html       ║`);
            console.log('║                                                    ║');
            console.log('╚════════════════════════════════════════════════════╝');
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

// Manejo de cierre graceful
process.on('SIGINT', async () => {
    console.log('\n🔄 Cerrando servidor...');
    const { closeConnection } = require('./config/database');
    await closeConnection();
    process.exit(0);
});

// Iniciar servidor
startServer();
