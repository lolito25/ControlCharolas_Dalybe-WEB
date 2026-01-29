// routes/api.js
// Rutas de la API para el sistema

const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');
const { isAdmin, isAuthenticated } = require('../middleware/checkRole');

// ============================================
// RUTAS DE INVENTARIO
// ============================================

// Obtener resumen del inventario
router.get('/inventario/resumen', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                COUNT(*) as TotalClientes,
                SUM(CAST(CharolasActuales AS INT)) as TotalCharolas,
                COUNT(CASE WHEN CharolasActuales > 0 THEN 1 END) as ClientesConCharolas
            FROM vw_InventarioCharolas
        `);
        
        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Error al obtener resumen de inventario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener resumen de inventario'
        });
    }
});

// Obtener inventario completo
router.get('/inventario', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                CodigoCliente,
                NombreCliente,
                NombreEstablecimiento,
                Vendedor,
                Municipio,
                SaldoControlAnterior,
                CharolasDescargadas,
                CharolasRecogidas,
                CharolasGrandes,
                CharolasPequenas,
                CharolasActuales
            FROM vw_InventarioCharolas
            ORDER BY NombreCliente
        `);
        
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error al obtener inventario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener inventario'
        });
    }
});

// Crear nuevo cliente
router.post('/clientes', async (req, res) => {
    try {
        const {
            codigoCliente,
            nombreCliente,
            nombreEstablecimiento,
            vendedor,
            municipio,
            saldoInicialG,
            saldoInicialP
        } = req.body;

        const usuario = req.session.user.username;
        const pool = await getConnection();

        console.log('📥 Creando nuevo cliente:', req.body);

        // Iniciar transacción
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // 1. Verificar si el código de cliente ya existe
            const existeResult = await transaction.request()
                .input('codigo', codigoCliente)
                .query('SELECT CodigoCliente FROM Clientes WHERE CodigoCliente = @codigo');

            if (existeResult.recordset.length > 0) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'El código de cliente ya existe'
                });
            }

            // 2. Insertar cliente
            await transaction.request()
                .input('codigo', codigoCliente)
                .input('nombre', nombreCliente)
                .input('establecimiento', nombreEstablecimiento)
                .input('vendedor', vendedor)
                .input('municipio', municipio)
                .input('usuario', usuario)
                .query(`
                    INSERT INTO Clientes (
                        CodigoCliente,
                        NombreCliente,
                        NombreEstablecimiento,
                        Vendedor,
                        Municipio,
                        UsuarioCreacion
                    ) VALUES (
                        @codigo,
                        @nombre,
                        @establecimiento,
                        @vendedor,
                        @municipio,
                        @usuario
                    )
                `);

            console.log('✅ Cliente insertado');

            // 3. Si tiene saldo inicial, crear registro en ControlCharolas
            if (saldoInicialG > 0 || saldoInicialP > 0) {
                await transaction.request()
                    .input('codigo', codigoCliente)
                    .input('saldoG', saldoInicialG)
                    .input('saldoP', saldoInicialP)
                    .input('usuario', usuario)
                    .query(`
                        INSERT INTO ControlCharolas (
                            CodigoCliente,
                            FechaMovimiento,
                            SaldoAnterior,
                            CantidadDescargada,
                            CantidadRecogida,
                            SaldoReportado,
                            SaldoAnteriorPequenas,
                            CantidadDescargadaPequenas,
                            CantidadRecogidaPequenas,
                            SaldoReportadoPequenas,
                            Verificado,
                            UsuarioRegistro
                        ) VALUES (
                            @codigo,
                            DATEADD(HOUR, -5, GETUTCDATE()),
                            0,
                            0,
                            0,
                            @saldoG,
                            0,
                            0,
                            0,
                            @saldoP,
                            1,
                            @usuario
                        )
                    `);

                console.log('✅ Saldo inicial registrado');
            }

            // Commit de la transacción
            await transaction.commit();
            console.log('✅ Cliente creado exitosamente');

            res.json({
                success: true,
                message: 'Cliente creado exitosamente',
                data: {
                    codigoCliente,
                    nombreCliente,
                    saldoInicialG,
                    saldoInicialP
                }
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('❌ Error al crear cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear cliente: ' + error.message
        });
    }
});

// Generar Excel del inventario
router.post('/inventario/excel', async (req, res) => {
    try {
        const { data, totales } = req.body;

        console.log('📊 Generando Excel del inventario...');
        console.log('Registros:', data.length);
        console.log('Totales:', totales);

        // Importar librería ExcelJS
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Inventario de Charolas');

        // Configurar propiedades del documento
        workbook.creator = 'Sistema de Control de Charolas';
        workbook.created = new Date();
        workbook.modified = new Date();

        // ESTILOS
        const headerStyle = {
            font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } },
            alignment: { vertical: 'middle', horizontal: 'center' },
            border: {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
            }
        };

        const titleStyle = {
            font: { bold: true, size: 18, color: { argb: 'FF1E3A8A' } },
            alignment: { vertical: 'middle', horizontal: 'center' }
        };

        const subtitleStyle = {
            font: { size: 12, color: { argb: 'FF6B7280' } },
            alignment: { vertical: 'middle', horizontal: 'center' }
        };

        const totalStyle = {
            font: { bold: true, size: 11 },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } },
            alignment: { vertical: 'middle', horizontal: 'right' }
        };

        // Título
        worksheet.mergeCells('A1:I1');
        worksheet.getCell('A1').value = '📊 INVENTARIO DE CHAROLAS POR CLIENTE';
        worksheet.getCell('A1').style = titleStyle;
        worksheet.getRow(1).height = 30;

        // Fecha de generación
        worksheet.mergeCells('A2:I2');
        const fecha = new Date().toLocaleString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        worksheet.getCell('A2').value = `Generado: ${fecha}`;
        worksheet.getCell('A2').style = subtitleStyle;
        worksheet.getRow(2).height = 20;

        // Espacio
        worksheet.getRow(3).height = 10;

        // Encabezados
        worksheet.getRow(4).values = [
            'Código',
            'Cliente',
            'Establecimiento',
            'Vendedor',
            'Municipio',
            'Saldo Anterior',
            'Descargadas',
            'Recogidas',
            'Saldo Actual'
        ];

        worksheet.getRow(4).eachCell((cell) => {
            cell.style = headerStyle;
        });
        worksheet.getRow(4).height = 25;

        // Anchos de columnas
        worksheet.columns = [
            { width: 12 },  // Código
            { width: 25 },  // Cliente
            { width: 25 },  // Establecimiento
            { width: 20 },  // Vendedor
            { width: 18 },  // Municipio
            { width: 14 },  // Saldo Anterior
            { width: 12 },  // Descargadas
            { width: 12 },  // Recogidas
            { width: 14 }   // Saldo Actual
        ];

        // Datos
        let rowIndex = 5;
        data.forEach((item, index) => {
            const row = worksheet.getRow(rowIndex);
            row.values = [
                item.CodigoCliente,
                item.NombreCliente,
                item.NombreEstablecimiento,
                item.Vendedor,
                item.Municipio,
                item.SaldoControlAnterior || 0,
                item.CharolasDescargadas || 0,
                item.CharolasRecogidas || 0,
                item.CharolasActuales || 0
            ];

            // Estilo alternado para las filas
            row.eachCell((cell, colNumber) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
                };

                if (index % 2 === 0) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF9FAFB' }
                    };
                }

                // Alineación
                if (colNumber >= 6) {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                } else {
                    cell.alignment = { vertical: 'middle', horizontal: 'left' };
                }

                // Números en negrita para saldos
                if (colNumber === 9) {
                    cell.font = { bold: true };
                }
            });

            row.height = 20;
            rowIndex++;
        });

        // Fila de totales
        rowIndex += 1;
        const totalRow = worksheet.getRow(rowIndex);
        totalRow.values = [
            '',
            '',
            '',
            '',
            'TOTALES:',
            totales.totalSaldoAnterior,
            totales.totalDescargadas,
            totales.totalRecogidas,
            totales.totalActuales
        ];

        totalRow.eachCell((cell, colNumber) => {
            cell.style = totalStyle;
            if (colNumber >= 6) {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.font = { bold: true, size: 12 };
            }
            cell.border = {
                top: { style: 'medium', color: { argb: 'FF000000' } },
                bottom: { style: 'medium', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
            };
        });
        totalRow.height = 25;

        // Resumen
        rowIndex += 2;
        worksheet.mergeCells(`A${rowIndex}:I${rowIndex}`);
        worksheet.getCell(`A${rowIndex}`).value = `📋 Total de Clientes: ${totales.totalClientes}`;
        worksheet.getCell(`A${rowIndex}`).style = {
            font: { bold: true, size: 11 },
            alignment: { vertical: 'middle', horizontal: 'center' },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }
        };

        // Generar el archivo
        const buffer = await workbook.xlsx.writeBuffer();

        // Enviar el archivo
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Inventario_Charolas.xlsx');
        res.send(buffer);

        console.log('✅ Excel generado exitosamente');

    } catch (error) {
        console.error('❌ Error al generar Excel:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar Excel: ' + error.message
        });
    }
});

