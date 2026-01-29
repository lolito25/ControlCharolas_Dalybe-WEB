-- =====================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS: ControlCharolas
-- Compatible con SQL Server 2019 y versiones superiores
-- Versión: 1.0
-- Fecha: Enero 2026
-- =====================================================

USE master;
GO

-- =====================================================
-- PASO 1: CREAR BASE DE DATOS SI NO EXISTE
-- =====================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'ControlCharolas')
BEGIN
    PRINT '📦 Creando base de datos ControlCharolas...';
    CREATE DATABASE ControlCharolas;
    PRINT '✅ Base de datos ControlCharolas creada exitosamente';
END
ELSE
BEGIN
    PRINT '⚠️  La base de datos ControlCharolas ya existe';
END
GO

USE ControlCharolas;
GO

PRINT '';
PRINT '╔════════════════════════════════════════════════════╗';
PRINT '║  CREACIÓN DE ESTRUCTURA DE BASE DE DATOS          ║';
PRINT '╚════════════════════════════════════════════════════╝';
PRINT '';

-- =====================================================
-- PASO 2: CREAR TABLAS
-- =====================================================

-- =====================================================
-- TABLA: Usuarios
-- Descripción: Almacena los usuarios del sistema
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Usuarios')
BEGIN
    PRINT '📋 Creando tabla: Usuarios...';
    CREATE TABLE Usuarios (
        UsuarioID INT IDENTITY(1,1) PRIMARY KEY,
        Username VARCHAR(50) NOT NULL UNIQUE,
        Password VARCHAR(255) NOT NULL,
        Rol VARCHAR(20) NOT NULL CHECK (Rol IN ('Administrador', 'Oficina')),
        Activo BIT NOT NULL DEFAULT 1,
        UltimoAcceso DATETIME NULL,
        FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT CK_Usuarios_Rol CHECK (Rol IN ('Administrador', 'Oficina'))
    );
    PRINT '   ✅ Tabla Usuarios creada';
END
ELSE
    PRINT '   ⚠️  Tabla Usuarios ya existe';
GO

-- =====================================================
-- TABLA: Entregadores
-- Descripción: Almacena los entregadores/conductores
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Entregadores')
BEGIN
    PRINT '📋 Creando tabla: Entregadores...';
    CREATE TABLE Entregadores (
        EntregadorID INT IDENTITY(1,1) PRIMARY KEY,
        Codigo VARCHAR(10) NOT NULL UNIQUE,
        Nombre VARCHAR(100) NOT NULL,
        Apellido VARCHAR(100) NOT NULL,
        Telefono VARCHAR(20) NULL,
        UsuarioCreacion VARCHAR(50) NULL,
        FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
        Activo BIT NOT NULL DEFAULT 1
    );
    PRINT '   ✅ Tabla Entregadores creada';
END
ELSE
    PRINT '   ⚠️  Tabla Entregadores ya existe';
GO

-- =====================================================
-- TABLA: Clientes
-- Descripción: Almacena la información de los clientes
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Clientes')
BEGIN
    PRINT '📋 Creando tabla: Clientes...';
    CREATE TABLE Clientes (
        CodigoCliente VARCHAR(20) PRIMARY KEY,
        NombreCliente VARCHAR(200) NOT NULL,
        NombreEstablecimiento VARCHAR(200) NULL,
        Vendedor VARCHAR(100) NULL,
        Municipio VARCHAR(100) NULL,
        UsuarioCreacion VARCHAR(50) NULL,
        FechaCreacion DATETIME NOT NULL DEFAULT GETDATE()
    );
    PRINT '   ✅ Tabla Clientes creada';
END
ELSE
    PRINT '   ⚠️  Tabla Clientes ya existe';
GO

