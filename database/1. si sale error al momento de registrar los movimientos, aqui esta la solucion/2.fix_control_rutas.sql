-- =====================================================
-- DIAGNÓSTICO Y CORRECCIÓN DE CONTROL DE RUTAS
-- Soluciona error: "El entregador solo tiene 0"
-- =====================================================

USE ControlCharolas;
GO

PRINT '========================================';
PRINT 'DIAGNÓSTICO DE CONTROL DE RUTAS';
PRINT '========================================';
PRINT '';

-- =====================================================
-- PASO 1: VERIFICAR ESTRUCTURA DE RUTAS
-- =====================================================

PRINT '1. Verificando estructura de IniciosRuta...';
PRINT '';

-- Verificar tabla IniciosRuta
IF OBJECT_ID('IniciosRuta', 'U') IS NULL
BEGIN
    PRINT '❌ ERROR: Tabla IniciosRuta no existe';
    PRINT '   Ejecutando creación...';
    
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
    
    CREATE INDEX IX_IniciosRuta_CodigoRuta ON IniciosRuta(CodigoRuta);
    CREATE INDEX IX_IniciosRuta_EntregadorID ON IniciosRuta(EntregadorID);
    CREATE INDEX IX_IniciosRuta_FechaInicio ON IniciosRuta(FechaInicio);
    
    PRINT '   ✅ Tabla IniciosRuta creada';
END
ELSE
BEGIN
    PRINT '✅ Tabla IniciosRuta existe';
    
    -- Verificar columnas críticas
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('IniciosRuta') AND name = 'CharolasGrandesActuales')
    BEGIN
        ALTER TABLE IniciosRuta ADD CharolasGrandesActuales INT NOT NULL DEFAULT 0;
        PRINT '   ✅ Columna CharolasGrandesActuales agregada';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('IniciosRuta') AND name = 'CharolasPequenasActuales')
    BEGIN
        ALTER TABLE IniciosRuta ADD CharolasPequenasActuales INT NOT NULL DEFAULT 0;
        PRINT '   ✅ Columna CharolasPequenasActuales agregada';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('IniciosRuta') AND name = 'Activo')
    BEGIN
        ALTER TABLE IniciosRuta ADD Activo BIT DEFAULT 1;
        PRINT '   ✅ Columna Activo agregada';
    END
END

PRINT '';

-- =====================================================
-- PASO 2: VER RUTAS ACTIVAS
-- =====================================================

PRINT '2. Rutas actualmente activas:';
PRINT '----------------------------------------';

IF EXISTS (SELECT 1 FROM IniciosRuta WHERE Activo = 1 OR EstadoRuta = 'Iniciada')
BEGIN
    SELECT 
        InicioRutaID,
        CodigoRuta,
        NombreRuta,
        EntregadorID,
        CharolasGrandesInicio AS 'GrandesInicio',
        CharolasPequenasInicio AS 'PequenasInicio',
        ISNULL(CharolasGrandesActuales, CharolasGrandesInicio) AS 'GrandesActuales',
        ISNULL(CharolasPequenasActuales, CharolasPequenasInicio) AS 'PequenasActuales',
        EstadoRuta,
        FechaInicio
    FROM IniciosRuta
    WHERE Activo = 1 OR EstadoRuta = 'Iniciada'
    ORDER BY FechaInicio DESC;
END
ELSE
BEGIN
    PRINT '⚠️  No hay rutas activas';
    PRINT '   Esto puede ser la causa del error';
END

PRINT '';

-- =====================================================
-- PASO 3: INICIALIZAR CHAROLAS ACTUALES
-- =====================================================

PRINT '3. Inicializando CharolasActuales...';
PRINT '';

-- Copiar valores iniciales a actuales si están en NULL o 0
UPDATE IniciosRuta
SET 
    CharolasGrandesActuales = CharolasGrandesInicio,
    CharolasPequenasActuales = CharolasPequenasInicio
WHERE (CharolasGrandesActuales IS NULL OR CharolasGrandesActuales = 0)
  AND (CharolasPequenasActuales IS NULL OR CharolasPequenasActuales = 0)
  AND (Activo = 1 OR EstadoRuta = 'Iniciada');

DECLARE @Updated INT = @@ROWCOUNT;
PRINT '✅ ' + CAST(@Updated AS VARCHAR) + ' rutas inicializadas';