// ============================================
// RUTAS DE MOVIMIENTOS
// ============================================

// Obtener movimientos recientes
router.get('/movimientos', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT TOP 100
                cc.ControlID,
                cc.CodigoCliente,
                c.NombreCliente,
                c.NombreEstablecimiento,
                cc.FechaMovimiento,
                cc.CantidadDescargada,
                cc.CantidadRecogida,
                cc.SaldoReportado,
                cc.SaldoAnterior,
                ISNULL(cc.CantidadDescargadaPequenas, 0) AS CantidadDescargadaPequenas,
                ISNULL(cc.CantidadRecogidaPequenas, 0) AS CantidadRecogidaPequenas,
                ISNULL(cc.SaldoReportadoPequenas, 0) AS SaldoReportadoPequenas,
                ISNULL(cc.SaldoAnteriorPequenas, 0) AS SaldoAnteriorPequenas,
                cc.DiferenciaCharolas,
                cc.Verificado,
                cc.UsuarioRegistro,
                cc.RutaID,
                ISNULL(ir.EntregadorID, '') AS EntregadorNombre
            FROM ControlCharolas cc
            INNER JOIN Clientes c ON cc.CodigoCliente = c.CodigoCliente
            LEFT JOIN IniciosRuta ir ON cc.RutaID = ir.InicioRutaID
            ORDER BY cc.FechaMovimiento DESC
        `);
        
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error al obtener movimientos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener movimientos'
        });
    }
});

// Crear nuevo movimiento
router.post('/movimientos', async (req, res) => {
    try {
        const {
            rutaID,
            codigoCliente,
            saldoAnteriorG,
            descargadasG,
            recogidasG,
            saldoActualG,
            saldoAnteriorP,
            descargadasP,
            recogidasP,
            saldoActualP,
            verificado
        } = req.body;

        const usuario = req.session.user.username;
        const pool = await getConnection();

        console.log('📥 Datos recibidos para crear movimiento:', req.body);

        // Iniciar transacción
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // 1. Obtener información de la ruta
            console.log('🔍 Obteniendo información de ruta ID:', rutaID);
            const rutaResult = await transaction.request()
                .input('rutaID', rutaID)
                .query(`
                    SELECT 
                        InicioRutaID,
                        CodigoRuta,
                        CharolasGrandesInicio,
                        CharolasPequenasInicio,
                        ISNULL(CharolasGrandesActuales, CharolasGrandesInicio) AS CharolasGrandesActuales,
                        ISNULL(CharolasPequenasActuales, CharolasPequenasInicio) AS CharolasPequenasActuales,
                        EstadoRuta
                    FROM IniciosRuta
                    WHERE InicioRutaID = @rutaID
                `);

            if (rutaResult.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Ruta no encontrada'
                });
            }

            const ruta = rutaResult.recordset[0];
            console.log('✅ Ruta encontrada:', ruta);

            // 2. Verificar que la ruta esté iniciada
            if (ruta.EstadoRuta !== 'Iniciada') {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'La ruta no está en estado "Iniciada"'
                });
            }

            // 3. Validar que no descargue más de lo que tiene
            if (descargadasG > ruta.CharolasGrandesActuales) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: `No puede descargar ${descargadasG} charolas grandes. El entregador solo tiene ${ruta.CharolasGrandesActuales}`
                });
            }

            if (descargadasP > ruta.CharolasPequenasActuales) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: `No puede descargar ${descargadasP} charolas pequeñas. El entregador solo tiene ${ruta.CharolasPequenasActuales}`
                });
            }

            // 4. Insertar movimiento en ControlCharolas
            console.log('💾 Insertando movimiento...');
            await transaction.request()
                .input('codigoCliente', codigoCliente)
                .input('saldoAnteriorG', saldoAnteriorG)
                .input('descargadasG', descargadasG)
                .input('recogidasG', recogidasG)
                .input('saldoActualG', saldoActualG)
                .input('saldoAnteriorP', saldoAnteriorP)
                .input('descargadasP', descargadasP)
                .input('recogidasP', recogidasP)
                .input('saldoActualP', saldoActualP)
                .input('verificado', verificado ? 1 : 0)
                .input('usuario', usuario)
                .input('rutaID', rutaID)
                .query(`
                    INSERT INTO ControlCharolas (
                        CodigoCliente,
                        FechaMovimiento,
                        SaldoAnterior,
                        CantidadDescargada,
                        CantidadRecogida,
                        SaldoReportado,
                        SaldoAnteriorPequenas,
                        CantidadDescargadaPequenas,
                        CantidadRecogidaPequenas,
                        SaldoReportadoPequenas,
                        Verificado,
                        UsuarioRegistro,
                        RutaID
                    ) VALUES (
                        @codigoCliente,
                        DATEADD(HOUR, -5, GETUTCDATE()),
                        @saldoAnteriorG,
                        @descargadasG,
                        @recogidasG,
                        @saldoActualG,
                        @saldoAnteriorP,
                        @descargadasP,
                        @recogidasP,
                        @saldoActualP,
                        @verificado,
                        @usuario,
                        @rutaID
                    )
                `);

            console.log('✅ Movimiento insertado');

            // 5. Actualizar charolas actuales de la ruta
            const nuevasGrandes = ruta.CharolasGrandesActuales - descargadasG + recogidasG;
            const nuevasPequenas = ruta.CharolasPequenasActuales - descargadasP + recogidasP;

            console.log('💾 Actualizando ruta...');
            console.log(`  Grandes: ${ruta.CharolasGrandesActuales} - ${descargadasG} + ${recogidasG} = ${nuevasGrandes}`);
            console.log(`  Pequeñas: ${ruta.CharolasPequenasActuales} - ${descargadasP} + ${recogidasP} = ${nuevasPequenas}`);

            await transaction.request()
                .input('rutaID', rutaID)
                .input('grandesActuales', nuevasGrandes)
                .input('pequenasActuales', nuevasPequenas)
                .query(`
                    UPDATE IniciosRuta
                    SET CharolasGrandesActuales = @grandesActuales,
                        CharolasPequenasActuales = @pequenasActuales
                    WHERE InicioRutaID = @rutaID
                `);

            console.log('✅ Ruta actualizada');

            // Commit de la transacción
            await transaction.commit();
            console.log('✅ Transacción completada exitosamente');

            res.json({
                success: true,
                message: `Movimiento creado exitosamente. Ruta ahora tiene ${nuevasGrandes}G y ${nuevasPequenas}P`,
                data: {
                    charolasRutaGrandes: nuevasGrandes,
                    charolasRutaPequenas: nuevasPequenas,
                    saldoClienteGrandes: saldoActualG,
                    saldoClientePequenas: saldoActualP
                }
            });

        } catch (error) {
            console.error('❌ Error dentro de la transacción:', error);
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('❌ Error al crear movimiento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear movimiento: ' + error.message
        });
    }
});

// Buscar clientes por nombre o código
router.get('/clientes/buscar', async (req, res) => {
    try {
        const query = req.query.q || '';
        const pool = await getConnection();

        const result = await pool.request()
            .input('query', `%${query}%`)
            .query(`
                SELECT TOP 10
                    CodigoCliente,
                    NombreCliente,
                    NombreEstablecimiento,
                    Vendedor,
                    Municipio
                FROM Clientes
                WHERE Activo = 1
                    AND (
                        NombreCliente LIKE @query
                        OR CodigoCliente LIKE @query
                        OR NombreEstablecimiento LIKE @query
                    )
                ORDER BY NombreCliente
            `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error al buscar clientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al buscar clientes'
        });
    }
});

// Obtener saldo anterior de un cliente
router.get('/clientes/:codigo/saldo-anterior', async (req, res) => {
    try {
        const { codigo } = req.params;
        const pool = await getConnection();

        const result = await pool.request()
            .input('codigo', codigo)
            .query(`
                SELECT TOP 1
                    SaldoReportado AS saldoGrandes,
                    ISNULL(SaldoReportadoPequenas, 0) AS saldoPequenas
                FROM ControlCharolas
                WHERE CodigoCliente = @codigo
                ORDER BY FechaMovimiento DESC
            `);

        if (result.recordset.length > 0) {
            res.json({
                success: true,
                data: result.recordset[0]
            });
        } else {
            res.json({
                success: true,
                data: { saldoGrandes: 0, saldoPequenas: 0 }
            });
        }
    } catch (error) {
        console.error('Error al obtener saldo anterior:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener saldo anterior'
        });
    }
});

// Obtener historial completo de un cliente
router.get('/clientes/:codigo/historial', async (req, res) => {
    try {
        const { codigo } = req.params;
        const pool = await getConnection();

        // Obtener información del cliente
        const clienteResult = await pool.request()
            .input('codigo', codigo)
            .query(`
                SELECT 
                    CodigoCliente,
                    NombreCliente,
                    NombreEstablecimiento,
                    Vendedor,
                    Municipio
                FROM Clientes
                WHERE CodigoCliente = @codigo
            `);

        if (clienteResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        // Obtener historial de movimientos
        const movimientosResult = await pool.request()
            .input('codigo', codigo)
            .query(`
                SELECT 
                    ControlID,
                    FechaMovimiento,
                    CantidadDescargada,
                    CantidadRecogida,
                    SaldoReportado,
                    SaldoAnterior,
                    ISNULL(CantidadDescargadaPequenas, 0) AS CantidadDescargadaPequenas,
                    ISNULL(CantidadRecogidaPequenas, 0) AS CantidadRecogidaPequenas,
                    ISNULL(SaldoReportadoPequenas, 0) AS SaldoReportadoPequenas,
                    ISNULL(SaldoAnteriorPequenas, 0) AS SaldoAnteriorPequenas,
                    DiferenciaCharolas,
                    Verificado,
                    UsuarioRegistro
                FROM ControlCharolas
                WHERE CodigoCliente = @codigo
                ORDER BY FechaMovimiento DESC
            `);

        // Calcular resumen
        const totalDescargadasG = movimientosResult.recordset.reduce((sum, m) => sum + (m.CantidadDescargada || 0), 0);
        const totalRecogidasG = movimientosResult.recordset.reduce((sum, m) => sum + (m.CantidadRecogida || 0), 0);
        const totalDescargadasP = movimientosResult.recordset.reduce((sum, m) => sum + (m.CantidadDescargadaPequenas || 0), 0);
        const totalRecogidasP = movimientosResult.recordset.reduce((sum, m) => sum + (m.CantidadRecogidaPequenas || 0), 0);

        const saldoActualG = movimientosResult.recordset.length > 0 ? movimientosResult.recordset[0].SaldoReportado : 0;
        const saldoActualP = movimientosResult.recordset.length > 0 ? movimientosResult.recordset[0].SaldoReportadoPequenas : 0;

        res.json({
            success: true,
            data: {
                cliente: clienteResult.recordset[0],
                movimientos: movimientosResult.recordset,
                resumen: {
                    totalDescargadasG,
                    totalRecogidasG,
                    totalDescargadasP,
                    totalRecogidasP,
                    saldoActualG,
                    saldoActualP
                }
            }
        });
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial'
        });
    }
});

// ============================================
// RUTAS DE BODEGA
// ============================================

// Obtener estado actual de bodega
router.get('/bodega', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                BodegaID,
                CharolasGrandesBodega,
                CharolasPequenasBodega,
                TotalCharolasBodega,
                Notas,
                UsuarioActualizacion,
                FechaActualizacion
            FROM vw_EstadoActualBodega
        `);
        
        res.json({
            success: true,
            data: result.recordset[0] || {
                CharolasGrandesBodega: 0,
                CharolasPequenasBodega: 0,
                TotalCharolasBodega: 0
            }
        });
    } catch (error) {
        console.error('Error al obtener estado de bodega:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estado de bodega'
        });
    }
});