-- =====================================================
-- TABLA: IniciosRuta
-- Descripción: Almacena los inicios de ruta de los entregadores
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'IniciosRuta')
BEGIN
    PRINT '📋 Creando tabla: IniciosRuta...';
    CREATE TABLE IniciosRuta (
        InicioRutaID INT IDENTITY(1,1) PRIMARY KEY,
        CodigoRuta VARCHAR(50) NOT NULL UNIQUE,
        NombreRuta VARCHAR(200) NOT NULL,
        EntregadorID VARCHAR(200) NOT NULL,  -- Almacena el nombre completo del entregador
        FechaInicio DATETIME NOT NULL,
        CharolasGrandesInicio INT NOT NULL DEFAULT 0,
        CharolasPequenasInicio INT NOT NULL DEFAULT 0,
        CharolasGrandesActuales INT NULL,
        CharolasPequenasActuales INT NULL,
        Observaciones VARCHAR(MAX) NULL,
        EstadoRuta VARCHAR(20) NOT NULL DEFAULT 'Iniciada' CHECK (EstadoRuta IN ('Iniciada', 'Finalizada', 'Cancelada')),
        UsuarioRegistro VARCHAR(50) NULL,
        FechaRegistro DATETIME NOT NULL DEFAULT GETDATE(),
        FechaFinalizacion DATETIME NULL,
        CONSTRAINT CK_IniciosRuta_Estado CHECK (EstadoRuta IN ('Iniciada', 'Finalizada', 'Cancelada'))
    );
    PRINT '   ✅ Tabla IniciosRuta creada';
END
ELSE
    PRINT '   ⚠️  Tabla IniciosRuta ya existe';
GO

-- =====================================================
-- TABLA: ControlCharolas
-- Descripción: Almacena los movimientos de charolas por cliente
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ControlCharolas')
BEGIN
    PRINT '📋 Creando tabla: ControlCharolas...';
    CREATE TABLE ControlCharolas (
        ControlID INT IDENTITY(1,1) PRIMARY KEY,
        CodigoCliente VARCHAR(20) NOT NULL,
        FechaMovimiento DATETIME NOT NULL DEFAULT GETDATE(),
        SaldoAnterior INT NOT NULL DEFAULT 0,
        CantidadDescargada INT NOT NULL DEFAULT 0,
        CantidadRecogida INT NOT NULL DEFAULT 0,
        SaldoReportado INT NOT NULL DEFAULT 0,
        SaldoAnteriorPequenas INT NOT NULL DEFAULT 0,
        CantidadDescargadaPequenas INT NOT NULL DEFAULT 0,
        CantidadRecogidaPequenas INT NOT NULL DEFAULT 0,
        SaldoReportadoPequenas INT NOT NULL DEFAULT 0,
        DiferenciaCharolas AS (
            (SaldoAnterior + CantidadDescargada - CantidadRecogida - SaldoReportado) +
            (SaldoAnteriorPequenas + CantidadDescargadaPequenas - CantidadRecogidaPequenas - SaldoReportadoPequenas)
        ) PERSISTED,
        Verificado BIT NOT NULL DEFAULT 0,
        UsuarioRegistro VARCHAR(50) NULL,
        RutaID INT NULL,
        FechaRegistro DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_ControlCharolas_Clientes FOREIGN KEY (CodigoCliente) REFERENCES Clientes(CodigoCliente),
        CONSTRAINT FK_ControlCharolas_IniciosRuta FOREIGN KEY (RutaID) REFERENCES IniciosRuta(InicioRutaID) ON DELETE SET NULL
    );
    
    -- Índices para mejorar el rendimiento
    CREATE INDEX IX_ControlCharolas_Cliente ON ControlCharolas(CodigoCliente);
    CREATE INDEX IX_ControlCharolas_Fecha ON ControlCharolas(FechaMovimiento DESC);
    CREATE INDEX IX_ControlCharolas_Ruta ON ControlCharolas(RutaID);
    
    PRINT '   ✅ Tabla ControlCharolas creada con índices';
END
ELSE
    PRINT '   ⚠️  Tabla ControlCharolas ya existe';
GO