PRINT '';

-- =====================================================
-- PASO 4: CREAR PROCEDIMIENTO DE VALIDACIÓN
-- =====================================================

PRINT '4. Creando procedimiento de validación...';
PRINT '';

IF OBJECT_ID('sp_ValidarInventarioRuta', 'P') IS NOT NULL
    DROP PROCEDURE sp_ValidarInventarioRuta;
GO

CREATE PROCEDURE sp_ValidarInventarioRuta
    @RutaID INT = NULL,
    @CharolasGrandesRequeridas INT = 0,
    @CharolasPequenasRequeridas INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @GrandesDisponibles INT;
    DECLARE @PequenasDisponibles INT;
    DECLARE @CodigoRuta VARCHAR(20);
    
    -- Si no se especifica RutaID, buscar la ruta activa más reciente
    IF @RutaID IS NULL
    BEGIN
        SELECT TOP 1 
            @RutaID = InicioRutaID,
            @GrandesDisponibles = ISNULL(CharolasGrandesActuales, CharolasGrandesInicio),
            @PequenasDisponibles = ISNULL(CharolasPequenasActuales, CharolasPequenasInicio),
            @CodigoRuta = CodigoRuta
        FROM IniciosRuta
        WHERE Activo = 1 OR EstadoRuta = 'Iniciada'
        ORDER BY FechaInicio DESC;
        
        IF @RutaID IS NULL
        BEGIN
            SELECT 
                'ERROR' AS Status,
                'No hay rutas activas. Debe iniciar una ruta primero.' AS Message,
                0 AS GrandesDisponibles,
                0 AS PequenasDisponibles;
            RETURN;
        END
    END
    ELSE
    BEGIN
        SELECT 
            @GrandesDisponibles = ISNULL(CharolasGrandesActuales, CharolasGrandesInicio),
            @PequenasDisponibles = ISNULL(CharolasPequenasActuales, CharolasPequenasInicio),
            @CodigoRuta = CodigoRuta
        FROM IniciosRuta
        WHERE InicioRutaID = @RutaID;
    END
    
    -- Validar disponibilidad
    IF @GrandesDisponibles < @CharolasGrandesRequeridas
    BEGIN
        SELECT 
            'ERROR' AS Status,
            'No puede descargar ' + CAST(@CharolasGrandesRequeridas AS VARCHAR) + 
            ' charolas grandes. La ruta ' + @CodigoRuta + ' solo tiene ' + 
            CAST(@GrandesDisponibles AS VARCHAR) AS Message,
            @GrandesDisponibles AS GrandesDisponibles,
            @PequenasDisponibles AS PequenasDisponibles;
        RETURN;
    END
    
    IF @PequenasDisponibles < @CharolasPequenasRequeridas
    BEGIN
        SELECT 
            'ERROR' AS Status,
            'No puede descargar ' + CAST(@CharolasPequenasRequeridas AS VARCHAR) + 
            ' charolas pequeñas. La ruta ' + @CodigoRuta + ' solo tiene ' + 
            CAST(@PequenasDisponibles AS VARCHAR) AS Message,
            @GrandesDisponibles AS GrandesDisponibles,
            @PequenasDisponibles AS PequenasDisponibles;
        RETURN;
    END
    
    -- Si todo OK
    SELECT 
        'SUCCESS' AS Status,
        'Inventario suficiente' AS Message,
        @GrandesDisponibles AS GrandesDisponibles,
        @PequenasDisponibles AS PequenasDisponibles,
        @RutaID AS RutaID;
END
GO

PRINT '✅ Procedimiento sp_ValidarInventarioRuta creado';
PRINT '';

-- =====================================================
-- PASO 5: CREAR PROCEDIMIENTO DE ACTUALIZACIÓN
-- =====================================================

PRINT '5. Creando procedimiento de actualización...';
PRINT '';

IF OBJECT_ID('sp_ActualizarInventarioRuta', 'P') IS NOT NULL
    DROP PROCEDURE sp_ActualizarInventarioRuta;
GO

