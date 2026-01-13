// ===================================
// MÓDULO: MOVIMIENTOS public/js/modules/movimientos.js
// Gestión completa de movimientos de charolas
// ===================================

const Movimientos = {
    rutaSeleccionada: null,
    clienteSeleccionado: null,
    clientes: [],

    // Inicializar módulo
    init() {
        console.log('Módulo Movimientos inicializado');
        this.cargar();
        this.setupEventListeners();
    },

    // Configurar event listeners
    setupEventListeners() {
        // Cerrar modales al hacer clic fuera
        window.addEventListener('click', (event) => {
            const modals = ['modalCrearMovimiento', 'modalHistorialCliente'];
            modals.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (modal && event.target === modal) {
                    this.cerrarModalCrear();
                    this.cerrarModalHistorial();
                }
            });
        });

        // Cerrar autocompletado al hacer clic fuera
        document.addEventListener('click', (event) => {
            const resultadosClientes = document.getElementById('resultadosClientes');
            if (resultadosClientes && !event.target.closest('#buscarCliente')) {
                resultadosClientes.style.display = 'none';
            }
        });
    },

    // Cargar movimientos
    async cargar() {
        try {
            const tbody = document.getElementById('movimientosTableBody');
            tbody.innerHTML = '<tr><td colspan="12" class="loading-text">Cargando...</td></tr>';
            
            const response = await fetch('/api/movimientos');
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
                    
                    const verificado = mov.Verificado ? 
                        '<span class="badge badge-success">✓ Sí</span>' : 
                        '<span class="badge badge-warning">✗ No</span>';
                    
                    const descG = mov.CantidadDescargada || 0;
                    const recG = mov.CantidadRecogida || 0;
                    const descP = mov.CantidadDescargadaPequenas || 0;
                    const recP = mov.CantidadRecogidaPequenas || 0;

                    const entregador = mov.EntregadorNombre || '-';

                    // Verificar si es administrador
                    const esAdmin = window.isAdmin && window.isAdmin();

                    return `
                        <tr>
                            <td>${fechaFormato}</td>
                            <td>${mov.NombreCliente}</td>
                            <td>${mov.NombreEstablecimiento}</td>
                            <td>${entregador}</td>
                            <td>${descG}</td>
                            <td>${recG}</td>
                            <td>${descP}</td>
                            <td>${recP}</td>
                            <td><strong>${mov.SaldoReportado || 0}G / ${mov.SaldoReportadoPequenas || 0}P</strong></td>
                            <td>${verificado}</td>
                            <td>${mov.UsuarioRegistro}</td>
                            <td>
                                <div class="table-actions">
                                    <button class="btn-action info" onclick="Movimientos.verHistorial('${mov.CodigoCliente}')" title="Ver historial">
                                        👁️
                                    </button>
                                    ${esAdmin ? `
                                    <button class="btn-action danger" onclick="Movimientos.eliminarMovimiento(${mov.ControlID})" title="Eliminar movimiento">
                                        🗑️
                                    </button>
                                    ` : ''}
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');
                
                tbody.innerHTML = html;
            } else {
                tbody.innerHTML = '<tr><td colspan="12" class="loading-text">No hay movimientos disponibles</td></tr>';
            }
        } catch (error) {
            console.error('Error al cargar movimientos:', error);
            document.getElementById('movimientosTableBody').innerHTML = 
                '<tr><td colspan="12" class="loading-text" style="color: var(--error-color);">Error al cargar datos</td></tr>';
        }
    },

    // Mostrar modal de crear movimiento
    async mostrarModalCrear() {
        // Resetear formulario
        const form = document.getElementById('formCrearMovimiento');
        const infoRuta = document.getElementById('infoRuta');
        const infoCliente = document.getElementById('infoCliente');
        const alertaMovimiento = document.getElementById('alertaMovimiento');
        const clienteSeleccionado = document.getElementById('clienteSeleccionado');
        
        if (form) form.reset();
        if (infoRuta) infoRuta.style.display = 'none';
        if (infoCliente) infoCliente.style.display = 'none';
        if (alertaMovimiento) alertaMovimiento.style.display = 'none';
        if (clienteSeleccionado) clienteSeleccionado.value = '';
        
        this.rutaSeleccionada = null;
        this.clienteSeleccionado = null;

        // Cargar rutas activas
        await this.cargarRutasActivas();

        // Mostrar modal
        document.getElementById('modalCrearMovimiento').classList.add('active');
    },

    // Cargar rutas activas
    async cargarRutasActivas() {
        try {
            const response = await fetch('/api/rutas?estado=Iniciada');
            const result = await response.json();

            const select = document.getElementById('rutaMovimiento');
            select.innerHTML = '<option value="">Seleccione una ruta activa</option>';

            if (result.success && result.data.length > 0) {
                result.data.forEach(ruta => {
                    const option = document.createElement('option');
                    option.value = ruta.InicioRutaID;
                    option.textContent = `${ruta.CodigoRuta} - ${ruta.EntregadorNombre || ruta.EntregadorID} (${ruta.CharolasGrandesActuales || ruta.CharolasGrandesInicio}G, ${ruta.CharolasPequenasActuales || ruta.CharolasPequenasInicio}P)`;
                    option.dataset.ruta = JSON.stringify(ruta);
                    select.appendChild(option);
                });
            } else {
                select.innerHTML = '<option value="">No hay rutas activas disponibles</option>';
            }
        } catch (error) {
            console.error('Error al cargar rutas activas:', error);
        }
    },

    // Seleccionar ruta
    seleccionarRuta() {
        const select = document.getElementById('rutaMovimiento');
        if (!select) return;
        
        const option = select.options[select.selectedIndex];

        if (option.value) {
            this.rutaSeleccionada = JSON.parse(option.dataset.ruta);
            
            // Mostrar información de la ruta
            const infoEntregador = document.getElementById('infoEntregador');
            const infoCharolasG = document.getElementById('infoCharolasG');
            const infoCharolasP = document.getElementById('infoCharolasP');
            const infoRuta = document.getElementById('infoRuta');
            
            if (infoEntregador) infoEntregador.textContent = this.rutaSeleccionada.EntregadorNombre || this.rutaSeleccionada.EntregadorID;
            if (infoCharolasG) infoCharolasG.textContent = this.rutaSeleccionada.CharolasGrandesActuales || this.rutaSeleccionada.CharolasGrandesInicio;
            if (infoCharolasP) infoCharolasP.textContent = this.rutaSeleccionada.CharolasPequenasActuales || this.rutaSeleccionada.CharolasPequenasInicio;
            if (infoRuta) infoRuta.style.display = 'block';

            // Calcular saldos
            this.calcularSaldos();
        } else {
            this.rutaSeleccionada = null;
            const infoRuta = document.getElementById('infoRuta');
            if (infoRuta) infoRuta.style.display = 'none';
        }
    },

    // Buscar cliente
    async buscarCliente(query) {
        if (query.length < 2) {
            const div = document.getElementById('resultadosClientes');
            if (div) div.style.display = 'none';
            return;
        }

        try {
            const response = await fetch(`/api/clientes/buscar?q=${encodeURIComponent(query)}`);
            const result = await response.json();

            const div = document.getElementById('resultadosClientes');
            if (!div) return;

            if (result.success && result.data.length > 0) {
                const html = result.data.map(cliente => `
                    <div class="autocomplete-item" onclick="Movimientos.seleccionarCliente('${cliente.CodigoCliente}')">
                        <strong>${cliente.NombreCliente}</strong> - ${cliente.CodigoCliente}
                        <br>
                        <small>${cliente.NombreEstablecimiento}</small>
                    </div>
                `).join('');

                div.innerHTML = html;
                div.style.display = 'block';
                this.clientes = result.data;
            } else {
                div.innerHTML = '<div class="autocomplete-item">No se encontraron clientes</div>';
                div.style.display = 'block';
            }
        } catch (error) {
            console.error('Error al buscar clientes:', error);
        }
    },

    // Seleccionar cliente
    async seleccionarCliente(codigoCliente) {
        const cliente = this.clientes.find(c => c.CodigoCliente === codigoCliente);
        
        if (cliente) {
            this.clienteSeleccionado = cliente;
            
            const buscarCliente = document.getElementById('buscarCliente');
            const clienteSeleccionadoInput = document.getElementById('clienteSeleccionado');
            const resultadosClientes = document.getElementById('resultadosClientes');
            const infoClienteCodigo = document.getElementById('infoClienteCodigo');
            const infoEstablecimiento = document.getElementById('infoEstablecimiento');
            const infoVendedor = document.getElementById('infoVendedor');
            const infoCliente = document.getElementById('infoCliente');
            
            if (buscarCliente) buscarCliente.value = `${cliente.NombreCliente} (${cliente.CodigoCliente})`;
            if (clienteSeleccionadoInput) clienteSeleccionadoInput.value = cliente.CodigoCliente;
            if (resultadosClientes) resultadosClientes.style.display = 'none';

            // Mostrar información del cliente
            if (infoClienteCodigo) infoClienteCodigo.textContent = cliente.CodigoCliente;
            if (infoEstablecimiento) infoEstablecimiento.textContent = cliente.NombreEstablecimiento;
            if (infoVendedor) infoVendedor.textContent = cliente.Vendedor;
            if (infoCliente) infoCliente.style.display = 'block';

            // Obtener saldo anterior del cliente
            await this.obtenerSaldoAnterior(cliente.CodigoCliente);
        }
    },

    // Obtener saldo anterior del cliente
    async obtenerSaldoAnterior(codigoCliente) {
        try {
            const response = await fetch(`/api/clientes/${codigoCliente}/saldo-anterior`);
            const result = await response.json();

            const saldoAnteriorG = document.getElementById('saldoAnteriorG');
            const saldoAnteriorP = document.getElementById('saldoAnteriorP');
            
            if (!saldoAnteriorG || !saldoAnteriorP) return;

            if (result.success && result.data) {
                saldoAnteriorG.value = result.data.saldoGrandes || 0;
                saldoAnteriorP.value = result.data.saldoPequenas || 0;
            } else {
                saldoAnteriorG.value = 0;
                saldoAnteriorP.value = 0;
            }

            // Calcular saldos
            this.calcularSaldos();
        } catch (error) {
            console.error('Error al obtener saldo anterior:', error);
            const saldoAnteriorG = document.getElementById('saldoAnteriorG');
            const saldoAnteriorP = document.getElementById('saldoAnteriorP');
            if (saldoAnteriorG) saldoAnteriorG.value = 0;
            if (saldoAnteriorP) saldoAnteriorP.value = 0;
        }
    },

    // Calcular saldos en tiempo real
    calcularSaldos() {
        // Validar que haya ruta seleccionada
        if (!this.rutaSeleccionada) {
            const alerta = document.getElementById('alertaMovimiento');
            const alertaMensaje = document.getElementById('alertaMovimientoMensaje');
            const submitButton = document.getElementById('btnGuardarMovimiento');
            
            if (alerta && alertaMensaje && submitButton) {
                alerta.className = 'alerta-bodega error';
                alerta.style.display = 'flex';
                alertaMensaje.innerHTML = '⚠️ Por favor seleccione una ruta activa';
                submitButton.disabled = true;
                submitButton.style.opacity = '0.5';
            }
            return;
        }

        // Validar que haya cliente seleccionado
        if (!this.clienteSeleccionado) {
            const alerta = document.getElementById('alertaMovimiento');
            const alertaMensaje = document.getElementById('alertaMovimientoMensaje');
            const submitButton = document.getElementById('btnGuardarMovimiento');
            
            if (alerta && alertaMensaje && submitButton) {
                alerta.className = 'alerta-bodega error';
                alerta.style.display = 'flex';
                alertaMensaje.innerHTML = '⚠️ Por favor busque y seleccione un cliente';
                submitButton.disabled = true;
                submitButton.style.opacity = '0.5';
            }
            return;
        }

        // GRANDES
        const saldoAnteriorGElem = document.getElementById('saldoAnteriorG');
        const descargadasGElem = document.getElementById('descargadasG');
        const recogidasGElem = document.getElementById('recogidasG');
        const saldoActualGElem = document.getElementById('saldoActualG');
        const rutaDespuesGElem = document.getElementById('rutaDespuesG');
        
        if (!saldoAnteriorGElem || !descargadasGElem || !recogidasGElem || !saldoActualGElem || !rutaDespuesGElem) {
            console.error('Faltan elementos del DOM para charolas grandes');
            return;
        }
        
        const saldoAntG = parseInt(saldoAnteriorGElem.value) || 0;
        const descG = parseInt(descargadasGElem.value) || 0;
        const recG = parseInt(recogidasGElem.value) || 0;

        const saldoActualG = saldoAntG + descG - recG;
        const charolasRutaG = this.rutaSeleccionada.CharolasGrandesActuales || this.rutaSeleccionada.CharolasGrandesInicio || 0;
        const rutaDespuesG = charolasRutaG - descG + recG;

        saldoActualGElem.textContent = saldoActualG;
        rutaDespuesGElem.textContent = rutaDespuesG;

        // PEQUEÑAS
        const saldoAnteriorPElem = document.getElementById('saldoAnteriorP');
        const descargadasPElem = document.getElementById('descargadasP');
        const recogidasPElem = document.getElementById('recogidasP');
        const saldoActualPElem = document.getElementById('saldoActualP');
        const rutaDespuesPElem = document.getElementById('rutaDespuesP');
        
        if (!saldoAnteriorPElem || !descargadasPElem || !recogidasPElem || !saldoActualPElem || !rutaDespuesPElem) {
            console.error('Faltan elementos del DOM para charolas pequeñas');
            return;
        }
        
        const saldoAntP = parseInt(saldoAnteriorPElem.value) || 0;
        const descP = parseInt(descargadasPElem.value) || 0;
        const recP = parseInt(recogidasPElem.value) || 0;

        const saldoActualP = saldoAntP + descP - recP;
        const charolasRutaP = this.rutaSeleccionada.CharolasPequenasActuales || this.rutaSeleccionada.CharolasPequenasInicio || 0;
        const rutaDespuesP = charolasRutaP - descP + recP;

        saldoActualPElem.textContent = saldoActualP;
        rutaDespuesPElem.textContent = rutaDespuesP;

        // VALIDACIONES
        const alerta = document.getElementById('alertaMovimiento');
        const alertaMensaje = document.getElementById('alertaMovimientoMensaje');
        const submitButton = document.getElementById('btnGuardarMovimiento');
        
        if (!alerta || !alertaMensaje || !submitButton) {
            console.error('Faltan elementos del DOM para alertas');
            return;
        }

        let hayError = false;
        let mensajesError = [];

        // Validar que no descargue más de lo que tiene
        if (descG > charolasRutaG) {
            hayError = true;
            mensajesError.push(`Charolas Grandes: El entregador solo tiene ${charolasRutaG}, no puede descargar ${descG}`);
        }

        if (descP > charolasRutaP) {
            hayError = true;
            mensajesError.push(`Charolas Pequeñas: El entregador solo tiene ${charolasRutaP}, no puede descargar ${descP}`);
        }

        // Validar saldos negativos
        if (rutaDespuesG < 0) {
            hayError = true;
            mensajesError.push(`Charolas Grandes en ruta quedarían negativas: ${rutaDespuesG}`);
        }

        if (rutaDespuesP < 0) {
            hayError = true;
            mensajesError.push(`Charolas Pequeñas en ruta quedarían negativas: ${rutaDespuesP}`);
        }

        if (hayError) {
            alerta.className = 'alerta-bodega error';
            alerta.style.display = 'flex';
            alertaMensaje.innerHTML = mensajesError.join('<br>');
            submitButton.disabled = true;
            submitButton.style.opacity = '0.5';
        } else {
            // Mostrar preview de éxito
            alerta.className = 'alerta-bodega success';
            alerta.style.display = 'flex';
            alertaMensaje.innerHTML = `✅ OK. Ruta quedará con ${rutaDespuesG}G y ${rutaDespuesP}P. Cliente tendrá ${saldoActualG}G y ${saldoActualP}P`;
            submitButton.disabled = false;
            submitButton.style.opacity = '1';
        }
    },

    // Guardar movimiento
    async guardarMovimiento(event) {
        event.preventDefault();

        if (!this.rutaSeleccionada || !this.clienteSeleccionado) {
            alert('⚠️ Por favor seleccione una ruta y un cliente');
            return;
        }

        try {
            const formData = {
                rutaID: this.rutaSeleccionada.InicioRutaID,
                codigoCliente: this.clienteSeleccionado.CodigoCliente,
                
                // Grandes
                saldoAnteriorG: parseInt(document.getElementById('saldoAnteriorG').value) || 0,
                descargadasG: parseInt(document.getElementById('descargadasG').value) || 0,
                recogidasG: parseInt(document.getElementById('recogidasG').value) || 0,
                saldoActualG: parseInt(document.getElementById('saldoActualG').textContent) || 0,

                // Pequeñas
                saldoAnteriorP: parseInt(document.getElementById('saldoAnteriorP').value) || 0,
                descargadasP: parseInt(document.getElementById('descargadasP').value) || 0,
                recogidasP: parseInt(document.getElementById('recogidasP').value) || 0,
                saldoActualP: parseInt(document.getElementById('saldoActualP').textContent) || 0,

                verificado: document.getElementById('verificado').checked
            };

            const response = await fetch('/api/movimientos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                alert('✅ Movimiento guardado exitosamente\n\n' + result.message);
                this.cerrarModalCrear();
                this.cargar();
            } else {
                alert('❌ Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error al guardar movimiento:', error);
            alert('❌ Error de conexión');
        }
    },

    // Ver historial de cliente
    async verHistorial(codigoCliente) {
        try {
            const response = await fetch(`/api/clientes/${codigoCliente}/historial`);
            const result = await response.json();

            const div = document.getElementById('historialClienteContent');

            if (result.success && result.data) {
                const cliente = result.data.cliente;
                const movimientos = result.data.movimientos;

                const html = `
                    <div class="info-panel">
                        <h4>🏪 ${cliente.NombreCliente}</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Código:</label>
                                <span>${cliente.CodigoCliente}</span>
                            </div>
                            <div class="info-item">
                                <label>Establecimiento:</label>
                                <span>${cliente.NombreEstablecimiento}</span>
                            </div>
                            <div class="info-item">
                                <label>Vendedor:</label>
                                <span>${cliente.Vendedor}</span>
                            </div>
                        </div>
                    </div>

                    <h4>📊 Historial de Movimientos (${movimientos.length})</h4>
                    <div style="overflow-x: auto;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Desc G</th>
                                    <th>Rec G</th>
                                    <th>Desc P</th>
                                    <th>Rec P</th>
                                    <th>Saldo</th>
                                    <th>Usuario</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${movimientos.map(m => {
                                    const fecha = new Date(m.FechaMovimiento).toLocaleDateString('es-ES', {
                                        day: '2-digit', month: '2-digit', year: '2-digit',
                                        hour: '2-digit', minute: '2-digit'
                                    });
                                    return `
                                        <tr>
                                            <td>${fecha}</td>
                                            <td>${m.CantidadDescargada || 0}</td>
                                            <td>${m.CantidadRecogida || 0}</td>
                                            <td>${m.CantidadDescargadaPequenas || 0}</td>
                                            <td>${m.CantidadRecogidaPequenas || 0}</td>
                                            <td><strong>${m.SaldoReportado || 0}G / ${m.SaldoReportadoPequenas || 0}P</strong></td>
                                            <td>${m.UsuarioRegistro}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div class="info-panel" style="margin-top: 20px;">
                        <h4>📈 Resumen</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Total Descargadas Grandes:</label>
                                <span>${result.data.resumen.totalDescargadasG}</span>
                            </div>
                            <div class="info-item">
                                <label>Total Recogidas Grandes:</label>
                                <span>${result.data.resumen.totalRecogidasG}</span>
                            </div>
                            <div class="info-item">
                                <label>Saldo Actual Grandes:</label>
                                <span><strong>${result.data.resumen.saldoActualG}</strong></span>
                            </div>
                            <div class="info-item">
                                <label>Total Descargadas Pequeñas:</label>
                                <span>${result.data.resumen.totalDescargadasP}</span>
                            </div>
                            <div class="info-item">
                                <label>Total Recogidas Pequeñas:</label>
                                <span>${result.data.resumen.totalRecogidasP}</span>
                            </div>
                            <div class="info-item">
                                <label>Saldo Actual Pequeñas:</label>
                                <span><strong>${result.data.resumen.saldoActualP}</strong></span>
                            </div>
                        </div>
                    </div>
                `;

                div.innerHTML = html;
            } else {
                div.innerHTML = '<p>No se encontró información del cliente</p>';
            }

            document.getElementById('modalHistorialCliente').classList.add('active');
        } catch (error) {
            console.error('Error al obtener historial:', error);
        }
    },

    // Cerrar modales
    cerrarModalCrear() {
        document.getElementById('modalCrearMovimiento').classList.remove('active');
        document.getElementById('formCrearMovimiento').reset();
        this.rutaSeleccionada = null;
        this.clienteSeleccionado = null;
    },

    cerrarModalHistorial() {
        document.getElementById('modalHistorialCliente').classList.remove('active');
    },

    // Eliminar movimiento (solo administradores)
    async eliminarMovimiento(controlID) {
        // Verificar permisos
        if (!window.isAdmin || !window.isAdmin()) {
            alert('❌ No tienes permisos para eliminar movimientos. Solo administradores pueden realizar esta acción.');
            return;
        }

        // Confirmar eliminación
        if (!confirm(`⚠️ ¿Estás seguro de eliminar este movimiento?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/movimientos/${controlID}`, {
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
            console.error('Error al eliminar movimiento:', error);
            alert('❌ Error al eliminar movimiento');
        }
    }
};

// Exportar para uso global
window.Movimientos = Movimientos;
