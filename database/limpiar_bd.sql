-- =====================================================
-- SCRIPT DE LIMPIEZA DE BASE DE DATOS
-- Elimina todos los datos EXCEPTO Usuarios y Entregadores
-- Base de datos: ControlCharolas
-- =====================================================

USE ControlCharolas;
GO

PRINT '╔════════════════════════════════════════════════════╗';
PRINT '║  ⚠️  LIMPIEZA DE BASE DE DATOS                   ║';
PRINT '║  Se eliminarán TODOS los datos excepto:          ║';
PRINT '║  - Usuarios                                       ║';
PRINT '║  - Entregadores                                   ║';
PRINT '╚════════════════════════════════════════════════════╝';
PRINT '';

-- Pausa de seguridad (comentar la siguiente línea para ejecutar)
-- RAISERROR('⚠️ ADVERTENCIA: Este script eliminará datos. Descomenta la línea anterior para continuar.', 16, 1);
-- RETURN;

PRINT 'Iniciando limpieza en 3... 2... 1...';
PRINT '';

-- =====================================================
-- PASO 1: DESACTIVAR CONSTRAINTS
-- =====================================================

PRINT '1. Desactivando constraints temporalmente...';
EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL';
PRINT '   ✅ Constraints desactivados';
PRINT '';

-- =====================================================
-- PASO 2: LIMPIAR TABLAS EN ORDEN
-- =====================================================

PRINT '2. Limpiando tablas...';
PRINT '';

-- Limpiar ControlCharolasProveedor
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ControlCharolasProveedor')
BEGIN
    DELETE FROM ControlCharolasProveedor;
    DBCC CHECKIDENT ('ControlCharolasProveedor', RESEED, 0);
    PRINT '   ✅ ControlCharolasProveedor limpiada';
END

-- Limpiar ControlCharolas
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ControlCharolas')
BEGIN
    DELETE FROM ControlCharolas;
    DBCC CHECKIDENT ('ControlCharolas', RESEED, 0);
    PRINT '   ✅ ControlCharolas limpiada';
END

-- Limpiar IniciosRuta
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'IniciosRuta')
BEGIN
    DELETE FROM IniciosRuta;
    DBCC CHECKIDENT ('IniciosRuta', RESEED, 0);
    PRINT '   ✅ IniciosRuta limpiada';
END

-- Limpiar MovimientosRuta (si existe)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'MovimientosRuta')
BEGIN
    DELETE FROM MovimientosRuta;
    DBCC CHECKIDENT ('MovimientosRuta', RESEED, 0);
    PRINT '   ✅ MovimientosRuta limpiada';
END

-- Limpiar InventarioBodega
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'InventarioBodega')
BEGIN
    DELETE FROM InventarioBodega;
    DBCC CHECKIDENT ('InventarioBodega', RESEED, 0);
    
    -- Insertar registro inicial
    INSERT INTO InventarioBodega (
        CharolasGrandesBodega, 
        CharolasPequenasBodega, 
        Notas,
        UsuarioActualizacion,
        Activo
    ) VALUES (
        0, 
        0, 
        'Inventario inicial después de limpieza',
        'Sistema',
        1
    );
    PRINT '   ✅ InventarioBodega limpiada (con registro inicial)';
END

-- Limpiar Proveedores
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Proveedores')
BEGIN
    DELETE FROM Proveedores;
    DBCC CHECKIDENT ('Proveedores', RESEED, 0);
    PRINT '   ✅ Proveedores limpiada';
END

-- Limpiar Clientes
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Clientes')
BEGIN
    DELETE FROM Clientes;
    -- No se reinicia IDENTITY porque usa VARCHAR como clave primaria
    PRINT '   ✅ Clientes limpiada';
END

-- Limpiar Productos (si existe)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Productos')
BEGIN
    DELETE FROM Productos;
    DBCC CHECKIDENT ('Productos', RESEED, 0);
    PRINT '   ✅ Productos limpiada';
END

-- Limpiar ProveedorCodigosUnicos (si existe)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ProveedorCodigosUnicos')
BEGIN
    DELETE FROM ProveedorCodigosUnicos;
    DBCC CHECKIDENT ('ProveedorCodigosUnicos', RESEED, 0);
    PRINT '   ✅ ProveedorCodigosUnicos limpiada';
END

-- ⚠️ NO TOCAR ESTAS TABLAS:
-- ❌ Usuarios (se preservan)
-- ❌ Entregadores (se preservan)

PRINT '';

-- =====================================================
-- PASO 3: REACTIVAR CONSTRAINTS
-- =====================================================

PRINT '3. Reactivando constraints...';
EXEC sp_MSforeachtable 'ALTER TABLE ? CHECK CONSTRAINT ALL';
PRINT '   ✅ Constraints reactivados';
PRINT '';

-- =====================================================
-- PASO 4: VERIFICACIÓN FINAL
-- =====================================================

PRINT '╔════════════════════════════════════════════════════╗';
PRINT '║  VERIFICACIÓN FINAL                                ║';
PRINT '╚════════════════════════════════════════════════════╝';
PRINT '';

-- Contar registros en cada tabla
PRINT 'Conteo de registros:';
PRINT '';

DECLARE @Sql NVARCHAR(MAX);
DECLARE @TableName NVARCHAR(128);

DECLARE table_cursor CURSOR FOR
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
AND TABLE_NAME NOT IN ('sysdiagrams')
ORDER BY TABLE_NAME;

OPEN table_cursor;
FETCH NEXT FROM table_cursor INTO @TableName;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @Sql = 'SELECT ''' + @TableName + ''' AS Tabla, COUNT(*) AS Registros FROM ' + @TableName;
    EXEC sp_executesql @Sql;
    FETCH NEXT FROM table_cursor INTO @TableName;
END;

CLOSE table_cursor;
DEALLOCATE table_cursor;

PRINT '';

-- Mostrar usuarios preservados
PRINT '✅ USUARIOS PRESERVADOS:';
SELECT 
    UsuarioID,
    Username,
    Rol,
    CASE WHEN Activo = 1 THEN 'Activo' ELSE 'Inactivo' END AS Estado
FROM Usuarios
ORDER BY UsuarioID;

PRINT '';

-- Mostrar entregadores preservados
PRINT '✅ ENTREGADORES PRESERVADOS:';
SELECT 
    EntregadorID,
    Codigo,
    Nombre + ' ' + Apellido AS NombreCompleto,
    CASE WHEN Activo = 1 THEN 'Activo' ELSE 'Inactivo' END AS Estado
FROM Entregadores
ORDER BY EntregadorID;

PRINT '';
PRINT '╔════════════════════════════════════════════════════╗';
PRINT '║  ✅ LIMPIEZA COMPLETADA EXITOSAMENTE             ║';
PRINT '╚════════════════════════════════════════════════════╝';
PRINT '';
PRINT 'Datos eliminados:';
PRINT '  ✅ Todos los clientes';
PRINT '  ✅ Todos los movimientos';
PRINT '  ✅ Todas las rutas';
PRINT '  ✅ Todos los proveedores';
PRINT '  ✅ Todo el inventario (excepto registro inicial)';
PRINT '';
PRINT 'Datos preservados:';
PRINT '  ✅ Usuarios (' + CAST((SELECT COUNT(*) FROM Usuarios) AS VARCHAR) + ' registros)';
PRINT '  ✅ Entregadores (' + CAST((SELECT COUNT(*) FROM Entregadores) AS VARCHAR) + ' registros)';
PRINT '';
PRINT '🎯 La base de datos está lista para comenzar desde cero';