-- =====================================================
-- TABLA: InventarioBodega
-- Descripción: Almacena el historial de inventario en bodega
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InventarioBodega')
BEGIN
    PRINT '📋 Creando tabla: InventarioBodega...';
    CREATE TABLE InventarioBodega (
        BodegaID INT IDENTITY(1,1) PRIMARY KEY,
        CharolasGrandesBodega INT NOT NULL DEFAULT 0,
        CharolasPequenasBodega INT NOT NULL DEFAULT 0,
        TotalCharolasBodega AS (CharolasGrandesBodega + CharolasPequenasBodega) PERSISTED,
        Notas VARCHAR(MAX) NULL,
        UsuarioActualizacion VARCHAR(50) NULL,
        FechaActualizacion DATETIME NOT NULL DEFAULT GETDATE(),
        Activo BIT NOT NULL DEFAULT 1
    );
    
    CREATE INDEX IX_InventarioBodega_Activo ON InventarioBodega(Activo) WHERE Activo = 1;
    
    PRINT '   ✅ Tabla InventarioBodega creada con índices';
END
ELSE
    PRINT '   ⚠️  Tabla InventarioBodega ya existe';
GO

-- =====================================================
-- TABLA: Proveedores
-- Descripción: Almacena los proveedores de charolas
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Proveedores')
BEGIN
    PRINT '📋 Creando tabla: Proveedores...';
    CREATE TABLE Proveedores (
        ProveedorID INT IDENTITY(1,1) PRIMARY KEY,
        NombreProveedor VARCHAR(200) NOT NULL,
        Producto VARCHAR(200) NOT NULL,
        UsuarioCreacion VARCHAR(50) NULL,
        UsuarioModificacion VARCHAR(50) NULL,
        FechaRegistro DATETIME NOT NULL DEFAULT GETDATE(),
        FechaModificacion DATETIME NULL,
        Activo BIT NOT NULL DEFAULT 1
    );
    
    CREATE INDEX IX_Proveedores_Activo ON Proveedores(Activo) WHERE Activo = 1;
    
    PRINT '   ✅ Tabla Proveedores creada con índices';
END
ELSE
    PRINT '   ⚠️  Tabla Proveedores ya existe';
GO

-- =====================================================
-- TABLA: ControlCharolasProveedor
-- Descripción: Almacena los movimientos de charolas con proveedores
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ControlCharolasProveedor')
BEGIN
    PRINT '📋 Creando tabla: ControlCharolasProveedor...';
    CREATE TABLE ControlCharolasProveedor (
        ControlProveedorID INT IDENTITY(1,1) PRIMARY KEY,
        ProveedorID INT NOT NULL,
        FechaMovimiento DATETIME NOT NULL DEFAULT GETDATE(),
        SaldoControlAnterior INT NOT NULL DEFAULT 0,
        CharolasGrandesEntrantes INT NOT NULL DEFAULT 0,
        CharolasGrandesSalientes INT NOT NULL DEFAULT 0,
        SaldoControlAnteriorPequenas INT NOT NULL DEFAULT 0,
        CharolasPequenasEntrantes INT NOT NULL DEFAULT 0,
        CharolasPequenasSalientes INT NOT NULL DEFAULT 0,
        SaldoFinal AS (
            SaldoControlAnterior + CharolasGrandesEntrantes - CharolasGrandesSalientes +
            SaldoControlAnteriorPequenas + CharolasPequenasEntrantes - CharolasPequenasSalientes
        ) PERSISTED,
        UsuarioRegistro VARCHAR(50) NULL,
        FechaRegistro DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_ControlCharolasProveedor_Proveedores FOREIGN KEY (ProveedorID) REFERENCES Proveedores(ProveedorID)
    );
    
    CREATE INDEX IX_ControlCharolasProveedor_Proveedor ON ControlCharolasProveedor(ProveedorID);
    CREATE INDEX IX_ControlCharolasProveedor_Fecha ON ControlCharolasProveedor(FechaMovimiento DESC);
    
    PRINT '   ✅ Tabla ControlCharolasProveedor creada con índices';
END
ELSE
    PRINT '   ⚠️  Tabla ControlCharolasProveedor ya existe';
GO

PRINT '';
PRINT '╔════════════════════════════════════════════════════╗';
PRINT '║  CREACIÓN DE VISTAS                                ║';
PRINT '╚════════════════════════════════════════════════════╝';
PRINT '';

