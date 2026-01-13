-- =====================================================
-- CORRECCIÓN RÁPIDA - INVENTARIO DE RUTAS
-- Solución inmediata para error "El entregador solo tiene 0"
-- =====================================================

USE ControlCharolas;
GO

PRINT '🔧 CORRECCIÓN RÁPIDA EN PROGRESO...';
PRINT '';

-- =====================================================
-- 1. VERIFICAR Y CREAR TABLA SI NO EXISTE
-- =====================================================

IF OBJECT_ID('IniciosRuta', 'U') IS NULL
BEGIN
    PRINT '❌ Tabla IniciosRuta no existe. Creando...';
    
    CREATE TABLE IniciosRuta (
        InicioRutaID INT PRIMARY KEY IDENTITY(1,1),
        CodigoRuta VARCHAR(20) NOT NULL,
        NombreRuta VARCHAR(100) NOT NULL,
        EntregadorID VARCHAR(20) NOT NULL,
        FechaInicio DATETIME DEFAULT GETDATE(),
        CharolasGrandesInicio INT NOT NULL DEFAULT 0,
        CharolasPequenasInicio INT NOT NULL DEFAULT 0,
        CharolasGrandesActuales INT NOT NULL DEFAULT 0,
        CharolasPequenasActuales INT NOT NULL DEFAULT 0,
        Observaciones VARCHAR(255) NULL,
        UsuarioRegistro VARCHAR(50) NOT NULL,
        FechaRegistro DATETIME DEFAULT GETDATE(),
        EstadoRuta VARCHAR(20) DEFAULT 'Iniciada',
        FechaFinalizacion DATETIME NULL,
        Activo BIT DEFAULT 1
    );
    
    PRINT '✅ Tabla creada';
END

-- =====================================================
-- 2. AGREGAR COLUMNAS SI FALTAN
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('IniciosRuta') AND name = 'CharolasGrandesActuales')
BEGIN
    ALTER TABLE IniciosRuta ADD CharolasGrandesActuales INT NOT NULL DEFAULT 0;
    PRINT '✅ Columna CharolasGrandesActuales agregada';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('IniciosRuta') AND name = 'CharolasPequenasActuales')
BEGIN
    ALTER TABLE IniciosRuta ADD CharolasPequenasActuales INT NOT NULL DEFAULT 0;
    PRINT '✅ Columna CharolasPequenasActuales agregada';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('IniciosRuta') AND name = 'Activo')
BEGIN
    ALTER TABLE IniciosRuta ADD Activo BIT DEFAULT 1;
    UPDATE IniciosRuta SET Activo = 1 WHERE Activo IS NULL;
    PRINT '✅ Columna Activo agregada';
END

-- =====================================================
-- 3. INICIALIZAR INVENTARIO ACTUAL
-- =====================================================

UPDATE IniciosRuta
SET 
    CharolasGrandesActuales = CharolasGrandesInicio,
    CharolasPequenasActuales = CharolasPequenasInicio
WHERE (CharolasGrandesActuales IS NULL OR CharolasGrandesActuales = 0)
  AND CharolasGrandesInicio > 0;

DECLARE @Inicializadas INT = @@ROWCOUNT;
IF @Inicializadas > 0
    PRINT '✅ ' + CAST(@Inicializadas AS VARCHAR) + ' rutas inicializadas';

-- =====================================================
-- 4. CREAR RUTA DE PRUEBA SI NO EXISTE NINGUNA
-- =====================================================

IF NOT EXISTS (SELECT 1 FROM IniciosRuta WHERE Activo = 1)
BEGIN
    PRINT '⚠️  No hay rutas activas. Creando ruta de prueba...';
    
    INSERT INTO IniciosRuta (
        CodigoRuta, NombreRuta, EntregadorID,
        CharolasGrandesInicio, CharolasPequenasInicio,
        CharolasGrandesActuales, CharolasPequenasActuales,
        UsuarioRegistro, EstadoRuta, Activo
    )
    VALUES (
        'RUTA001', 'Ruta Principal', 'ENT001',
        300, 250,  -- Inicio
        300, 250,  -- Actuales
        'Sistema', 'Iniciada', 1
    );
    
    PRINT '✅ Ruta RUTA001 creada (300 grandes, 250 pequeñas)';
END

-- =====================================================
-- 5. VERIFICACIÓN FINAL
-- =====================================================

PRINT '';
PRINT '========================================';
PRINT 'VERIFICACIÓN FINAL';
PRINT '========================================';
PRINT '';

DECLARE @RutasActivas INT;
DECLARE @GrandesTotal INT;
DECLARE @PequenasTotal INT;

SELECT 
    @RutasActivas = COUNT(*),
    @GrandesTotal = SUM(ISNULL(CharolasGrandesActuales, 0)),
    @PequenasTotal = SUM(ISNULL(CharolasPequenasActuales, 0))
FROM IniciosRuta
WHERE Activo = 1;

IF @RutasActivas = 0
BEGIN
    PRINT '❌ PROBLEMA: No hay rutas activas';
    PRINT '   SOLUCIÓN: Crear una ruta manualmente o ejecutar:';
    PRINT '   INSERT INTO IniciosRuta (...) VALUES (...);';
END
ELSE IF @GrandesTotal = 0 AND @PequenasTotal = 0
BEGIN
    PRINT '❌ PROBLEMA: Las rutas tienen inventario en 0';
    PRINT '   SOLUCIÓN: Actualizar inventario con:';
    PRINT '   UPDATE IniciosRuta SET CharolasGrandesActuales = 300, CharolasPequenasActuales = 250;';
END
ELSE
BEGIN
    PRINT '✅ TODO CORRECTO';
    PRINT '   Rutas activas: ' + CAST(@RutasActivas AS VARCHAR);
    PRINT '   Charolas grandes disponibles: ' + CAST(@GrandesTotal AS VARCHAR);
    PRINT '   Charolas pequeñas disponibles: ' + CAST(@PequenasTotal AS VARCHAR);
END

PRINT '';

-- Mostrar rutas activas
SELECT 
    InicioRutaID AS 'ID',
    CodigoRuta AS 'Código',
    EntregadorID AS 'Entregador',
    CharolasGrandesActuales AS 'Grandes',
    CharolasPequenasActuales AS 'Pequeñas',
    EstadoRuta AS 'Estado',
    CONVERT(VARCHAR, FechaInicio, 120) AS 'Fecha Inicio'
FROM IniciosRuta
WHERE Activo = 1
ORDER BY FechaInicio DESC;

PRINT '';
PRINT '========================================';
PRINT '✅ CORRECCIÓN COMPLETADA';
PRINT '========================================';
PRINT '';
PRINT 'SIGUIENTE PASO:';
PRINT '1. Reinicia servidor: Ctrl+C, luego npm start';
PRINT '2. Recarga la página: F5';
PRINT '3. Intenta el movimiento de nuevo';
PRINT '';

-- Probar si puede descargar 4 grandes y 6 pequeñas
DECLARE @Disponibles INT;
SELECT @Disponibles = CharolasGrandesActuales
FROM IniciosRuta
WHERE Activo = 1;

IF @Disponibles >= 4
BEGIN
    PRINT '✅ Inventario suficiente para descargar 4 charolas grandes';
END
ELSE
BEGIN
    PRINT '❌ Inventario INSUFICIENTE para descargar 4 charolas grandes';
    PRINT '   Disponibles: ' + CAST(ISNULL(@Disponibles, 0) AS VARCHAR);
END

GO