// Actualizar inventario de bodega
// Actualizar inventario de bodega (solo administradores)
router.post('/bodega/actualizar', isAdmin, async (req, res) => {
    try {
        const { charolasGrandes, charolasPequenas, notas } = req.body;
        const usuario = req.session.user.username;

        const pool = await getConnection();
        const result = await pool.request()
            .input('charolasGrandes', charolasGrandes)
            .input('charolasPequenas', charolasPequenas)
            .input('notas', notas || null)
            .input('usuario', usuario)
            .execute('sp_ActualizarInventarioBodega');
        
        res.json({
            success: true,
            message: 'Inventario de bodega actualizado correctamente',
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Error al actualizar bodega:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar inventario de bodega'
        });
    }
});

// ============================================
// RUTAS DE PROVEEDORES
// ============================================

// Obtener lista de proveedores
router.get('/proveedores', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                ProveedorID,
                NombreProveedor,
                Producto,
                SaldoFinalGrandes,
                SaldoFinalPequenas,
                UltimoMovimiento
            FROM vw_ResumenProveedores
            ORDER BY NombreProveedor
        `);
        
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener proveedores'
        });
    }
});

// Obtener movimientos de un proveedor
router.get('/proveedores/:id/movimientos', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();
        const result = await pool.request()
            .input('proveedorId', id)
            .query(`
                SELECT 
                    cp.ControlProveedorID,
                    cp.FechaMovimiento,
                    cp.SaldoControlAnterior,
                    cp.CharolasGrandesEntrantes,
                    cp.CharolasGrandesSalientes,
                    cp.SaldoControlAnteriorPequenas,
                    cp.CharolasPequenasEntrantes,
                    cp.CharolasPequenasSalientes,
                    cp.SaldoFinal,
                    cp.UsuarioRegistro
                FROM ControlCharolasProveedor cp
                WHERE cp.ProveedorID = @proveedorId
                ORDER BY cp.FechaMovimiento DESC
            `);
        
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error al obtener movimientos del proveedor:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener movimientos del proveedor'
        });
    }
});

// ============================================
// RUTA DE ESTADÍSTICAS GENERALES
// ============================================

router.get('/estadisticas', async (req, res) => {
    try {
        const pool = await getConnection();
        
        // Obtener múltiples estadísticas
        const inventario = await pool.request().query(`
            SELECT COUNT(*) as total FROM vw_InventarioCharolas
        `);
        
        const movimientos = await pool.request().query(`
            SELECT COUNT(*) as total FROM ControlCharolas
            WHERE CAST(FechaMovimiento AS DATE) = CAST(GETDATE() AS DATE)
        `);
        
        const proveedores = await pool.request().query(`
            SELECT COUNT(*) as total FROM Proveedores WHERE Activo = 1
        `);
        
        const bodega = await pool.request().query(`
            SELECT TotalCharolasBodega as total FROM vw_EstadoActualBodega
        `);
        
        res.json({
            success: true,
            data: {
                totalClientes: inventario.recordset[0].total,
                movimientosHoy: movimientos.recordset[0].total,
                totalProveedores: proveedores.recordset[0].total,
                charolasBodega: bodega.recordset[0]?.total || 0
            }
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas'
        });
    }
});

// ============================================
// RUTAS DE GESTIÓN DE RUTAS DE ENTREGA
// ============================================

// Obtener lista de rutas
router.get('/rutas', async (req, res) => {
    try {
        const { estado, fecha } = req.query;
        const pool = await getConnection();
        
        let query = `
            SELECT 
                ir.InicioRutaID,
                ir.CodigoRuta,
                ir.NombreRuta,
                ir.EntregadorID,
                ir.EntregadorID AS EntregadorNombre,
                ir.FechaInicio,
                ir.CharolasGrandesInicio,
                ir.CharolasPequenasInicio,
                ISNULL(ir.CharolasGrandesActuales, ir.CharolasGrandesInicio) AS CharolasGrandesActuales,
                ISNULL(ir.CharolasPequenasActuales, ir.CharolasPequenasInicio) AS CharolasPequenasActuales,
                ir.Observaciones,
                ir.EstadoRuta,
                ir.UsuarioRegistro,
                ir.FechaRegistro,
                ir.FechaFinalizacion
            FROM IniciosRuta ir
            WHERE 1=1
        `;
        
        // Agregar filtros si existen
        if (estado) {
            query += ` AND ir.EstadoRuta = '${estado}'`;
        }
        
        if (fecha) {
            query += ` AND CAST(ir.FechaInicio AS DATE) = '${fecha}'`;
        }
        
        query += ` ORDER BY ir.FechaInicio DESC`;
        
        const result = await pool.request().query(query);
        
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error al obtener rutas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener rutas'
        });
    }
});

// Obtener detalle de una ruta
router.get('/rutas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('rutaId', id)
            .query(`
                SELECT 
                    ir.*,
                    CONCAT(e.Nombre, ' ', ISNULL(e.Apellido, '')) as EntregadorNombre
                FROM IniciosRuta ir
                LEFT JOIN Entregadores e ON ir.EntregadorID = e.Codigo
                WHERE ir.InicioRutaID = @rutaId
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ruta no encontrada'
            });
        }
        
        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Error al obtener detalle de ruta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener detalle de ruta'
        });
    }
});