-- =====================================================
-- VISTA: vw_InventarioCharolas
-- Descripción: Vista consolidada del inventario por cliente
-- =====================================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_InventarioCharolas')
    DROP VIEW vw_InventarioCharolas;
GO

PRINT '📊 Creando vista: vw_InventarioCharolas...';
GO

CREATE VIEW vw_InventarioCharolas AS
SELECT 
    c.CodigoCliente,
    c.NombreCliente,
    c.NombreEstablecimiento,
    c.Vendedor,
    c.Municipio,
    -- Saldo control anterior (último saldo reportado)
    ISNULL((
        SELECT TOP 1 SaldoReportado 
        FROM ControlCharolas cc 
        WHERE cc.CodigoCliente = c.CodigoCliente 
        ORDER BY FechaMovimiento DESC
    ), 0) AS SaldoControlAnterior,
    -- Total de charolas descargadas
    ISNULL((
        SELECT SUM(CantidadDescargada) 
        FROM ControlCharolas cc 
        WHERE cc.CodigoCliente = c.CodigoCliente
    ), 0) AS CharolasDescargadas,
    -- Total de charolas recogidas
    ISNULL((
        SELECT SUM(CantidadRecogida) 
        FROM ControlCharolas cc 
        WHERE cc.CodigoCliente = c.CodigoCliente
    ), 0) AS CharolasRecogidas,
    -- Charolas actuales (último saldo reportado)
    ISNULL((
        SELECT TOP 1 SaldoReportado 
        FROM ControlCharolas cc 
        WHERE cc.CodigoCliente = c.CodigoCliente 
        ORDER BY FechaMovimiento DESC
    ), 0) AS CharolasActuales
FROM Clientes c;
GO

PRINT '   ✅ Vista vw_InventarioCharolas creada';
GO

-- =====================================================
-- VISTA: vw_EstadoActualBodega
-- Descripción: Vista del estado actual de la bodega
-- =====================================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_EstadoActualBodega')
    DROP VIEW vw_EstadoActualBodega;
GO

PRINT '📊 Creando vista: vw_EstadoActualBodega...';
GO

CREATE VIEW vw_EstadoActualBodega AS
SELECT TOP 1
    BodegaID,
    CharolasGrandesBodega,
    CharolasPequenasBodega,
    TotalCharolasBodega,
    Notas,
    UsuarioActualizacion,
    FechaActualizacion
FROM InventarioBodega
WHERE Activo = 1
ORDER BY FechaActualizacion DESC;
GO

PRINT '   ✅ Vista vw_EstadoActualBodega creada';
GO

-- =====================================================
-- VISTA: vw_ResumenProveedores
-- Descripción: Vista de resumen de proveedores con saldos
-- =====================================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_ResumenProveedores')
    DROP VIEW vw_ResumenProveedores;
GO

PRINT '📊 Creando vista: vw_ResumenProveedores...';
GO

CREATE VIEW vw_ResumenProveedores AS
SELECT 
    p.ProveedorID,
    p.NombreProveedor,
    p.Producto,
    -- Saldo final de charolas grandes
    ISNULL((
        SELECT TOP 1 
            SaldoControlAnterior + CharolasGrandesEntrantes - CharolasGrandesSalientes
        FROM ControlCharolasProveedor cp 
        WHERE cp.ProveedorID = p.ProveedorID 
        ORDER BY FechaMovimiento DESC
    ), 0) AS SaldoFinalGrandes,
    -- Saldo final de charolas pequeñas
    ISNULL((
        SELECT TOP 1 
            SaldoControlAnteriorPequenas + CharolasPequenasEntrantes - CharolasPequenasSalientes
        FROM ControlCharolasProveedor cp 
        WHERE cp.ProveedorID = p.ProveedorID 
        ORDER BY FechaMovimiento DESC
    ), 0) AS SaldoFinalPequenas,
    -- Último movimiento
    (
        SELECT TOP 1 FechaMovimiento
        FROM ControlCharolasProveedor cp
        WHERE cp.ProveedorID = p.ProveedorID
        ORDER BY FechaMovimiento DESC
    ) AS UltimoMovimiento
