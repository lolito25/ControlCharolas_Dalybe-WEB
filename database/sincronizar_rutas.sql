
-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================

PRINT '3. Estado después de la actualización:';
PRINT '';

SELECT 
    InicioRutaID,
    CodigoRuta,
    NombreRuta,
    CharolasGrandesInicio AS 'Grandes Inicio',
    CharolasGrandesActuales AS 'Grandes Actuales ✓',
    CharolasPequenasInicio AS 'Pequeñas Inicio',
    CharolasPequenasActuales AS 'Pequeñas Actuales ✓',
    EstadoRuta
FROM IniciosRuta
WHERE EstadoRuta = 'Iniciada';

PRINT '';
PRINT '========================================';
PRINT '✅ SINCRONIZACIÓN COMPLETADA';
PRINT '========================================';
PRINT '';
PRINT '🎯 Siguiente paso:';
PRINT '   1. No es necesario reiniciar el servidor';
PRINT '   2. Recarga la página de Movimientos (F5)';
PRINT '   3. Intenta crear el movimiento de nuevo';
PRINT '';
PRINT '✅ Ahora debería permitir descargar charolas!';