// Iniciar nueva ruta con validación de bodega
router.post('/rutas', async (req, res) => {
    try {
        const {
            codigoRuta,
            nombreRuta,
            entregadorID,
            fechaInicio,
            charolasGrandesInicio,
            charolasPequenasInicio,
            observaciones
        } = req.body;
        
        console.log('📥 Datos recibidos para iniciar ruta:', {
            codigoRuta,
            nombreRuta,
            entregadorID,
            entregadorType: typeof entregadorID,
            fechaInicio,
            charolasGrandesInicio,
            charolasPequenasInicio
        });
        
        const usuario = req.session.user.username;
        const pool = await getConnection();
        
        // Iniciar transacción
        const transaction = pool.transaction();
        await transaction.begin();
        console.log('✅ Transacción iniciada');

        try {
            // 1. Verificar si el código de ruta ya existe
            console.log('🔍 Verificando código de ruta...');
            const existente = await transaction.request()
                .input('codigo', codigoRuta)
                .query('SELECT InicioRutaID FROM IniciosRuta WHERE CodigoRuta = @codigo');
            
            if (existente.recordset.length > 0) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'El código de ruta ya existe'
                });
            }
            console.log('✅ Código de ruta disponible');

            // 2. Obtener bodega actual
            console.log('🔍 Obteniendo bodega actual...');
            const bodegaResult = await transaction.request().query(`
                SELECT TOP 1 
                    CharolasGrandesBodega,
                    CharolasPequenasBodega
                FROM InventarioBodega
                WHERE Activo = 1
                ORDER BY FechaActualizacion DESC
            `);

            let bodegaGrandes = 0;
            let bodegaPequenas = 0;

            if (bodegaResult.recordset.length > 0) {
                bodegaGrandes = bodegaResult.recordset[0].CharolasGrandesBodega || 0;
                bodegaPequenas = bodegaResult.recordset[0].CharolasPequenasBodega || 0;
            }
            console.log('✅ Bodega actual:', { bodegaGrandes, bodegaPequenas });

            // 3. Validar que no se exceda bodega disponible
            console.log('🔍 Validando cantidades...');
            if (charolasGrandesInicio > bodegaGrandes) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: `No hay suficientes charolas grandes en bodega. Disponibles: ${bodegaGrandes}, Intentas sacar: ${charolasGrandesInicio}`
                });
            }

            if (charolasPequenasInicio > bodegaPequenas) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: `No hay suficientes charolas pequeñas en bodega. Disponibles: ${bodegaPequenas}, Intentas sacar: ${charolasPequenasInicio}`
                });
            }
            console.log('✅ Validación de cantidades OK');

            // 4. Obtener información del entregador
            console.log('🔍 Obteniendo información del entregador ID:', entregadorID);
            const entregadorInfo = await transaction.request()
                .input('entregadorID', parseInt(entregadorID))
                .query(`
                    SELECT 
                        EntregadorID,
                        CONCAT(Nombre, ' ', Apellido) AS NombreCompleto
                    FROM Entregadores 
                    WHERE EntregadorID = @entregadorID AND Activo = 1
                `);
            
            if (entregadorInfo.recordset.length === 0) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: `El entregador con ID ${entregadorID} no existe o está inactivo`
                });
            }
            
            const nombreEntregador = entregadorInfo.recordset[0].NombreCompleto;
            console.log('✅ Entregador encontrado:', nombreEntregador);

            // 5. Insertar nueva ruta
            console.log('💾 Insertando ruta...');
            
            // Convertir fecha a formato SQL Server
            let fechaSQL = null;
            if (fechaInicio) {
                // Convertir de '2025-12-16T18:28' a '2025-12-16 18:28:00'
                const [fecha, hora] = fechaInicio.split('T');
                fechaSQL = `${fecha} ${hora}:00`;
            }
            
            const resultRuta = await transaction.request()
                .input('codigoRuta', codigoRuta)
                .input('nombreRuta', nombreRuta)
                .input('nombreEntregador', nombreEntregador)
                .input('fechaInicio', fechaSQL)
                .input('charolasGrandesInicio', parseInt(charolasGrandesInicio))
                .input('charolasPequenasInicio', parseInt(charolasPequenasInicio))
                .input('observaciones', observaciones || null)
                .input('usuario', usuario)
                .query(`
                    INSERT INTO IniciosRuta (
                        CodigoRuta,
                        NombreRuta,
                        EntregadorID,
                        FechaInicio,
                        CharolasGrandesInicio,
                        CharolasPequenasInicio,
                        Observaciones,
                        UsuarioRegistro,
                        EstadoRuta
                    ) VALUES (
                        @codigoRuta,
                        @nombreRuta,
                        @nombreEntregador,
                        ISNULL(CONVERT(DATETIME, @fechaInicio, 120), DATEADD(HOUR, -5, GETUTCDATE())),
                        @charolasGrandesInicio,
                        @charolasPequenasInicio,
                        @observaciones,
                        @usuario,
                        'Iniciada'
                    );
                    SELECT SCOPE_IDENTITY() as ID;
                `);
            console.log('✅ Ruta insertada, ID:', resultRuta.recordset[0].ID);

            // 6. Actualizar bodega (RESTAR charolas que salen)
            const nuevaBodegaGrandes = bodegaGrandes - charolasGrandesInicio;
            const nuevaBodegaPequenas = bodegaPequenas - charolasPequenasInicio;

            console.log('💾 Actualizando bodega...');
            // Desactivar bodega anterior
            await transaction.request().query(`
                UPDATE InventarioBodega 
                SET Activo = 0 
                WHERE Activo = 1
            `);

            // Insertar nueva bodega
            await transaction.request()
                .input('grandesBodega', nuevaBodegaGrandes)
                .input('pequenasBodega', nuevaBodegaPequenas)
                .input('usuario', usuario)
                .input('notas', `Actualización automática: Inicio de ruta ${codigoRuta}`)
                .query(`
                    INSERT INTO InventarioBodega (
                        CharolasGrandesBodega,
                        CharolasPequenasBodega,
                        Notas,
                        UsuarioActualizacion,
                        FechaActualizacion,
                        Activo
                    ) VALUES (
                        @grandesBodega,
                        @pequenasBodega,
                        @notas,
                        @usuario,
                        DATEADD(HOUR, -5, GETUTCDATE()),
                        1
                    )
                `);
            console.log('✅ Bodega actualizada');

            // Commit de la transacción
            await transaction.commit();
            console.log('✅ Transacción completada exitosamente');

            res.json({
                success: true,
                message: `Ruta iniciada exitosamente. Bodega actualizada: ${nuevaBodegaGrandes} grandes, ${nuevaBodegaPequenas} pequeñas`,
                data: { 
                    id: resultRuta.recordset[0].ID,
                    bodegaGrandes: nuevaBodegaGrandes,
                    bodegaPequenas: nuevaBodegaPequenas
                }
            });

        } catch (error) {
            console.error('❌ Error dentro de la transacción:', {
                message: error.message,
                code: error.code,
                number: error.number,
                state: error.state,
                class: error.class,
                serverName: error.serverName,
                procName: error.procName,
                lineNumber: error.lineNumber
            });
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('❌ Error al iniciar ruta:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Error al iniciar ruta: ' + error.message
        });
    }
});

// Actualizar ruta
router.put('/rutas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombreRuta,
            estadoRuta,
            observaciones
        } = req.body;
        
        const pool = await getConnection();
        
        await pool.request()
            .input('rutaId', id)
            .input('nombreRuta', nombreRuta)
            .input('estadoRuta', estadoRuta)
            .input('observaciones', observaciones)
            .query(`
                UPDATE IniciosRuta
                SET NombreRuta = @nombreRuta,
                    EstadoRuta = @estadoRuta,
                    Observaciones = @observaciones
                WHERE InicioRutaID = @rutaId
            `);
        
        res.json({
            success: true,
            message: 'Ruta actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar ruta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar ruta'
        });
    }
});

