// ===================================
// MÓDULO: PROVEEDORES public/js/modules/proveedores.js
// ===================================

const Proveedores = {
    proveedorActual: null,

    // Inicializar módulo
    init() {
        this.cargar();
        this.setupEventListeners();
    },

    // Configurar event listeners
    setupEventListeners() {
        // Formulario nuevo proveedor
        const formNuevo = document.getElementById('formNuevoProveedor');
        if (formNuevo) {
            formNuevo.onsubmit = async (e) => {
                e.preventDefault();
                await this.crearProveedor();
            };
        }

        // Formulario nuevo movimiento
        const formMovimiento = document.getElementById('formNuevoMovimiento');
        if (formMovimiento) {
            formMovimiento.onsubmit = async (e) => {
                e.preventDefault();
                await this.registrarMovimiento();
            };

            // Listeners para actualizar preview
            const inputs = ['movGrandesEntrantes', 'movGrandesSalientes', 'movPequenasEntrantes', 'movPequenasSalientes'];
            inputs.forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                    input.addEventListener('input', () => this.actualizarPreview());
                }
            });
        }

        // Cerrar modales al hacer clic fuera
        window.onclick = (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.classList.remove('active');
            }
        };
    },

    // Cargar lista de proveedores
    async cargar() {
        try {
            const tbody = document.getElementById('proveedoresTableBody');
            tbody.innerHTML = '<tr><td colspan="8" class="loading-text">Cargando...</td></tr>';
            
            const response = await fetch('/api/proveedores');
            const result = await response.json();
            
            if (result.success && result.data.length > 0) {
                const html = result.data.map(prov => {
                    let fechaFormato = '-';
                    if (prov.UltimoMovimiento) {
                        const fecha = new Date(prov.UltimoMovimiento);
                        fechaFormato = fecha.toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    }

                    const total = (prov.SaldoFinalGrandes || 0) + (prov.SaldoFinalPequenas || 0);
                    
                    return `
                        <tr>
                            <td>${prov.ProveedorID}</td>
                            <td><strong>${prov.NombreProveedor}</strong></td>
                            <td>${prov.Producto}</td>
                            <td>${prov.SaldoFinalGrandes || 0}</td>
                            <td>${prov.SaldoFinalPequenas || 0}</td>
                            <td><strong>${total}</strong></td>
                            <td>${fechaFormato}</td>
                            <td>
                                <div class="table-actions">
                                    <button class="btn-action view" onclick="Proveedores.verHistorial(${prov.ProveedorID}, '${prov.NombreProveedor}')" title="Ver historial">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2"/>
                                        </svg>
                                    </button>
                                    <button class="btn-action edit" onclick="Proveedores.nuevoMovimiento(${prov.ProveedorID}, '${prov.NombreProveedor}', ${prov.SaldoFinalGrandes || 0}, ${prov.SaldoFinalPequenas || 0})" title="Nuevo movimiento">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        </svg>
                                    </button>
                                    ${window.isAdmin && window.isAdmin() ? `
                                    <button class="btn-action delete" onclick="Proveedores.eliminar(${prov.ProveedorID}, '${prov.NombreProveedor}')" title="Eliminar">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" stroke-width="2"/>
                                        </svg>
                                    </button>
                                    ` : ''}
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');
                
                tbody.innerHTML = html;
            } else {
                tbody.innerHTML = '<tr><td colspan="8" class="loading-text">No hay proveedores disponibles. <a href="#" onclick="Proveedores.mostrarModalNuevo(); return false;">Crear primero</a></td></tr>';
            }
        } catch (error) {
            console.error('Error al cargar proveedores:', error);
            document.getElementById('proveedoresTableBody').innerHTML = 
                '<tr><td colspan="8" class="loading-text" style="color: var(--error-color);">Error al cargar datos</td></tr>';
        }
    },

    // Mostrar modal de nuevo proveedor
    mostrarModalNuevo() {
        const modal = document.getElementById('modalNuevoProveedor');
        modal.classList.add('active');
        document.getElementById('formNuevoProveedor').reset();
        document.getElementById('productoProveedor').value = 'CHAROLAS';
    },

    // Cerrar modal de nuevo proveedor
    cerrarModalNuevo() {
        const modal = document.getElementById('modalNuevoProveedor');
        modal.classList.remove('active');
        document.getElementById('formNuevoProveedor').reset();
    },

    // Crear nuevo proveedor
    async crearProveedor() {
        try {
            const nombre = document.getElementById('nombreProveedor').value.trim();
            const producto = document.getElementById('productoProveedor').value.trim();

            if (!nombre || !producto) {
                alert('⚠️ Por favor complete todos los campos');
                return;
            }

            const response = await fetch('/api/proveedores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, producto })
            });

            const result = await response.json();

            if (result.success) {
                alert('✅ Proveedor creado exitosamente');
                this.cerrarModalNuevo();
                this.cargar();
            } else {
                alert('❌ Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error al crear proveedor:', error);
            alert('❌ Error de conexión');
        }
    },

    // Mostrar modal de nuevo movimiento
    async nuevoMovimiento(proveedorId, nombreProveedor, saldoGrandes, saldoPequenas) {
        this.proveedorActual = {
            id: proveedorId,
            nombre: nombreProveedor,
            saldoGrandes: saldoGrandes || 0,
            saldoPequenas: saldoPequenas || 0
        };

        // Establecer valores en el modal
        document.getElementById('modalMovimientoProveedor').textContent = nombreProveedor;
        document.getElementById('movProveedorID').value = proveedorId;
        document.getElementById('movSaldoAnteriorGrandes').value = saldoGrandes || 0;
        document.getElementById('movSaldoAnteriorPequenas').value = saldoPequenas || 0;

        // Mostrar saldos actuales del proveedor
        document.getElementById('saldoActualGrandes').textContent = saldoGrandes || 0;
        document.getElementById('saldoActualPequenas').textContent = saldoPequenas || 0;
        document.getElementById('saldoActualTotal').textContent = (saldoGrandes || 0) + (saldoPequenas || 0);

        // Obtener cantidades disponibles en bodega
        try {
            const response = await fetch('/api/bodega');
            const result = await response.json();
            
            if (result.success && result.data) {
                const bodegaGrandes = result.data.CharolasGrandesBodega || 0;
                const bodegaPequenas = result.data.CharolasPequenasBodega || 0;
                
                // Guardar en campos ocultos
                document.getElementById('movBodegaGrandes').value = bodegaGrandes;
                document.getElementById('movBodegaPequenas').value = bodegaPequenas;
                
                // Mostrar en el modal
                document.getElementById('bodegaDisponibleGrandes').textContent = bodegaGrandes;
                document.getElementById('bodegaDisponiblePequenas').textContent = bodegaPequenas;
                document.getElementById('bodegaDisponibleTotal').textContent = bodegaGrandes + bodegaPequenas;
            } else {
                // Si no hay datos de bodega, establecer en 0
                document.getElementById('movBodegaGrandes').value = 0;
                document.getElementById('movBodegaPequenas').value = 0;
                document.getElementById('bodegaDisponibleGrandes').textContent = '0';
                document.getElementById('bodegaDisponiblePequenas').textContent = '0';
                document.getElementById('bodegaDisponibleTotal').textContent = '0';
            }
        } catch (error) {
            console.error('Error al obtener bodega:', error);
            // En caso de error, establecer en 0
            document.getElementById('movBodegaGrandes').value = 0;
            document.getElementById('movBodegaPequenas').value = 0;
        }

        // Resetear formulario
        document.getElementById('formNuevoMovimiento').reset();
        document.getElementById('movProveedorID').value = proveedorId;
        document.getElementById('movSaldoAnteriorGrandes').value = saldoGrandes || 0;
        document.getElementById('movSaldoAnteriorPequenas').value = saldoPequenas || 0;

        // Ocultar alerta
        document.getElementById('alertaBodega').style.display = 'none';

        this.actualizarPreview();

        // Mostrar modal
        const modal = document.getElementById('modalNuevoMovimiento');
        modal.classList.add('active');
    },

    // Cerrar modal de movimiento
    cerrarModalMovimiento() {
        const modal = document.getElementById('modalNuevoMovimiento');
        modal.classList.remove('active');
        document.getElementById('formNuevoMovimiento').reset();
        this.proveedorActual = null;
    },

    // Cambiar tipo de movimiento (helper para autocompletar campos)
    cambiarTipoMovimiento() {
        const tipo = document.getElementById('tipoMovimiento').value;
        
        // Resetear campos
        document.getElementById('movGrandesEntrantes').value = 0;
        document.getElementById('movGrandesSalientes').value = 0;
        document.getElementById('movPequenasEntrantes').value = 0;
        document.getElementById('movPequenasSalientes').value = 0;

        // Habilitar/deshabilitar campos según tipo
        if (tipo === 'entrada') {
            // ENTRADA: Solo se pueden ingresar charolas
            document.getElementById('movGrandesSalientes').disabled = true;
            document.getElementById('movPequenasSalientes').disabled = true;
            document.getElementById('movGrandesEntrantes').disabled = false;
            document.getElementById('movPequenasEntrantes').disabled = false;
            document.getElementById('movGrandesEntrantes').focus();
        } else if (tipo === 'salida') {
            // SALIDA: Solo se pueden sacar charolas (con validación de bodega)
            document.getElementById('movGrandesEntrantes').disabled = true;
            document.getElementById('movPequenasEntrantes').disabled = true;
            document.getElementById('movGrandesSalientes').disabled = false;
            document.getElementById('movPequenasSalientes').disabled = false;
            document.getElementById('movGrandesSalientes').focus();
        } else {
            // Habilitar todos
            document.getElementById('movGrandesEntrantes').disabled = false;
            document.getElementById('movPequenasEntrantes').disabled = false;
            document.getElementById('movGrandesSalientes').disabled = false;
            document.getElementById('movPequenasSalientes').disabled = false;
        }

        this.actualizarPreview();
    },

    // Actualizar preview del resultado
    actualizarPreview() {
        const tipo = document.getElementById('tipoMovimiento').value;
        const saldoAnteriorGrandes = parseInt(document.getElementById('movSaldoAnteriorGrandes').value) || 0;
        const saldoAnteriorPequenas = parseInt(document.getElementById('movSaldoAnteriorPequenas').value) || 0;
        
        const grandesEntrantes = parseInt(document.getElementById('movGrandesEntrantes').value) || 0;
        const grandesSalientes = parseInt(document.getElementById('movGrandesSalientes').value) || 0;
        const pequenasEntrantes = parseInt(document.getElementById('movPequenasEntrantes').value) || 0;
        const pequenasSalientes = parseInt(document.getElementById('movPequenasSalientes').value) || 0;

        // Obtener cantidades de bodega
        const bodegaGrandes = parseInt(document.getElementById('movBodegaGrandes').value) || 0;
        const bodegaPequenas = parseInt(document.getElementById('movBodegaPequenas').value) || 0;

        const saldoFinalGrandes = saldoAnteriorGrandes + grandesEntrantes - grandesSalientes;
        const saldoFinalPequenas = saldoAnteriorPequenas + pequenasEntrantes - pequenasSalientes;
        const total = saldoFinalGrandes + saldoFinalPequenas;

        document.getElementById('previewGrandes').textContent = saldoFinalGrandes;
        document.getElementById('previewPequenas').textContent = saldoFinalPequenas;
        document.getElementById('previewTotal').textContent = total;

        // Validación de bodega para SALIDAS
        const alerta = document.getElementById('alertaBodega');
        const alertaMensaje = document.getElementById('alertaBodegaMensaje');
        const submitButton = document.querySelector('#formNuevoMovimiento button[type="submit"]');
        
        let hayError = false;
        let mensajesError = [];

        if (tipo === 'salida') {
            // Validar que no se intente sacar más de lo que hay en bodega
            if (grandesSalientes > bodegaGrandes) {
                hayError = true;
                const faltante = grandesSalientes - bodegaGrandes;
                mensajesError.push(`Charolas Grandes: Intentas sacar ${grandesSalientes}, solo hay ${bodegaGrandes} en bodega. Faltan: ${faltante}`);
            }
            
            if (pequenasSalientes > bodegaPequenas) {
                hayError = true;
                const faltante = pequenasSalientes - bodegaPequenas;
                mensajesError.push(`Charolas Pequeñas: Intentas sacar ${pequenasSalientes}, solo hay ${bodegaPequenas} en bodega. Faltan: ${faltante}`);
            }

            if (hayError) {
                alerta.className = 'alerta-bodega error';
                alerta.style.display = 'flex';
                alertaMensaje.innerHTML = mensajesError.join('<br>');
                submitButton.disabled = true;
                submitButton.style.opacity = '0.5';
                submitButton.style.cursor = 'not-allowed';
            } else {
                // Mostrar mensaje de éxito
                const nuevaBodegaGrandes = bodegaGrandes - grandesSalientes;
                const nuevaBodegaPequenas = bodegaPequenas - pequenasSalientes;
                
                alerta.className = 'alerta-bodega success';
                alerta.style.display = 'flex';
                alertaMensaje.innerHTML = `✅ Bodega OK. Después del movimiento quedará: ${nuevaBodegaGrandes} grandes, ${nuevaBodegaPequenas} pequeñas (Total: ${nuevaBodegaGrandes + nuevaBodegaPequenas})`;
                submitButton.disabled = false;
                submitButton.style.opacity = '1';
                submitButton.style.cursor = 'pointer';
            }
        } else if (tipo === 'entrada') {
            // Para entradas, mostrar cuánto quedará en bodega
            const nuevaBodegaGrandes = bodegaGrandes + grandesEntrantes;
            const nuevaBodegaPequenas = bodegaPequenas + pequenasEntrantes;
            
            if (grandesEntrantes > 0 || pequenasEntrantes > 0) {
                alerta.className = 'alerta-bodega success';
                alerta.style.display = 'flex';
                alertaMensaje.innerHTML = `📦 Se agregará a bodega. Nueva cantidad: ${nuevaBodegaGrandes} grandes, ${nuevaBodegaPequenas} pequeñas (Total: ${nuevaBodegaGrandes + nuevaBodegaPequenas})`;
            } else {
                alerta.style.display = 'none';
            }
            
            submitButton.disabled = false;
            submitButton.style.opacity = '1';
            submitButton.style.cursor = 'pointer';
        } else {
            alerta.style.display = 'none';
            submitButton.disabled = false;
            submitButton.style.opacity = '1';
            submitButton.style.cursor = 'pointer';
        }

        // Colorear según si aumenta o disminuye
        const previewTotal = document.getElementById('previewTotal');
        const totalAnterior = saldoAnteriorGrandes + saldoAnteriorPequenas;
        
        if (total > totalAnterior) {
            previewTotal.style.color = 'var(--success-color)';
        } else if (total < totalAnterior) {
            previewTotal.style.color = 'var(--error-color)';
        } else {
            previewTotal.style.color = 'var(--text-dark)';
        }
    },

    // Registrar movimiento
    async registrarMovimiento() {
        try {
            const tipo = document.getElementById('tipoMovimiento').value;
            const proveedorId = document.getElementById('movProveedorID').value;
            const saldoAnteriorGrandes = parseInt(document.getElementById('movSaldoAnteriorGrandes').value) || 0;
            const saldoAnteriorPequenas = parseInt(document.getElementById('movSaldoAnteriorPequenas').value) || 0;
            const grandesEntrantes = parseInt(document.getElementById('movGrandesEntrantes').value) || 0;
            const grandesSalientes = parseInt(document.getElementById('movGrandesSalientes').value) || 0;
            const pequenasEntrantes = parseInt(document.getElementById('movPequenasEntrantes').value) || 0;
            const pequenasSalientes = parseInt(document.getElementById('movPequenasSalientes').value) || 0;
            const observaciones = document.getElementById('movObservaciones').value.trim();

            // Validar que haya al menos un movimiento
            if (grandesEntrantes === 0 && grandesSalientes === 0 && pequenasEntrantes === 0 && pequenasSalientes === 0) {
                alert('⚠️ Debe ingresar al menos una cantidad en algún campo');
                return;
            }

            // Validar que se haya seleccionado tipo de movimiento
            if (!tipo) {
                alert('⚠️ Debe seleccionar el tipo de movimiento');
                return;
            }

            const data = {
                tipoMovimiento: tipo,
                proveedorId: parseInt(proveedorId),
                saldoAnteriorGrandes,
                grandesEntrantes,
                grandesSalientes,
                saldoAnteriorPequenas,
                pequenasEntrantes,
                pequenasSalientes,
                observaciones
            };

            const response = await fetch(`/api/proveedores/${proveedorId}/movimientos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                alert('✅ Movimiento registrado exitosamente\n\n' + result.message);
                this.cerrarModalMovimiento();
                this.cargar();
            } else {
                alert('❌ Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error al registrar movimiento:', error);
            alert('❌ Error de conexión');
        }
    },

    // Ver historial de movimientos
    async verHistorial(proveedorId, nombreProveedor) {
        try {
            document.getElementById('modalHistorialProveedor').textContent = nombreProveedor;
            
            const tbody = document.getElementById('historialTableBody');
            tbody.innerHTML = '<tr><td colspan="7" class="loading-text">Cargando...</td></tr>';

            const modal = document.getElementById('modalHistorial');
            modal.classList.add('active');

            const response = await fetch(`/api/proveedores/${proveedorId}/movimientos`);
            const result = await response.json();

            if (result.success && result.data.length > 0) {
                const html = result.data.map(mov => {
                    const fecha = new Date(mov.FechaMovimiento);
                    const fechaFormato = fecha.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    const saldoFinal = mov.SaldoFinal || 
                        (mov.SaldoControlAnterior + mov.CharolasGrandesEntrantes - mov.CharolasGrandesSalientes +
                         mov.SaldoControlAnteriorPequenas + mov.CharolasPequenasEntrantes - mov.CharolasPequenasSalientes);

                    return `
                        <tr>
                            <td>${fechaFormato}</td>
                            <td style="color: var(--success-color); font-weight: bold;">${mov.CharolasGrandesEntrantes}</td>
                            <td style="color: var(--error-color); font-weight: bold;">${mov.CharolasGrandesSalientes}</td>
                            <td style="color: var(--success-color); font-weight: bold;">${mov.CharolasPequenasEntrantes}</td>
                            <td style="color: var(--error-color); font-weight: bold;">${mov.CharolasPequenasSalientes}</td>
                            <td><strong>${saldoFinal}</strong></td>
                            <td>${mov.UsuarioRegistro}</td>
                        </tr>
                    `;
                }).join('');

                tbody.innerHTML = html;
            } else {
                tbody.innerHTML = '<tr><td colspan="7" class="loading-text">No hay movimientos registrados</td></tr>';
            }
        } catch (error) {
            console.error('Error al cargar historial:', error);
            document.getElementById('historialTableBody').innerHTML = 
                '<tr><td colspan="7" class="loading-text" style="color: var(--error-color);">Error al cargar historial</td></tr>';
        }
    },

    // Cerrar modal de historial
    cerrarModalHistorial() {
        const modal = document.getElementById('modalHistorial');
        modal.classList.remove('active');
    },

    // Eliminar proveedor
    async eliminar(proveedorId, nombreProveedor) {
        // Verificar permisos
        if (!window.isAdmin || !window.isAdmin()) {
            alert('❌ No tienes permisos para eliminar proveedores. Solo administradores pueden realizar esta acción.');
            return;
        }

        if (!confirm(`¿Estás seguro de eliminar el proveedor "${nombreProveedor}"?\n\nEsto marcará el proveedor como inactivo.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/proveedores/${proveedorId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                alert('✅ Proveedor eliminado correctamente');
                this.cargar();
            } else {
                alert('❌ Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error al eliminar proveedor:', error);
            alert('❌ Error de conexión');
        }
    }
};

// Exportar para uso global
window.Proveedores = Proveedores;