FROM Proveedores p
WHERE p.Activo = 1;
GO

PRINT '   ✅ Vista vw_ResumenProveedores creada';
GO

PRINT '';
PRINT '╔════════════════════════════════════════════════════╗';
PRINT '║  CREACIÓN DE PROCEDIMIENTOS ALMACENADOS           ║';
PRINT '╚════════════════════════════════════════════════════╝';
PRINT '';

-- =====================================================
-- PROCEDIMIENTO: sp_ActualizarInventarioBodega
-- Descripción: Actualiza el inventario de bodega
-- =====================================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_ActualizarInventarioBodega')
    DROP PROCEDURE sp_ActualizarInventarioBodega;
GO

PRINT '⚙️  Creando procedimiento: sp_ActualizarInventarioBodega...';
GO

CREATE PROCEDURE sp_ActualizarInventarioBodega
    @charolasGrandes INT,
    @charolasPequenas INT,
    @notas VARCHAR(MAX) = NULL,
    @usuario VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Desactivar el registro anterior de bodega
        UPDATE InventarioBodega
        SET Activo = 0
        WHERE Activo = 1;
        
        -- Insertar nuevo registro de bodega
        INSERT INTO InventarioBodega (
            CharolasGrandesBodega,
            CharolasPequenasBodega,
            Notas,
            UsuarioActualizacion,
            FechaActualizacion,
            Activo
        ) VALUES (
            @charolasGrandes,
            @charolasPequenas,
            @notas,
            @usuario,
            GETDATE(),
            1
        );
        
        -- Retornar el nuevo estado
        SELECT TOP 1
            BodegaID,
            CharolasGrandesBodega,
            CharolasPequenasBodega,
            TotalCharolasBodega,
            Notas,
            UsuarioActualizacion,
            FechaActualizacion
        FROM InventarioBodega
        WHERE Activo = 1
        ORDER BY FechaActualizacion DESC;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

PRINT '   ✅ Procedimiento sp_ActualizarInventarioBodega creado';
GO

PRINT '';
PRINT '╔════════════════════════════════════════════════════╗';
PRINT '║  INSERCIÓN DE DATOS INICIALES                      ║';
PRINT '╚════════════════════════════════════════════════════╝';
PRINT '';

-- =====================================================
-- DATOS INICIALES: Usuarios
-- =====================================================
IF NOT EXISTS (SELECT * FROM Usuarios WHERE Username = 'admin')
BEGIN
    PRINT '👤 Insertando usuarios iniciales...';
    
    INSERT INTO Usuarios (Username, Password, Rol, Activo) VALUES
    ('admin', 'admin123', 'Administrador', 1),
    ('yinethm', 'boltythomas', 'Administrador', 1),
    ('alexm', 'kym00', 'Administrador', 1),
    ('dayana', 'dayanita', 'Oficina', 1),
    ('santiago', '1234', 'Administrador', 1),
    ('karen', 'mona', 'Oficina', 1);
    
    PRINT '   ✅ Usuarios insertados: 6 registros';
END
ELSE
    PRINT '   ⚠️  Usuarios ya existen, omitiendo inserción';
GO

-- =====================================================
-- DATOS INICIALES: Entregadores de ejemplo
-- =====================================================
IF NOT EXISTS (SELECT * FROM Entregadores WHERE Codigo = 'ENT001')
BEGIN
    PRINT '🚚 Insertando entregadores de ejemplo...';
    
    INSERT INTO Entregadores (Codigo, Nombre, Apellido, Telefono, UsuarioCreacion, Activo) VALUES
    ('ENT001', 'JUAN', 'PÉREZ', '3001234567', 'Sistema', 1),
    ('ENT002', 'MARÍA', 'GONZÁLEZ', '3007654321', 'Sistema', 1),
    ('ENT003', 'CARLOS', 'RODRÍGUEZ', '3009876543', 'Sistema', 1);
    
    PRINT '   ✅ Entregadores insertados: 3 registros';