// Finalizar ruta con devolución de charolas a bodega
router.post('/rutas/:id/finalizar', async (req, res) => {
    try {
        const { id } = req.params;
        const { charolasGrandesRegresan, charolasPequenasRegresan } = req.body;
        const usuario = req.session.user.username;
        const pool = await getConnection();

        // Iniciar transacción
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // 1. Obtener información de la ruta
            const rutaResult = await transaction.request()
                .input('rutaId', id)
                .query(`
                    SELECT 
                        CodigoRuta,
                        CharolasGrandesInicio,
                        CharolasPequenasInicio,
                        EstadoRuta
                    FROM IniciosRuta
                    WHERE InicioRutaID = @rutaId
                `);

            if (rutaResult.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Ruta no encontrada'
                });
            }

            const ruta = rutaResult.recordset[0];

            // Verificar que la ruta esté iniciada
            if (ruta.EstadoRuta === 'Finalizada') {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'La ruta ya está finalizada'
                });
            }

            // 2. Obtener bodega actual
            const bodegaResult = await transaction.request().query(`
                SELECT TOP 1 
                    CharolasGrandesBodega,
                    CharolasPequenasBodega
                FROM InventarioBodega
                WHERE Activo = 1
                ORDER BY FechaActualizacion DESC
            `);

            let bodegaGrandes = 0;
            let bodegaPequenas = 0;

            if (bodegaResult.recordset.length > 0) {
                bodegaGrandes = bodegaResult.recordset[0].CharolasGrandesBodega || 0;
                bodegaPequenas = bodegaResult.recordset[0].CharolasPequenasBodega || 0;
            }

            // 3. Calcular nueva bodega (SUMAR charolas que regresan)
            const nuevaBodegaGrandes = bodegaGrandes + charolasGrandesRegresan;
            const nuevaBodegaPequenas = bodegaPequenas + charolasPequenasRegresan;

            // 4. Actualizar estado de la ruta
            await transaction.request()
                .input('rutaId', id)
                .query(`
                    UPDATE IniciosRuta
                    SET EstadoRuta = 'Finalizada',
                        FechaFinalizacion = DATEADD(HOUR, -5, GETUTCDATE())
                    WHERE InicioRutaID = @rutaId
                `);

            // 5. Actualizar bodega
            // Desactivar bodega anterior
            await transaction.request().query(`
                UPDATE InventarioBodega 
                SET Activo = 0 
                WHERE Activo = 1
            `);

            // Insertar nueva bodega
            await transaction.request()
                .input('grandesBodega', nuevaBodegaGrandes)
                .input('pequenasBodega', nuevaBodegaPequenas)
                .input('usuario', usuario)
                .input('notas', `Actualización automática: Finalización de ruta ${ruta.CodigoRuta}. Regresaron ${charolasGrandesRegresan} grandes y ${charolasPequenasRegresan} pequeñas`)
                .query(`
                    INSERT INTO InventarioBodega (
                        CharolasGrandesBodega,
                        CharolasPequenasBodega,
                        Notas,
                        UsuarioActualizacion,
                        FechaActualizacion,
                        Activo
                    ) VALUES (
                        @grandesBodega,
                        @pequenasBodega,
                        @notas,
                        @usuario,
                        DATEADD(HOUR, -5, GETUTCDATE()),
                        1
                    )
                `);

            // Calcular diferencia
            const diferenciaGrandes = ruta.CharolasGrandesInicio - charolasGrandesRegresan;
            const diferenciaPequenas = ruta.CharolasPequenasInicio - charolasPequenasRegresan;
            const diferenciaTotal = diferenciaGrandes + diferenciaPequenas;

            let mensajeDetalle = '';
            if (diferenciaTotal > 0) {
                mensajeDetalle = `Se entregaron/perdieron ${diferenciaTotal} charolas (${diferenciaGrandes} grandes, ${diferenciaPequenas} pequeñas).`;
            } else if (diferenciaTotal < 0) {
                mensajeDetalle = `El entregador recogió ${Math.abs(diferenciaTotal)} charolas adicionales de clientes.`;
            } else {
                mensajeDetalle = `El entregador regresó con todas las charolas.`;
            }

            // Commit de la transacción
            await transaction.commit();

            res.json({
                success: true,
                message: `Ruta finalizada exitosamente. ${mensajeDetalle} Bodega actualizada: ${nuevaBodegaGrandes} grandes, ${nuevaBodegaPequenas} pequeñas`,
                data: {
                    bodegaGrandes: nuevaBodegaGrandes,
                    bodegaPequenas: nuevaBodegaPequenas,
                    diferenciaGrandes,
                    diferenciaPequenas
                }
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Error al finalizar ruta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al finalizar ruta: ' + error.message
        });
    }
});

