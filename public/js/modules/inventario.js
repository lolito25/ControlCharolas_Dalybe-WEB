// ===================================
// MÓDULO: INVENTARIO  public/js/modules/inventario.js
// ACTUALIZADO: Columnas Grandes y Pequeñas separadas
// ===================================

const Inventario = {
    datosCompletos: [], // Almacenar todos los datos para filtrado
    
    // Inicializar módulo
    init() {
        console.log('Módulo Inventario inicializado');
        this.cargar();
    },

    // Cargar inventario
    async cargar() {
        try {
            const tbody = document.getElementById('inventarioTableBody');
            // ✅ CAMBIO: colspan de 9 a 11 (agregamos 2 columnas)
            tbody.innerHTML = '<tr><td colspan="11" class="loading-text">Cargando...</td></tr>';
            
            const response = await fetch('/api/inventario');
            const result = await response.json();
            
            if (result.success && result.data.length > 0) {
                this.datosCompletos = result.data; // Guardar datos completos
                this.renderizarTabla(result.data);
                this.actualizarContador(result.data.length, result.data.length);
            } else {
                // ✅ CAMBIO: colspan de 9 a 11
                tbody.innerHTML = '<tr><td colspan="11" class="loading-text">No hay datos disponibles</td></tr>';
                this.actualizarContador(0, 0);
            }
        } catch (error) {
            console.error('Error al cargar inventario:', error);
            // ✅ CAMBIO: colspan de 9 a 11
            document.getElementById('inventarioTableBody').innerHTML = 
                '<tr><td colspan="11" class="loading-text" style="color: var(--error-color);">Error al cargar datos</td></tr>';
            this.actualizarContador(0, 0);
        }
    },

    // Renderizar tabla con datos
    renderizarTabla(datos) {
        const tbody = document.getElementById('inventarioTableBody');
        
        if (datos.length === 0) {
            // ✅ CAMBIO: colspan de 10 a 11
            tbody.innerHTML = '<tr><td colspan="11" class="loading-text">No se encontraron resultados</td></tr>';
            return;
        }
        
        // Verificar si el usuario es administrador
        const esAdmin = window.isAdmin && window.isAdmin();
        
        const html = datos.map(item => `
            <tr>
                <td><strong>${item.CodigoCliente}</strong></td>
                <td>${item.NombreCliente}</td>
                <td>${item.NombreEstablecimiento}</td>
                <td>${item.Vendedor}</td>
                <td>${item.Municipio}</td>
                <td style="text-align: center;">${item.SaldoControlAnterior || 0}</td>
                <td style="text-align: center;">${item.CharolasDescargadas || 0}</td>
                <td style="text-align: center;">${item.CharolasRecogidas || 0}</td>
                <!-- ✅ NUEVAS COLUMNAS -->
                <td class="col-grandes">${item.CharolasGrandes || 0}</td>
                <td class="col-pequenas">${item.CharolasPequenas || 0}</td>
                <!-- ✅ FIN NUEVAS COLUMNAS -->
                <td class="col-total"><strong>${item.CharolasActuales || 0}</strong></td>
                ${esAdmin ? `
                <td>
                    <button class="btn-action danger" onclick="Inventario.eliminarCliente('${item.CodigoCliente}')" title="Eliminar cliente">
                        🗑️
                    </button>
                </td>
                ` : '<td>-</td>'}
            </tr>
        `).join('');
        
        tbody.innerHTML = html;
    },

    // Filtrar resultados
    filtrar(query) {
        if (!query || query.trim() === '') {
            // Si no hay búsqueda, mostrar todos
            this.renderizarTabla(this.datosCompletos);
            this.actualizarContador(this.datosCompletos.length, this.datosCompletos.length);
            return;
        }

        const busqueda = query.toLowerCase().trim();
        
        // Filtrar por múltiples campos
        const resultados = this.datosCompletos.filter(item => {
            return (
                (item.CodigoCliente || '').toLowerCase().includes(busqueda) ||
                (item.NombreCliente || '').toLowerCase().includes(busqueda) ||
                (item.NombreEstablecimiento || '').toLowerCase().includes(busqueda) ||
                (item.Vendedor || '').toLowerCase().includes(busqueda) ||
                (item.Municipio || '').toLowerCase().includes(busqueda)
            );
        });

        this.renderizarTabla(resultados);
        this.actualizarContador(resultados.length, this.datosCompletos.length);
    },

    // Actualizar contador de resultados
    actualizarContador(encontrados, total) {
        const contador = document.getElementById('resultadosCount');
        if (!contador) return;

        if (total === 0) {
            contador.textContent = '';
            return;
        }

        if (encontrados === total) {
            contador.textContent = `${total} cliente${total !== 1 ? 's' : ''}`;
            contador.style.color = 'var(--text-medium)';
        } else {
            contador.textContent = `${encontrados} de ${total}`;
            contador.style.color = encontrados > 0 ? 'var(--success-color)' : 'var(--error-color)';
        }
    },

    // Mostrar modal de nuevo cliente
    mostrarModalNuevoCliente() {
        const modal = document.getElementById('modalNuevoCliente');
        const form = document.getElementById('formNuevoCliente');
        
        if (form) form.reset();
        if (modal) modal.classList.add('active');
    },

    // Cerrar modal de nuevo cliente
    cerrarModalNuevoCliente() {
        const modal = document.getElementById('modalNuevoCliente');
        if (modal) modal.classList.remove('active');
    },

    // Guardar nuevo cliente
    async guardarNuevoCliente(event) {
        event.preventDefault();

        try {
            const codigoCliente = document.getElementById('codigoCliente').value.toUpperCase();
            const nombreCliente = document.getElementById('nombreCliente').value;
            const nombreEstablecimiento = document.getElementById('nombreEstablecimiento').value;
            const vendedor = document.getElementById('vendedor').value;
            const municipio = document.getElementById('municipio').value;
            const saldoInicialG = parseInt(document.getElementById('saldoInicialGrandes').value) || 0;
            const saldoInicialP = parseInt(document.getElementById('saldoInicialPequenas').value) || 0;

            console.log('📥 Guardando nuevo cliente:', {
                codigoCliente,
                nombreCliente,
                nombreEstablecimiento,
                vendedor,
                municipio,
                saldoInicialG,
                saldoInicialP
            });

            // Crear cliente
            const response = await fetch('/api/clientes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    codigoCliente,
                    nombreCliente,
                    nombreEstablecimiento,
                    vendedor,
                    municipio,
                    saldoInicialG,
                    saldoInicialP
                })
            });

            const result = await response.json();

            if (result.success) {
                alert(`✅ Cliente creado exitosamente!\n\nCódigo: ${codigoCliente}\nNombre: ${nombreCliente}\nSaldo inicial: ${saldoInicialG}G, ${saldoInicialP}P`);
                this.cerrarModalNuevoCliente();
                this.cargar(); // Recargar inventario
                
                // Limpiar búsqueda
                const buscarInput = document.getElementById('buscarInventario');
                if (buscarInput) buscarInput.value = '';
            } else {
                alert('❌ Error al crear cliente: ' + result.message);
            }
        } catch (error) {
            console.error('Error al guardar cliente:', error);
            alert('❌ Error al guardar cliente: ' + error.message);
        }
    },

    // Descargar a Excel
    async descargarExcel() {
        try {
            console.log('📥 Descargando inventario a Excel...');
            
            // Verificar si hay filtro activo
            const buscarInput = document.getElementById('buscarInventario');
            const hayFiltro = buscarInput && buscarInput.value.trim() !== '';
            
            // Usar datos filtrados o completos
            const datosParaExportar = hayFiltro ? 
                this.datosCompletos.filter(item => {
                    const busqueda = buscarInput.value.toLowerCase().trim();
                    return (
                        (item.CodigoCliente || '').toLowerCase().includes(busqueda) ||
                        (item.NombreCliente || '').toLowerCase().includes(busqueda) ||
                        (item.NombreEstablecimiento || '').toLowerCase().includes(busqueda) ||
                        (item.Vendedor || '').toLowerCase().includes(busqueda) ||
                        (item.Municipio || '').toLowerCase().includes(busqueda)
                    );
                }) : 
                this.datosCompletos;

            if (!datosParaExportar || datosParaExportar.length === 0) {
                alert('❌ No hay datos para exportar');
                return;
            }

            // Preparar datos para Excel
            const data = datosParaExportar;
            
            // ✅ CAMBIO: Calcular totales con Grandes y Pequeñas
            const totales = {
                totalClientes: data.length,
                totalSaldoAnterior: data.reduce((sum, item) => sum + (item.SaldoControlAnterior || 0), 0),
                totalDescargadas: data.reduce((sum, item) => sum + (item.CharolasDescargadas || 0), 0),
                totalRecogidas: data.reduce((sum, item) => sum + (item.CharolasRecogidas || 0), 0),
                // ✅ NUEVOS TOTALES
                totalGrandes: data.reduce((sum, item) => sum + (item.CharolasGrandes || 0), 0),
                totalPequenas: data.reduce((sum, item) => sum + (item.CharolasPequenas || 0), 0),
                // ✅ FIN NUEVOS TOTALES
                totalActuales: data.reduce((sum, item) => sum + (item.CharolasActuales || 0), 0)
            };

            // Solicitar descarga al servidor
            const downloadResponse = await fetch('/api/inventario/excel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data, totales })
            });

            if (downloadResponse.ok) {
                // Obtener el archivo como blob
                const blob = await downloadResponse.blob();
                
                // Crear URL temporal
                const url = window.URL.createObjectURL(blob);
                
                // Crear link de descarga
                const a = document.createElement('a');
                a.href = url;
                
                // Nombre del archivo con fecha
                const fecha = new Date().toISOString().split('T')[0];
                const sufijo = hayFiltro ? '_Filtrado' : '';
                a.download = `Inventario_Charolas_${fecha}${sufijo}.xlsx`;
                
                // Simular click
                document.body.appendChild(a);
                a.click();
                
                // Limpiar
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                if (hayFiltro) {
                    console.log(`✅ Excel descargado con ${data.length} registros filtrados`);
                } else {
                    console.log('✅ Excel descargado exitosamente');
                }
            } else {
                alert('❌ Error al generar el archivo Excel');
            }
        } catch (error) {
            console.error('Error al descargar Excel:', error);
            alert('❌ Error al descargar Excel: ' + error.message);
        }
    },

    // Eliminar cliente (solo administradores)
    async eliminarCliente(codigoCliente) {
        // Verificar permisos
        if (!window.isAdmin || !window.isAdmin()) {
            alert('❌ No tienes permisos para eliminar clientes. Solo administradores pueden realizar esta acción.');
            return;
        }

        // Confirmar eliminación
        if (!confirm(`⚠️ ¿Estás seguro de eliminar el cliente ${codigoCliente}?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/clientes/${codigoCliente}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                alert('✅ ' + result.message);
                // Recargar datos
                this.cargar();
            } else {
                alert('❌ ' + result.message);
            }
        } catch (error) {
            console.error('Error al eliminar cliente:', error);
            alert('❌ Error al eliminar cliente');
        }
    }
};

// Exportar para uso global
window.Inventario = Inventario;