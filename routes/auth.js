// routes/auth.js
// Rutas de autenticación

const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');

// ============================================
// RUTA: POST /auth/login
// Descripción: Autenticar usuario
// ============================================
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validar datos
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuario y contraseña son requeridos'
            });
        }

        // Conectar a la base de datos
        const pool = await getConnection();
        
        // Buscar usuario en la base de datos
        const result = await pool.request()
            .input('username', username)
            .input('password', password)
            .query(`
                SELECT 
                    UsuarioID,
                    Username,
                    Rol,
                    Activo
                FROM Usuarios
                WHERE Username = @username 
                  AND Password = @password
                  AND Activo = 1
            `);

        // Verificar si se encontró el usuario
        if (result.recordset.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Usuario o contraseña incorrectos'
            });
        }

        const user = result.recordset[0];

        // Actualizar último acceso
        await pool.request()
            .input('usuarioId', user.UsuarioID)
            .query(`
                UPDATE Usuarios 
                SET UltimoAcceso = GETDATE()
                WHERE UsuarioID = @usuarioId
            `);

        // Crear sesión
        req.session.user = {
            id: user.UsuarioID,
            username: user.Username,
            rol: user.Rol
        };

        // Respuesta exitosa
        res.json({
            success: true,
            message: 'Login exitoso',
            user: {
                username: user.Username,
                rol: user.Rol
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar la solicitud'
        });
    }
});

// ============================================
// RUTA: POST /auth/logout
// Descripción: Cerrar sesión
// ============================================
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error al cerrar sesión'
            });
        }
        res.json({
            success: true,
            message: 'Sesión cerrada correctamente'
        });
    });
});

// ============================================
// RUTA: GET /auth/verify
// Descripción: Verificar si hay sesión activa
// ============================================
router.get('/verify', (req, res) => {
    if (req.session && req.session.user) {
        res.json({
            authenticated: true,
            user: req.session.user
        });
    } else {
        res.json({
            authenticated: false
        });
    }
});

module.exports = router;