// Generar Excel de una ruta específica
router.post('/rutas/:id/excel', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();

        console.log(`📊 Generando Excel de ruta ID: ${id}`);

        // Obtener información completa de la ruta
        const rutaResult = await pool.request()
            .input('rutaId', id)
            .query(`
                SELECT 
                    ir.InicioRutaID,
                    ir.CodigoRuta,
                    ir.NombreRuta,
                    ir.FechaInicio,
                    ir.CharolasGrandesInicio,
                    ir.CharolasPequenasInicio,
                    ISNULL(ir.CharolasGrandesActuales, ir.CharolasGrandesInicio) AS CharolasGrandesActuales,
                    ISNULL(ir.CharolasPequenasActuales, ir.CharolasPequenasInicio) AS CharolasPequenasActuales,
                    ir.Observaciones,
                    ir.EstadoRuta,
                    ir.UsuarioRegistro,
                    ir.FechaFinalizacion,
                    ir.EntregadorID,
                    ir.EntregadorID AS EntregadorNombre
                FROM IniciosRuta ir
                WHERE ir.InicioRutaID = @rutaId
            `);

        if (rutaResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ruta no encontrada'
            });
        }

        // Obtener movimientos de la ruta
        const movimientosResult = await pool.request()
            .input('rutaId', id)
            .query(`
                SELECT 
                    cc.ControlID,
                    cc.CodigoCliente,
                    c.NombreCliente,
                    c.NombreEstablecimiento,
                    c.Vendedor,
                    cc.FechaMovimiento,
                    cc.CantidadDescargada,
                    cc.CantidadRecogida,
                    cc.SaldoReportado,
                    ISNULL(cc.CantidadDescargadaPequenas, 0) AS CantidadDescargadaPequenas,
                    ISNULL(cc.CantidadRecogidaPequenas, 0) AS CantidadRecogidaPequenas,
                    ISNULL(cc.SaldoReportadoPequenas, 0) AS SaldoReportadoPequenas,
                    cc.Verificado,
                    cc.UsuarioRegistro
                FROM ControlCharolas cc
                INNER JOIN Clientes c ON cc.CodigoCliente = c.CodigoCliente
                WHERE cc.RutaID = @rutaId
                ORDER BY cc.FechaMovimiento ASC
            `);

        const ruta = rutaResult.recordset[0];
        const movimientos = movimientosResult.recordset;

        // Calcular totales
        const totales = {
            descargadasG: movimientos.reduce((sum, m) => sum + (m.CantidadDescargada || 0), 0),
            recogidasG: movimientos.reduce((sum, m) => sum + (m.CantidadRecogida || 0), 0),
            descargadasP: movimientos.reduce((sum, m) => sum + (m.CantidadDescargadaPequenas || 0), 0),
            recogidasP: movimientos.reduce((sum, m) => sum + (m.CantidadRecogidaPequenas || 0), 0)
        };

        // Generar Excel con ExcelJS
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        
        workbook.creator = 'Sistema de Control de Charolas';
        workbook.created = new Date();

        // HOJA 1: INFORMACIÓN DE LA RUTA
        const wsInfo = workbook.addWorksheet('Información de Ruta');

        // Estilos
        const titleStyle = {
            font: { bold: true, size: 18, color: { argb: 'FF1E3A8A' } },
            alignment: { vertical: 'middle', horizontal: 'center' }
        };

        const labelStyle = {
            font: { bold: true, size: 11 },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } },
            alignment: { vertical: 'middle', horizontal: 'right' }
        };

        const valueStyle = {
            font: { size: 11 },
            alignment: { vertical: 'middle', horizontal: 'left' }
        };

        const estadoColors = {
            'Iniciada': 'FF3B82F6',
            'Finalizada': 'FF10B981',
            'Cancelada': 'FFEF4444'
        };

        // Título
        wsInfo.mergeCells('A1:D1');
        wsInfo.getCell('A1').value = `🚚 REPORTE DE RUTA: ${ruta.CodigoRuta}`;
        wsInfo.getCell('A1').style = titleStyle;
        wsInfo.getRow(1).height = 35;

        // Información de la ruta
        let row = 3;

        const infoFields = [
            { label: 'Código de Ruta:', value: ruta.CodigoRuta },
            { label: 'Nombre de Ruta:', value: ruta.NombreRuta },
            { label: 'Entregador:', value: ruta.EntregadorNombre },
            { label: 'Estado:', value: ruta.EstadoRuta },
            { label: 'Fecha Inicio:', value: new Date(ruta.FechaInicio).toLocaleString('es-ES') },
            { label: 'Fecha Finalización:', value: ruta.FechaFinalizacion ? new Date(ruta.FechaFinalizacion).toLocaleString('es-ES') : 'En progreso' },
            { label: 'Usuario Registro:', value: ruta.UsuarioRegistro },
            { label: '', value: '' }, // Espacio
            { label: 'Charolas Grandes Inicio:', value: ruta.CharolasGrandesInicio },
            { label: 'Charolas Grandes Actuales:', value: ruta.CharolasGrandesActuales },
            { label: 'Charolas Pequeñas Inicio:', value: ruta.CharolasPequenasInicio },
            { label: 'Charolas Pequeñas Actuales:', value: ruta.CharolasPequenasActuales },
            { label: '', value: '' }, // Espacio
            { label: 'Observaciones:', value: ruta.Observaciones || 'N/A' }
        ];

        infoFields.forEach(field => {
            wsInfo.getCell(`A${row}`).value = field.label;
            wsInfo.getCell(`A${row}`).style = labelStyle;
            wsInfo.getCell(`B${row}`).value = field.value;
            wsInfo.getCell(`B${row}`).style = valueStyle;
            
            if (field.label === 'Estado:') {
                wsInfo.getCell(`B${row}`).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: estadoColors[ruta.EstadoRuta] || 'FFE5E7EB' }
                };
                wsInfo.getCell(`B${row}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            }
            
            row++;
        });

        wsInfo.getColumn('A').width = 30;
        wsInfo.getColumn('B').width = 50;

        // HOJA 2: MOVIMIENTOS DETALLADOS
        const wsMovs = workbook.addWorksheet('Movimientos');

        const headerStyle = {
            font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } },
            alignment: { vertical: 'middle', horizontal: 'center' },
            border: {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
            }
        };

        // Título
        wsMovs.mergeCells('A1:M1');
        wsMovs.getCell('A1').value = `📋 MOVIMIENTOS DE RUTA: ${ruta.CodigoRuta}`;
        wsMovs.getCell('A1').style = titleStyle;
        wsMovs.getRow(1).height = 30;

        // Encabezados
        wsMovs.getRow(3).values = [
            'N°',
            'Fecha/Hora',
            'Código',
            'Cliente',
            'Establecimiento',
            'Vendedor',
            'Desc. G',
            'Rec. G',
            'Saldo G',
            'Desc. P',
            'Rec. P',
            'Saldo P',
            'Usuario'
        ];

        wsMovs.getRow(3).eachCell(cell => {
            cell.style = headerStyle;
        });
        wsMovs.getRow(3).height = 25;

        // Anchos de columnas
        wsMovs.columns = [
            { width: 6 },   // N°
            { width: 18 },  // Fecha/Hora
            { width: 12 },  // Código
            { width: 25 },  // Cliente
            { width: 25 },  // Establecimiento
            { width: 18 },  // Vendedor
            { width: 10 },  // Desc. G
            { width: 10 },  // Rec. G
            { width: 10 },  // Saldo G
            { width: 10 },  // Desc. P
            { width: 10 },  // Rec. P
            { width: 10 },  // Saldo P
            { width: 15 }   // Usuario
        ];

        // Datos de movimientos
        movimientos.forEach((mov, index) => {
            const rowData = wsMovs.addRow([
                index + 1,
                new Date(mov.FechaMovimiento).toLocaleString('es-ES'),
                mov.CodigoCliente,
                mov.NombreCliente,
                mov.NombreEstablecimiento,
                mov.Vendedor,
                mov.CantidadDescargada,
                mov.CantidadRecogida,
                mov.SaldoReportado,
                mov.CantidadDescargadaPequenas,
                mov.CantidadRecogidaPequenas,
                mov.SaldoReportadoPequenas,
                mov.UsuarioRegistro
            ]);

            rowData.eachCell((cell, colNumber) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
                };

                if (index % 2 === 0) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF9FAFB' }
                    };
                }

                if (colNumber >= 7 && colNumber <= 12) {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                } else {
                    cell.alignment = { vertical: 'middle', horizontal: 'left' };
                }
            });
        });

        // Fila de totales
        const totalRow = wsMovs.addRow([
            '',
            '',
            '',
            '',
            '',
            'TOTALES:',
            totales.descargadasG,
            totales.recogidasG,
            '',
            totales.descargadasP,
            totales.recogidasP,
            '',
            ''
        ]);

        totalRow.eachCell((cell, colNumber) => {
            cell.font = { bold: true, size: 11 };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE5E7EB' }
            };
            cell.border = {
                top: { style: 'medium' },
                bottom: { style: 'medium' },
                left: { style: 'thin' },
                right: { style: 'thin' }
            };
            if (colNumber >= 7) {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            } else {
                cell.alignment = { vertical: 'middle', horizontal: 'right' };
            }
        });

        // Resumen
        const resumenRow = wsMovs.lastRow.number + 2;
        wsMovs.mergeCells(`A${resumenRow}:M${resumenRow}`);
        wsMovs.getCell(`A${resumenRow}`).value = 
            `📊 Resumen: ${movimientos.length} movimiento(s) • ${[...new Set(movimientos.map(m => m.NombreCliente))].length} cliente(s) atendido(s) • Ruta ${ruta.EstadoRuta}`;
        wsMovs.getCell(`A${resumenRow}`).style = {
            font: { bold: true, size: 11 },
            alignment: { vertical: 'middle', horizontal: 'center' },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }
        };

        // Generar archivo
        const buffer = await workbook.xlsx.writeBuffer();

        // Enviar archivo
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Ruta_${ruta.CodigoRuta}_${new Date().toISOString().split('T')[0]}.xlsx`);
        res.send(buffer);

        console.log(`✅ Excel de ruta ${ruta.CodigoRuta} generado exitosamente`);

    } catch (error) {
        console.error('❌ Error al generar Excel de ruta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar Excel: ' + error.message
        });
    }
});

// Obtener movimientos de una ruta específica
router.get('/rutas/:id/movimientos', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();

        // Obtener información de la ruta
        const rutaResult = await pool.request()
            .input('rutaId', id)
            .query(`
                SELECT 
                    ir.InicioRutaID,
                    ir.CodigoRuta,
                    ir.NombreRuta,
                    ir.FechaInicio,
                    ir.CharolasGrandesInicio,
                    ir.CharolasPequenasInicio,
                    ISNULL(ir.CharolasGrandesActuales, ir.CharolasGrandesInicio) AS CharolasGrandesActuales,
                    ISNULL(ir.CharolasPequenasActuales, ir.CharolasPequenasInicio) AS CharolasPequenasActuales,
                    ir.EstadoRuta,
                    ir.FechaFinalizacion,
                    ir.EntregadorID,
                    ir.EntregadorID AS EntregadorNombre
                FROM IniciosRuta ir
                WHERE ir.InicioRutaID = @rutaId
            `);

        if (rutaResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ruta no encontrada'
            });
        }

        // Obtener movimientos de la ruta
        const movimientosResult = await pool.request()
            .input('rutaId', id)
            .query(`
                SELECT 
                    cc.ControlID,
                    cc.CodigoCliente,
                    c.NombreCliente,
                    c.NombreEstablecimiento,
                    cc.FechaMovimiento,
                    cc.CantidadDescargada,
                    cc.CantidadRecogida,
                    cc.SaldoReportado,
                    ISNULL(cc.CantidadDescargadaPequenas, 0) AS CantidadDescargadaPequenas,
                    ISNULL(cc.CantidadRecogidaPequenas, 0) AS CantidadRecogidaPequenas,
                    ISNULL(cc.SaldoReportadoPequenas, 0) AS SaldoReportadoPequenas,
                    cc.Verificado,
                    cc.UsuarioRegistro
                FROM ControlCharolas cc
                INNER JOIN Clientes c ON cc.CodigoCliente = c.CodigoCliente
                WHERE cc.RutaID = @rutaId
                ORDER BY cc.FechaMovimiento ASC
            `);

        // Calcular resumen
        const totalDescargadasG = movimientosResult.recordset.reduce((sum, m) => sum + (m.CantidadDescargada || 0), 0);
        const totalRecogidasG = movimientosResult.recordset.reduce((sum, m) => sum + (m.CantidadRecogida || 0), 0);
        const totalDescargadasP = movimientosResult.recordset.reduce((sum, m) => sum + (m.CantidadDescargadaPequenas || 0), 0);
        const totalRecogidasP = movimientosResult.recordset.reduce((sum, m) => sum + (m.CantidadRecogidaPequenas || 0), 0);

        const ruta = rutaResult.recordset[0];
        const clientesAtendidos = [...new Set(movimientosResult.recordset.map(m => m.NombreCliente))];

        res.json({
            success: true,
            data: {
                ruta: ruta,
                movimientos: movimientosResult.recordset,
                resumen: {
                    // Grandes
                    inicioGrandes: ruta.CharolasGrandesInicio,
                    totalDescargadasG,
                    totalRecogidasG,
                    actualesGrandes: ruta.CharolasGrandesActuales,
                    
                    // Pequeñas
                    inicioPequenas: ruta.CharolasPequenasInicio,
                    totalDescargadasP,
                    totalRecogidasP,
                    actualesPequenas: ruta.CharolasPequenasActuales,
                    
                    // Estadísticas
                    totalMovimientos: movimientosResult.recordset.length,
                    clientesAtendidos: clientesAtendidos.length,
                    listaClientes: clientesAtendidos.join(', ')
                }
            }
        });
    } catch (error) {
        console.error('Error al obtener movimientos de ruta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener movimientos de ruta'
        });
    }
});

