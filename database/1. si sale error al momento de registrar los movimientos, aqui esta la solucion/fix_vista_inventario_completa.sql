-- =====================================================
-- CORRECCIÓN URGENTE: VISTA DE INVENTARIO COMPLETA
-- Incluye TODAS las columnas que el backend necesita
-- =====================================================

USE ControlCharolas;
GO

PRINT '========================================';
PRINT 'CORRIGIENDO VISTA DE INVENTARIO';
PRINT '========================================';
PRINT '';

-- Eliminar vista anterior
IF OBJECT_ID('vw_InventarioCharolas', 'V') IS NOT NULL
BEGIN
    DROP VIEW vw_InventarioCharolas;
    PRINT '✅ Vista anterior eliminada';
END
GO

-- Crear vista completa con TODAS las columnas
CREATE VIEW vw_InventarioCharolas
AS
SELECT 
    c.CodigoCliente,
    c.NombreCliente,
    c.NombreEstablecimiento,
    c.Vendedor,
    c.Municipio,
    
    -- ==========================================
    -- SALDO ANTERIOR
    -- ==========================================
    ISNULL((
        SELECT TOP 1 (CharolasGrandesSaldo + CharolasPequenasSaldo)
        FROM ControlCharolas cc 
        WHERE cc.CodigoCliente = c.CodigoCliente 
          AND cc.ControlID < (
              SELECT TOP 1 ControlID 
              FROM ControlCharolas 
              WHERE CodigoCliente = c.CodigoCliente 
              ORDER BY FechaMovimiento DESC, ControlID DESC
          )
        ORDER BY FechaMovimiento DESC, ControlID DESC
    ), 0) AS SaldoControlAnterior,
    
    -- ==========================================
    -- CHAROLAS DESCARGADAS (TOTAL) ← NECESARIA
    -- ==========================================
    ISNULL((
        SELECT SUM(
            CASE 
                WHEN CharolasGrandesDescargadas IS NOT NULL 
                THEN CharolasGrandesDescargadas + ISNULL(CharolasPequenasDescargadas, 0)
                ELSE CantidadDescargada
            END
        )
        FROM ControlCharolas cc
        WHERE cc.CodigoCliente = c.CodigoCliente
    ), 0) AS CharolasDescargadas,
    
    -- ==========================================
    -- CHAROLAS RECOGIDAS (TOTAL) ← NECESARIA
    -- ==========================================
    ISNULL((
        SELECT SUM(
            CASE 
                WHEN CharolasGrandesRecogidas IS NOT NULL 
                THEN CharolasGrandesRecogidas + ISNULL(CharolasPequenasRecogidas, 0)
                ELSE CantidadRecogida
            END
        )
        FROM ControlCharolas cc
        WHERE cc.CodigoCliente = c.CodigoCliente
    ), 0) AS CharolasRecogidas,
    
    -- ==========================================
    -- CHAROLAS GRANDES ACTUALES
    -- ==========================================
    ISNULL((
        SELECT TOP 1 CharolasGrandesSaldo
        FROM ControlCharolas cc 
        WHERE cc.CodigoCliente = c.CodigoCliente 
        ORDER BY FechaMovimiento DESC, ControlID DESC
    ), ISNULL(c.SaldoInicialGrandes, 0)) AS CharolasGrandes,
    
    -- ==========================================
    -- CHAROLAS PEQUEÑAS ACTUALES
    -- ==========================================
    ISNULL((
        SELECT TOP 1 CharolasPequenasSaldo
        FROM ControlCharolas cc 
        WHERE cc.CodigoCliente = c.CodigoCliente 
        ORDER BY FechaMovimiento DESC, ControlID DESC
    ), ISNULL(c.SaldoInicialPequenas, 0)) AS CharolasPequenas,
    
    -- ==========================================
    -- SALDO ACTUAL TOTAL
    -- ==========================================
    ISNULL((
        SELECT TOP 1 (CharolasGrandesSaldo + CharolasPequenasSaldo)
        FROM ControlCharolas cc 
        WHERE cc.CodigoCliente = c.CodigoCliente 
        ORDER BY FechaMovimiento DESC, ControlID DESC
    ), ISNULL(c.SaldoInicialGrandes, 0) + ISNULL(c.SaldoInicialPequenas, 0)) AS CharolasActuales,
    
    -- ==========================================
    -- TOTALES POR TIPO (para detalle)
    -- ==========================================
    ISNULL((
        SELECT SUM(CharolasGrandesDescargadas)
        FROM ControlCharolas cc
        WHERE cc.CodigoCliente = c.CodigoCliente
    ), 0) AS TotalDescargadasGrandes,
    
    ISNULL((
        SELECT SUM(CharolasPequenasDescargadas)
        FROM ControlCharolas cc
        WHERE cc.CodigoCliente = c.CodigoCliente
    ), 0) AS TotalDescargadasPequenas,
    
    ISNULL((
        SELECT SUM(CharolasGrandesRecogidas)
        FROM ControlCharolas cc
        WHERE cc.CodigoCliente = c.CodigoCliente
    ), 0) AS TotalRecogidasGrandes,
    
    ISNULL((
        SELECT SUM(CharolasPequenasRecogidas)
        FROM ControlCharolas cc
        WHERE cc.CodigoCliente = c.CodigoCliente
    ), 0) AS TotalRecogidasPequenas,
    
    -- Fecha del último movimiento
    (
        SELECT TOP 1 FechaMovimiento
        FROM ControlCharolas cc
        WHERE cc.CodigoCliente = c.CodigoCliente
        ORDER BY FechaMovimiento DESC, ControlID DESC
    ) AS UltimoMovimiento

FROM Clientes c
WHERE c.Activo = 1;
GO

PRINT '✅ Vista vw_InventarioCharolas creada con TODAS las columnas';
PRINT '';

-- =====================================================
-- VERIFICAR COLUMNAS DE LA VISTA
-- =====================================================

PRINT 'COLUMNAS DISPONIBLES EN LA VISTA:';
PRINT '----------------------------------------';

SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'vw_InventarioCharolas'
ORDER BY ORDINAL_POSITION;

PRINT '';

-- =====================================================
-- PROBAR LA VISTA
-- =====================================================

PRINT 'PROBANDO LA VISTA:';
PRINT '----------------------------------------';

SELECT 
    CodigoCliente,
    NombreCliente,
    SaldoControlAnterior AS 'Saldo Ant',
    CharolasDescargadas AS 'Descargadas',
    CharolasRecogidas AS 'Recogidas',
    CharolasGrandes AS 'Grandes',
    CharolasPequenas AS 'Pequeñas',
    CharolasActuales AS 'Total'
FROM vw_InventarioCharolas
ORDER BY CodigoCliente;

PRINT '';
PRINT '========================================';
PRINT '✅ CORRECCIÓN COMPLETADA';
PRINT '========================================';
PRINT '';
PRINT 'COLUMNAS INCLUIDAS:';
PRINT '  ✅ SaldoControlAnterior';
PRINT '  ✅ CharolasDescargadas (total)';
PRINT '  ✅ CharolasRecogidas (total)';
PRINT '  ✅ CharolasGrandes (actuales)';
PRINT '  ✅ CharolasPequenas (actuales)';
PRINT '  ✅ CharolasActuales (total)';
PRINT '';
PRINT 'SIGUIENTE PASO:';
PRINT '1. Reinicia servidor: Ctrl+C, npm start';
PRINT '2. Recarga página: F5';
PRINT '3. El error debe desaparecer';
PRINT '';

GO
