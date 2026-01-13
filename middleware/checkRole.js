// middleware/checkRole.js
// Middleware para verificar roles de usuario

/**
 * Middleware para verificar que el usuario sea Administrador
 */
const isAdmin = (req, res, next) => {
    // Verificar que hay sesión
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'No autenticado'
        });
    }

    // Verificar que el rol sea Administrador
    if (req.session.user.rol !== 'Administrador') {
        return res.status(403).json({
            success: false,
            message: '❌ Acceso denegado. Solo los administradores pueden realizar esta acción.'
        });
    }

    // Si es admin, continuar
    next();
};

/**
 * Middleware para verificar que el usuario esté autenticado
 */
const isAuthenticated = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'No autenticado'
        });
    }
    next();
};

module.exports = {
    isAdmin,
    isAuthenticated
};