END
ELSE
    PRINT '   ⚠️  Entregadores ya existen, omitiendo inserción';
GO

-- =====================================================
-- DATOS INICIALES: Inventario de Bodega inicial
-- =====================================================
IF NOT EXISTS (SELECT * FROM InventarioBodega WHERE Activo = 1)
BEGIN
    PRINT '📦 Insertando inventario inicial de bodega...';
    
    INSERT INTO InventarioBodega (
        CharolasGrandesBodega,
        CharolasPequenasBodega,
        Notas,
        UsuarioActualizacion,
        Activo
    ) VALUES (
        0,
        0,
        'Inventario inicial - Base de datos creada',
        'Sistema',
        1
    );
    
    PRINT '   ✅ Inventario inicial de bodega insertado';
END
ELSE
    PRINT '   ⚠️  Inventario de bodega ya existe, omitiendo inserción';
GO

PRINT '';
PRINT '╔════════════════════════════════════════════════════╗';
PRINT '║  VERIFICACIÓN FINAL                                ║';
PRINT '╚════════════════════════════════════════════════════╝';
PRINT '';

-- Mostrar resumen de tablas creadas
PRINT '📊 RESUMEN DE TABLAS:';
PRINT '';

SELECT 
    t.name AS 'Tabla',
    p.rows AS 'Registros',
    CASE 
        WHEN t.name = 'Usuarios' THEN '👤 Usuarios del sistema'
        WHEN t.name = 'Clientes' THEN '👥 Clientes'
        WHEN t.name = 'ControlCharolas' THEN '📦 Movimientos de charolas'
        WHEN t.name = 'IniciosRuta' THEN '🚚 Rutas de entrega'
        WHEN t.name = 'Entregadores' THEN '🚛 Entregadores/Conductores'
        WHEN t.name = 'InventarioBodega' THEN '🏭 Inventario de bodega'
        WHEN t.name = 'Proveedores' THEN '🏢 Proveedores'
        WHEN t.name = 'ControlCharolasProveedor' THEN '📋 Control de proveedores'
        ELSE '📄 ' + t.name
    END AS 'Descripción'
FROM sys.tables t
INNER JOIN sys.partitions p ON t.object_id = p.object_id
WHERE p.index_id IN (0,1)
AND t.name NOT IN ('sysdiagrams')
ORDER BY t.name;

PRINT '';
PRINT '📊 VISTAS CREADAS:';
SELECT name AS 'Vista' FROM sys.views ORDER BY name;

PRINT '';
PRINT '⚙️  PROCEDIMIENTOS ALMACENADOS:';
SELECT name AS 'Procedimiento' FROM sys.procedures ORDER BY name;

PRINT '';
PRINT '╔════════════════════════════════════════════════════╗';
PRINT '║  ✅ BASE DE DATOS CREADA EXITOSAMENTE             ║';
PRINT '╚════════════════════════════════════════════════════╝';
PRINT '';
PRINT '🎯 ESTRUCTURA CREADA:';
PRINT '   ✅ 8 Tablas principales';
PRINT '   ✅ 3 Vistas';
PRINT '   ✅ 1 Procedimiento almacenado';
PRINT '   ✅ Índices optimizados';
PRINT '   ✅ Llaves foráneas y relaciones';
PRINT '   ✅ Campos calculados (PERSISTED)';
PRINT '   ✅ Datos iniciales (usuarios, entregadores, bodega)';
PRINT '';
PRINT '📝 CREDENCIALES DE ACCESO:';
PRINT '   Usuario: admin | Contraseña: admin123 (Administrador)';
PRINT '   Usuario: yinethm | Contraseña: boltythomas (Administrador)';
PRINT '   Usuario: alexm | Contraseña: kym00 (Administrador)';
PRINT '   Usuario: dayana | Contraseña: dayanita (Oficina)';
PRINT '   Usuario: santiago | Contraseña: 1234 (Administrador)';
PRINT '   Usuario: karen | Contraseña: mona (Oficina)';
PRINT '';
PRINT '🚀 SIGUIENTE PASO:';
PRINT '   1. Configurar el archivo .env con las credenciales de SQL Server';
PRINT '   2. Ejecutar: npm install';
PRINT '   3. Iniciar el servidor: npm start';
PRINT '';
PRINT '💡 NOTA: Esta base de datos es compatible con SQL Server 2019 y versiones superiores';
PRINT '';