CREATE PROCEDURE sp_ActualizarInventarioRuta
    @RutaID INT,
    @CharolasGrandesDescargadas INT = 0,
    @CharolasGrandesRecogidas INT = 0,
    @CharolasPequenasDescargadas INT = 0,
    @CharolasPequenasRecogidas INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Actualizar inventario actual de la ruta
        UPDATE IniciosRuta
        SET 
            CharolasGrandesActuales = CharolasGrandesActuales - @CharolasGrandesDescargadas + @CharolasGrandesRecogidas,
            CharolasPequenasActuales = CharolasPequenasActuales - @CharolasPequenasDescargadas + @CharolasPequenasRecogidas
        WHERE InicioRutaID = @RutaID;
        
        COMMIT TRANSACTION;
        
        -- Retornar nuevo inventario
        SELECT 
            'SUCCESS' AS Status,
            'Inventario actualizado' AS Message,
            CharolasGrandesActuales AS GrandesActuales,
            CharolasPequenasActuales AS PequenasActuales
        FROM IniciosRuta
        WHERE InicioRutaID = @RutaID;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SELECT 
            'ERROR' AS Status,
            ERROR_MESSAGE() AS Message;
    END CATCH
END
GO

PRINT '✅ Procedimiento sp_ActualizarInventarioRuta creado';
PRINT '';

-- =====================================================
-- PASO 6: CREAR RUTA DE PRUEBA SI NO EXISTE
-- =====================================================

PRINT '6. Verificando ruta activa...';
PRINT '';

IF NOT EXISTS (SELECT 1 FROM IniciosRuta WHERE Activo = 1 OR EstadoRuta = 'Iniciada')
BEGIN
    PRINT '⚠️  No hay rutas activas. Creando ruta de prueba...';
    
    INSERT INTO IniciosRuta (
        CodigoRuta,
        NombreRuta,
        EntregadorID,
        FechaInicio,
        CharolasGrandesInicio,
        CharolasPequenasInicio,
        CharolasGrandesActuales,
        CharolasPequenasActuales,
        Observaciones,
        UsuarioRegistro,
        EstadoRuta,
        Activo
    )
    VALUES (
        'RUTA001',
        'Ruta Principal',
        'ENT001',
        GETDATE(),
        250,  -- Charolas grandes
        200,  -- Charolas pequeñas
        250,
        200,
        'Ruta creada automáticamente para pruebas',
        'Sistema',
        'Iniciada',
        1
    );
    
    PRINT '   ✅ Ruta de prueba creada con 250 grandes y 200 pequeñas';
END
ELSE
BEGIN
    PRINT '✅ Ya existe una ruta activa';
END

PRINT '';

-- =====================================================
-- PASO 7: RESUMEN Y VERIFICACIÓN
-- =====================================================

PRINT '========================================';
PRINT 'RESUMEN DEL DIAGNÓSTICO';
PRINT '========================================';
PRINT '';

SELECT 
    'Rutas Activas' AS 'Categoría',
    COUNT(*) AS 'Cantidad'
FROM IniciosRuta
WHERE Activo = 1 OR EstadoRuta = 'Iniciada'

UNION ALL

SELECT 
    'Inventario Total Grandes' AS 'Categoría',
    SUM(ISNULL(CharolasGrandesActuales, CharolasGrandesInicio)) AS 'Cantidad'
FROM IniciosRuta
WHERE Activo = 1 OR EstadoRuta = 'Iniciada'

UNION ALL

SELECT 
    'Inventario Total Pequeñas' AS 'Categoría',
    SUM(ISNULL(CharolasPequenasActuales, CharolasPequenasInicio)) AS 'Cantidad'
FROM IniciosRuta
WHERE Activo = 1 OR EstadoRuta = 'Iniciada';

PRINT '';
PRINT '========================================';
PRINT '✅ DIAGNÓSTICO COMPLETADO';
PRINT '========================================';
PRINT '';
PRINT 'PROCEDIMIENTOS CREADOS:';
PRINT '  • sp_ValidarInventarioRuta';
PRINT '  • sp_ActualizarInventarioRuta';
PRINT '';
PRINT 'SIGUIENTE PASO:';
PRINT '1. Reinicia el servidor Node.js';
PRINT '2. Intenta registrar el movimiento de nuevo';
PRINT '3. El error debe desaparecer';
PRINT '';

-- Prueba rápida
PRINT 'PRUEBA DE VALIDACIÓN:';
EXEC sp_ValidarInventarioRuta NULL, 4, 6;

GO