// Eliminar ruta
// Eliminar ruta (solo administradores)
router.delete('/rutas/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();
        
        await pool.request()
            .input('rutaId', id)
            .query('DELETE FROM IniciosRuta WHERE InicioRutaID = @rutaId');
        
        res.json({
            success: true,
            message: 'Ruta eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar ruta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar ruta'
        });
    }
});

// ============================================
// RUTAS DE ENTREGADORES
// ============================================

// Obtener lista de entregadores
router.get('/entregadores', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                EntregadorID,
                Codigo,
                Nombre,
                Apellido,
                Telefono
            FROM Entregadores
            WHERE Activo = 1
            ORDER BY Nombre
        `);
        
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error al obtener entregadores:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener entregadores'
        });
    }
});

// Crear nuevo entregador con código automático
router.post('/entregadores', async (req, res) => {
    try {
        const { nombre, apellido, telefono } = req.body;
        const usuario = req.session.user.username;
        const pool = await getConnection();

        // Validar campos requeridos
        if (!nombre || !apellido) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y apellido son requeridos'
            });
        }

        // Obtener el último código para generar el siguiente
        const ultimoCodigo = await pool.request().query(`
            SELECT TOP 1 Codigo 
            FROM Entregadores 
            WHERE Codigo LIKE 'ENT%'
            ORDER BY Codigo DESC
        `);

        let nuevoCodigo = 'ENT001';
        if (ultimoCodigo.recordset.length > 0) {
            const ultimoNumero = parseInt(ultimoCodigo.recordset[0].Codigo.substring(3));
            const siguienteNumero = ultimoNumero + 1;
            nuevoCodigo = 'ENT' + String(siguienteNumero).padStart(3, '0');
        }

        // Insertar entregador
        const result = await pool.request()
            .input('codigo', nuevoCodigo)
            .input('nombre', nombre.trim().toUpperCase())
            .input('apellido', apellido.trim().toUpperCase())
            .input('telefono', telefono ? telefono.trim() : null)
            .input('usuario', usuario)
            .query(`
                INSERT INTO Entregadores (
                    Codigo,
                    Nombre,
                    Apellido,
                    Telefono,
                    UsuarioCreacion,
                    Activo
                ) VALUES (
                    @codigo,
                    @nombre,
                    @apellido,
                    @telefono,
                    @usuario,
                    1
                );
                SELECT SCOPE_IDENTITY() AS ID;
            `);

        res.json({
            success: true,
            message: 'Entregador creado exitosamente',
            data: { 
                id: result.recordset[0].ID,
                codigo: nuevoCodigo 
            }
        });
    } catch (error) {
        console.error('Error al crear entregador:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear entregador: ' + error.message
        });
    }
});

// ============================================
// RUTAS DE PROVEEDORES
// ============================================

// Obtener lista de proveedores con saldos
router.get('/proveedores', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                p.ProveedorID,
                p.NombreProveedor,
                p.Producto,
                p.FechaRegistro,
                p.Activo,
                ISNULL((
                    SELECT TOP 1 
                        SaldoControlAnterior + CharolasGrandesEntrantes - CharolasGrandesSalientes
                    FROM ControlCharolasProveedor cp 
                    WHERE cp.ProveedorID = p.ProveedorID 
                    ORDER BY FechaMovimiento DESC
                ), 0) AS SaldoFinalGrandes,
                ISNULL((
                    SELECT TOP 1 
                        SaldoControlAnteriorPequenas + CharolasPequenasEntrantes - CharolasPequenasSalientes
                    FROM ControlCharolasProveedor cp 
                    WHERE cp.ProveedorID = p.ProveedorID 
                    ORDER BY FechaMovimiento DESC
                ), 0) AS SaldoFinalPequenas,
                (
                    SELECT TOP 1 FechaMovimiento
                    FROM ControlCharolasProveedor cp
                    WHERE cp.ProveedorID = p.ProveedorID
                    ORDER BY FechaMovimiento DESC
                ) AS UltimoMovimiento
            FROM Proveedores p
            WHERE p.Activo = 1
            ORDER BY p.NombreProveedor
        `);
        
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener proveedores'
        });
    }
});

// Crear nuevo proveedor
router.post('/proveedores', async (req, res) => {
    try {
        const { nombre, producto } = req.body;
        const usuario = req.session.user.username;

        if (!nombre || !producto) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y producto son requeridos'
            });
        }

        const pool = await getConnection();
        
        // Verificar si ya existe
        const existe = await pool.request()
            .input('nombre', nombre.toUpperCase())
            .query('SELECT ProveedorID FROM Proveedores WHERE UPPER(NombreProveedor) = @nombre AND Activo = 1');

        if (existe.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un proveedor con ese nombre'
            });
        }

        // Crear proveedor
        const result = await pool.request()
            .input('nombre', nombre.toUpperCase())
            .input('producto', producto.toUpperCase())
            .input('usuario', usuario)
            .query(`
                INSERT INTO Proveedores (NombreProveedor, Producto, UsuarioCreacion)
                VALUES (@nombre, @producto, @usuario);
                SELECT SCOPE_IDENTITY() AS ID;
            `);

        res.json({
            success: true,
            message: 'Proveedor creado exitosamente',
            data: { id: result.recordset[0].ID }
        });
    } catch (error) {
        console.error('Error al crear proveedor:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear proveedor'
        });
    }
});

// Obtener movimientos de un proveedor
router.get('/proveedores/:id/movimientos', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('proveedorId', id)
            .query(`
                SELECT 
                    ControlProveedorID,
                    ProveedorID,
                    FechaMovimiento,
                    SaldoControlAnterior,
                    CharolasGrandesEntrantes,
                    CharolasGrandesSalientes,
                    SaldoControlAnteriorPequenas,
                    CharolasPequenasEntrantes,
                    CharolasPequenasSalientes,
                    SaldoFinal,
                    UsuarioRegistro,
                    FechaRegistro
                FROM ControlCharolasProveedor
                WHERE ProveedorID = @proveedorId
                ORDER BY FechaMovimiento DESC
            `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error al obtener movimientos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener movimientos'
        });
    }
});