-- =====================================================
-- despues de ejecutar este primer pedazo de arriba, toca acomodar la bd con la siguiente parte


-- =====================================================
-- SCRIPT DE ACTUALIZACIÓN - VERSIÓN CORREGIDA
-- Sistema de Control de Charolas
-- Compatible con SQL Server 2019+
-- =====================================================

USE ControlCharolas;
GO

PRINT '';
PRINT '========================================================';
PRINT '  ACTUALIZACIÓN DE BASE DE DATOS';
PRINT '========================================================';
PRINT '';

-- =====================================================
-- PASO 1: VERIFICAR Y AGREGAR CAMPO ACTIVO A CLIENTES
-- =====================================================

PRINT '1. Verificando campo Activo en tabla Clientes...';
GO

-- Verificar si existe
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Clientes') 
    AND name = 'Activo'
)
BEGIN
    PRINT '   Campo Activo NO existe, agregando...';
    
    -- Agregar el campo
    ALTER TABLE dbo.Clientes
    ADD Activo BIT NOT NULL CONSTRAINT DF_Clientes_Activo DEFAULT 1;
    
    PRINT '   ✓ Campo Activo agregado exitosamente';
END
ELSE
BEGIN
    PRINT '   ✓ Campo Activo ya existe';
END
GO

-- Asegurar que todos los clientes existentes están activos
UPDATE dbo.Clientes 
SET Activo = 1 
WHERE Activo IS NULL OR Activo = 0;
GO

PRINT '';
PRINT '2. Verificando campo Activo...';
SELECT 
    'Clientes' AS Tabla,
    'Activo' AS Campo,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Clientes' AND COLUMN_NAME = 'Activo';
GO

-- =====================================================
-- PASO 2: RECREAR VISTA vw_InventarioCharolas
-- =====================================================

PRINT '';
PRINT '3. Eliminando vista anterior (si existe)...';
GO

IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_InventarioCharolas')
BEGIN
    DROP VIEW dbo.vw_InventarioCharolas;
    PRINT '   ✓ Vista anterior eliminada';
END
ELSE
BEGIN
    PRINT '   ✓ No existe vista anterior';
END
GO

PRINT '';
PRINT '4. Creando vista vw_InventarioCharolas...';
GO

CREATE VIEW dbo.vw_InventarioCharolas AS
SELECT 
    c.CodigoCliente,
    c.NombreCliente,
    c.NombreEstablecimiento,
    c.Vendedor,
    c.Municipio,
    
    -- Saldo Anterior: Último SaldoReportado (Grandes + Pequeñas)
    ISNULL((
        SELECT TOP 1 
            (SaldoReportado + ISNULL(SaldoReportadoPequenas, 0))
        FROM ControlCharolas cc 
        WHERE cc.CodigoCliente = c.CodigoCliente 
        ORDER BY FechaMovimiento DESC
    ), 0) AS SaldoControlAnterior,
    
    -- Descargadas: SUMA de TODAS las descargas históricas (Grandes + Pequeñas)
    ISNULL((
        SELECT SUM(CantidadDescargada + ISNULL(CantidadDescargadaPequenas, 0))
        FROM ControlCharolas cc 
        WHERE cc.CodigoCliente = c.CodigoCliente
    ), 0) AS CharolasDescargadas,
    
    -- Recogidas: SUMA de TODAS las recogidas históricas (Grandes + Pequeñas)
    ISNULL((
        SELECT SUM(CantidadRecogida + ISNULL(CantidadRecogidaPequenas, 0))
        FROM ControlCharolas cc 
        WHERE cc.CodigoCliente = c.CodigoCliente
    ), 0) AS CharolasRecogidas,
    
    -- Charolas Grandes: Último SaldoReportado (solo grandes)
    ISNULL((
        SELECT TOP 1 SaldoReportado 
        FROM ControlCharolas cc 
        WHERE cc.CodigoCliente = c.CodigoCliente 
        ORDER BY FechaMovimiento DESC
    ), 0) AS CharolasGrandes,
    
    -- Charolas Pequeñas: Último SaldoReportadoPequenas
    ISNULL((
        SELECT TOP 1 ISNULL(SaldoReportadoPequenas, 0)
        FROM ControlCharolas cc 
        WHERE cc.CodigoCliente = c.CodigoCliente 
        ORDER BY FechaMovimiento DESC
    ), 0) AS CharolasPequenas,
    
    -- Saldo Actual: Charolas Grandes + Charolas Pequeñas
    ISNULL((
        SELECT TOP 1 
            (SaldoReportado + ISNULL(SaldoReportadoPequenas, 0))
        FROM ControlCharolas cc 
        WHERE cc.CodigoCliente = c.CodigoCliente 
        ORDER BY FechaMovimiento DESC
    ), 0) AS CharolasActuales

FROM dbo.Clientes c
WHERE c.Activo = 1;
GO

PRINT '   ✓ Vista vw_InventarioCharolas creada exitosamente';
GO

-- =====================================================
-- PASO 3: VERIFICACIÓN FINAL
-- =====================================================

PRINT '';
PRINT '========================================================';
PRINT '  VERIFICACIÓN FINAL';
PRINT '========================================================';
PRINT '';

-- Verificar que la vista existe
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_InventarioCharolas')
    PRINT '✓ Vista vw_InventarioCharolas existe';
ELSE
    PRINT '✗ ERROR: Vista vw_InventarioCharolas NO se creó';
GO

-- Verificar campo Activo
IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Clientes') 
    AND name = 'Activo'
)
    PRINT '✓ Campo Activo en Clientes existe';
ELSE
    PRINT '✗ ERROR: Campo Activo NO existe';
GO

-- Mostrar ejemplo de datos (si hay)
PRINT '';
PRINT 'EJEMPLO DE DATOS EN INVENTARIO (Top 5):';
PRINT '';

IF EXISTS (SELECT * FROM dbo.Clientes)
BEGIN
    SELECT TOP 5
        CodigoCliente AS 'Código',
        NombreCliente AS 'Cliente',
        SaldoControlAnterior AS 'Saldo Ant.',
        CharolasDescargadas AS 'Descarg.',
        CharolasRecogidas AS 'Recog.',
        CharolasGrandes AS 'Grandes',
        CharolasPequenas AS 'Pequeñas',
        CharolasActuales AS 'Saldo Act.'
    FROM dbo.vw_InventarioCharolas
    ORDER BY CodigoCliente;
END
ELSE
BEGIN
    PRINT 'No hay clientes registrados aún';
END
GO

PRINT '';
PRINT '========================================================';
PRINT '  ✓ ACTUALIZACIÓN COMPLETADA EXITOSAMENTE';
PRINT '========================================================';
PRINT '';
PRINT 'CAMBIOS APLICADOS:';
PRINT '  ✓ Campo Activo agregado a Clientes';
PRINT '  ✓ Vista vw_InventarioCharolas actualizada';
PRINT '';
PRINT 'LÓGICA IMPLEMENTADA:';
PRINT '  • Saldo Anterior = Último SaldoReportado (G+P)';
PRINT '  • Descargadas = SUMA de descargas históricas (G+P)';
PRINT '  • Recogidas = SUMA de recogidas históricas (G+P)';
PRINT '  • Grandes = Último SaldoReportado (solo G)';
PRINT '  • Pequeñas = Último SaldoReportadoPequenas';
PRINT '  • Saldo Actual = Grandes + Pequeñas';
PRINT '';
PRINT 'SIGUIENTE PASO:';
PRINT '  1. Reemplazar el archivo api.js';
PRINT '  2. Reiniciar el servidor Node.js';
PRINT '  3. Probar creando un cliente nuevo';
PRINT '';