// Registrar nuevo movimiento de proveedor
router.post('/proveedores/:id/movimientos', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            tipoMovimiento,
            saldoAnteriorGrandes,
            grandesEntrantes,
            grandesSalientes,
            saldoAnteriorPequenas,
            pequenasEntrantes,
            pequenasSalientes,
            observaciones
        } = req.body;

        const usuario = req.session.user.username;
        const pool = await getConnection();

        // Iniciar transacción
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // 1. Obtener estado actual de bodega
            const bodegaResult = await transaction.request().query(`
                SELECT TOP 1 
                    CharolasGrandesBodega,
                    CharolasPequenasBodega
                FROM InventarioBodega
                WHERE Activo = 1
                ORDER BY FechaActualizacion DESC
            `);

            let bodegaGrandes = 0;
            let bodegaPequenas = 0;

            if (bodegaResult.recordset.length > 0) {
                bodegaGrandes = bodegaResult.recordset[0].CharolasGrandesBodega || 0;
                bodegaPequenas = bodegaResult.recordset[0].CharolasPequenasBodega || 0;
            }

            // 2. Validaciones según tipo de movimiento
            let mensajeResultado = '';
            let nuevaBodegaGrandes = bodegaGrandes;
            let nuevaBodegaPequenas = bodegaPequenas;

            if (tipoMovimiento === 'salida') {
                // VALIDAR: No puede sacar más de lo que hay en bodega
                if (grandesSalientes > bodegaGrandes) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: `No hay suficientes charolas grandes en bodega. Disponibles: ${bodegaGrandes}, Intentas sacar: ${grandesSalientes}`
                    });
                }

                if (pequenasSalientes > bodegaPequenas) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: `No hay suficientes charolas pequeñas en bodega. Disponibles: ${bodegaPequenas}, Intentas sacar: ${pequenasSalientes}`
                    });
                }

                // Calcular nueva bodega (RESTAR)
                nuevaBodegaGrandes = bodegaGrandes - grandesSalientes;
                nuevaBodegaPequenas = bodegaPequenas - pequenasSalientes;
                
                mensajeResultado = `Salida registrada. Bodega actualizada: ${nuevaBodegaGrandes} grandes, ${nuevaBodegaPequenas} pequeñas`;

            } else if (tipoMovimiento === 'entrada') {
                // Calcular nueva bodega (SUMAR)
                nuevaBodegaGrandes = bodegaGrandes + grandesEntrantes;
                nuevaBodegaPequenas = bodegaPequenas + pequenasEntrantes;
                
                mensajeResultado = `Entrada registrada. Bodega actualizada: ${nuevaBodegaGrandes} grandes, ${nuevaBodegaPequenas} pequeñas`;
            }

            // 3. Validar que todas las cantidades sean no negativas
            if (
                saldoAnteriorGrandes < 0 || grandesEntrantes < 0 || grandesSalientes < 0 ||
                saldoAnteriorPequenas < 0 || pequenasEntrantes < 0 || pequenasSalientes < 0
            ) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Las cantidades no pueden ser negativas'
                });
            }

            // 4. Validar que los saldos finales del proveedor no sean negativos
            const saldoFinalGrandes = saldoAnteriorGrandes + grandesEntrantes - grandesSalientes;
            const saldoFinalPequenas = saldoAnteriorPequenas + pequenasEntrantes - pequenasSalientes;

            if (saldoFinalGrandes < 0 || saldoFinalPequenas < 0) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'El saldo final del proveedor no puede ser negativo. Verifique las cantidades.'
                });
            }

            // 5. Insertar movimiento en ControlCharolasProveedor
            await transaction.request()
                .input('proveedorId', id)
                .input('saldoAnteriorGrandes', saldoAnteriorGrandes)
                .input('grandesEntrantes', grandesEntrantes)
                .input('grandesSalientes', grandesSalientes)
                .input('saldoAnteriorPequenas', saldoAnteriorPequenas)
                .input('pequenasEntrantes', pequenasEntrantes)
                .input('pequenasSalientes', pequenasSalientes)
                .input('usuario', usuario)
                .query(`
                    INSERT INTO ControlCharolasProveedor (
                        ProveedorID,
                        FechaMovimiento,
                        SaldoControlAnterior,
                        CharolasGrandesEntrantes,
                        CharolasGrandesSalientes,
                        SaldoControlAnteriorPequenas,
                        CharolasPequenasEntrantes,
                        CharolasPequenasSalientes,
                        UsuarioRegistro
                    ) VALUES (
                        @proveedorId,
                        DATEADD(HOUR, -5, GETUTCDATE()),
                        @saldoAnteriorGrandes,
                        @grandesEntrantes,
                        @grandesSalientes,
                        @saldoAnteriorPequenas,
                        @pequenasEntrantes,
                        @pequenasSalientes,
                        @usuario
                    )
                `);

            // 6. Actualizar bodega (solo si hubo cambios)
            if (tipoMovimiento === 'entrada' || tipoMovimiento === 'salida') {
                // Desactivar registro anterior de bodega
                await transaction.request().query(`
                    UPDATE InventarioBodega 
                    SET Activo = 0 
                    WHERE Activo = 1
                `);

                // Insertar nuevo registro de bodega
                await transaction.request()
                    .input('grandesBodega', nuevaBodegaGrandes)
                    .input('pequenasBodega', nuevaBodegaPequenas)
                    .input('usuario', usuario)
                    .input('notas', `Actualización automática por movimiento de proveedor (${tipoMovimiento})`)
                    .query(`
                        INSERT INTO InventarioBodega (
                            CharolasGrandesBodega,
                            CharolasPequenasBodega,
                            Notas,
                            UsuarioActualizacion,
                            FechaActualizacion,
                            Activo
                        ) VALUES (
                            @grandesBodega,
                            @pequenasBodega,
                            @notas,
                            @usuario,
                            DATEADD(HOUR, -5, GETUTCDATE()),
                            1
                        )
                    `);
            }

            // Commit de la transacción
            await transaction.commit();

            res.json({
                success: true,
                message: mensajeResultado,
                data: { 
                    saldoFinalGrandes,
                    saldoFinalPequenas,
                    bodegaGrandes: nuevaBodegaGrandes,
                    bodegaPequenas: nuevaBodegaPequenas
                }
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Error al registrar movimiento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar movimiento: ' + error.message
        });
    }
});

// Obtener saldo actual de un proveedor
router.get('/proveedores/:id/saldo', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('proveedorId', id)
            .query(`
                SELECT TOP 1
                    SaldoControlAnterior + CharolasGrandesEntrantes - CharolasGrandesSalientes AS SaldoGrandes,
                    SaldoControlAnteriorPequenas + CharolasPequenasEntrantes - CharolasPequenasSalientes AS SaldoPequenas
                FROM ControlCharolasProveedor
                WHERE ProveedorID = @proveedorId
                ORDER BY FechaMovimiento DESC
            `);

        if (result.recordset.length > 0) {
            res.json({
                success: true,
                data: result.recordset[0]
            });
        } else {
            res.json({
                success: true,
                data: { SaldoGrandes: 0, SaldoPequenas: 0 }
            });
        }
    } catch (error) {
        console.error('Error al obtener saldo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener saldo'
        });
    }
});

// Eliminar (desactivar) proveedor (solo administradores)
router.delete('/proveedores/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = req.session.user.username;
        const pool = await getConnection();

        await pool.request()
            .input('proveedorId', id)
            .input('usuario', usuario)
            .query(`
                UPDATE Proveedores
                SET Activo = 0,
                    UsuarioModificacion = @usuario,
                    FechaModificacion = DATEADD(HOUR, -5, GETUTCDATE())
                WHERE ProveedorID = @proveedorId
            `);

        res.json({
            success: true,
            message: 'Proveedor eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar proveedor:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar proveedor'
        });
    }
});

// ============================================
// ENDPOINTS DE ELIMINACIÓN (SOLO ADMINISTRADORES)
// ============================================

// Eliminar cliente (solo administradores)
router.delete('/clientes/:codigo', isAdmin, async (req, res) => {
    try {
        const { codigo } = req.params;
        const usuario = req.session.user.username;
        const pool = await getConnection();

        // Verificar si el cliente tiene movimientos
        const movimientos = await pool.request()
            .input('codigo', codigo)
            .query('SELECT COUNT(*) as Total FROM ControlCharolas WHERE CodigoCliente = @codigo');

        if (movimientos.recordset[0].Total > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar el cliente ${codigo} porque tiene ${movimientos.recordset[0].Total} movimiento(s) registrado(s).`
            });
        }

        // Eliminar cliente
        await pool.request()
            .input('codigo', codigo)
            .query('DELETE FROM Clientes WHERE CodigoCliente = @codigo');

        res.json({
            success: true,
            message: `Cliente ${codigo} eliminado correctamente`
        });
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar cliente'
        });
    }
});

// Eliminar movimiento (solo administradores)
router.delete('/movimientos/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();

        // Obtener información del movimiento antes de eliminarlo
        const movimiento = await pool.request()
            .input('controlId', id)
            .query(`
                SELECT 
                    CodigoCliente,
                    CantidadDescargada,
                    CantidadRecogida,
                    RutaID
                FROM ControlCharolas 
                WHERE ControlID = @controlId
            `);

        if (movimiento.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Movimiento no encontrado'
            });
        }

        // Eliminar movimiento
        await pool.request()
            .input('controlId', id)
            .query('DELETE FROM ControlCharolas WHERE ControlID = @controlId');

        res.json({
            success: true,
            message: 'Movimiento eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar movimiento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar movimiento'
        });
    }
});

module.exports = router;