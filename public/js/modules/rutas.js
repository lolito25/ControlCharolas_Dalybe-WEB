// ===================================
// MÓDULO DE RUTAS public/js/modules/rutas.js
// Gestión de rutas de entrega
// ===================================

const Rutas = {
    rutaActual: null,
    bodegaDisponible: { grandes: 0, pequenas: 0 },

    // Inicializar módulo
    init() {
        console.log('Módulo Rutas inicializado');
        this.cargar();
        this.cargarEntregadores();
        this.setupEventListeners();
    },

    // Configurar event listeners
    setupEventListeners() {
        // Form de iniciar ruta
        const formRuta = document.getElementById('formNuevaRuta');
        if (formRuta) {
            formRuta.onsubmit = (e) => {
                e.preventDefault();
                this.iniciarRuta();
            };
        }

        // Cerrar modales al hacer clic fuera
        window.addEventListener('click', (event) => {
            const modals = ['modalNuevaRuta', 'modalCrearEntregador', 'modalFinalizarRuta'];
            modals.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (event.target === modal) {
                    this.cerrarModal();
                    this.cerrarModalEntregador();
                    this.cerrarModalFinalizar();
                }
            });
        });
    },

    // Cargar lista de rutas
    async cargar() {
        try {
            const tbody = document.getElementById('rutasTableBody');
            tbody.innerHTML = '<tr><td colspan="8" class="loading-text">Cargando...</td></tr>';

            // Obtener filtros
            const estado = document.getElementById('filtroEstadoRuta').value;
            const fecha = document.getElementById('filtroFechaRuta').value;

            // Construir query params
            let queryParams = new URLSearchParams();
            if (estado) queryParams.append('estado', estado);
            if (fecha) queryParams.append('fecha', fecha);

            const response = await fetch(`/api/rutas?${queryParams}`);
            const result = await response.json();

            if (result.success && result.data.length > 0) {
                const html = result.data.map(ruta => {
                    const fecha = new Date(ruta.FechaInicio);
                    const fechaFormato = fecha.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    // Badge de estado
                    let estadoBadge = '';
                    if (ruta.EstadoRuta === 'Iniciada') {
                        estadoBadge = '<span class="badge badge-warning">🟡 Iniciada</span>';
                    } else if (ruta.EstadoRuta === 'Finalizada') {
                        estadoBadge = '<span class="badge badge-success">🟢 Finalizada</span>';
                    }

                    // Botón finalizar solo si está iniciada
                    let btnFinalizar = '';
                    if (ruta.EstadoRuta === 'Iniciada') {
                        btnFinalizar = `
                            <button class="btn-action success" onclick="Rutas.mostrarModalFinalizarRuta(${ruta.InicioRutaID}, '${ruta.CodigoRuta}', '${ruta.EntregadorNombre || ruta.EntregadorID}', ${ruta.CharolasGrandesInicio}, ${ruta.CharolasPequenasInicio})" title="Finalizar ruta">
                                🏁
                            </button>
                        `;
                    }

                    return `
                        <tr>
                            <td><strong>${ruta.CodigoRuta}</strong></td>
                            <td>${ruta.NombreRuta}</td>
                            <td>${ruta.EntregadorNombre || ruta.EntregadorID}</td>
                            <td>${fechaFormato}</td>
                            <td>${ruta.CharolasGrandesInicio}</td>
                            <td>${ruta.CharolasPequenasInicio}</td>
                            <td>${estadoBadge}</td>
                            <td>
                                <div class="table-actions">
                                    <button class="btn-action info" onclick="Rutas.verMovimientos(${ruta.InicioRutaID})" title="Ver movimientos de la ruta">
                                        📊
                                    </button>
                                    <button class="btn-action secondary" onclick="Rutas.descargarExcelRuta(${ruta.InicioRutaID}, '${ruta.CodigoRuta}')" title="Descargar Excel de la ruta">
                                        📥
                                    </button>
                                    ${window.isAdmin && window.isAdmin() ? `
                                    <button class="btn-action danger" onclick="Rutas.eliminarRuta(${ruta.InicioRutaID}, '${ruta.CodigoRuta}')" title="Eliminar ruta">
                                        🗑️
                                    </button>
                                    ` : ''}
                                    ${btnFinalizar}
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');

                tbody.innerHTML = html;
            } else {
                tbody.innerHTML = '<tr><td colspan="8" class="loading-text">No hay rutas disponibles</td></tr>';
            }
        } catch (error) {
            console.error('Error al cargar rutas:', error);
            document.getElementById('rutasTableBody').innerHTML =
                '<tr><td colspan="8" class="loading-text" style="color: var(--error-color);">Error al cargar datos</td></tr>';
        }
    },

    // Cargar entregadores para el select
    async cargarEntregadores() {
        try {
            const response = await fetch('/api/entregadores');
            const result = await response.json();

            const select = document.getElementById('entregadorRuta');
            select.innerHTML = '<option value="">Seleccione un entregador</option>';

            if (result.success && result.data.length > 0) {
                result.data.forEach(entregador => {
                    const option = document.createElement('option');
                    option.value = entregador.EntregadorID;
                    option.textContent = `${entregador.Nombre} ${entregador.Apellido || ''}`.trim();
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error al cargar entregadores:', error);
        }
    },

    // Mostrar modal de iniciar ruta
    async mostrarModalNueva() {
        // Obtener bodega disponible
        try {
            const response = await fetch('/api/bodega');
            const result = await response.json();

            if (result.success && result.data) {
                const bodegaGrandes = result.data.CharolasGrandesBodega || 0;
                const bodegaPequenas = result.data.CharolasPequenasBodega || 0;

                this.bodegaDisponible = { grandes: bodegaGrandes, pequenas: bodegaPequenas };

                // Guardar en campos ocultos
                document.getElementById('rutaBodegaGrandes').value = bodegaGrandes;
                document.getElementById('rutaBodegaPequenas').value = bodegaPequenas;

                // Mostrar en el modal
                document.getElementById('bodegaRutaGrandes').textContent = bodegaGrandes;
                document.getElementById('bodegaRutaPequenas').textContent = bodegaPequenas;
                document.getElementById('bodegaRutaTotal').textContent = bodegaGrandes + bodegaPequenas;
            } else {
                this.bodegaDisponible = { grandes: 0, pequenas: 0 };
            }
        } catch (error) {
            console.error('Error al obtener bodega:', error);
            this.bodegaDisponible = { grandes: 0, pequenas: 0 };
        }

        // Resetear formulario
        document.getElementById('formNuevaRuta').reset();
        
        // Establecer fecha actual
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localISOTime = new Date(now - offset).toISOString().slice(0, 16);
        document.getElementById('fechaInicioRuta').value = localISOTime;

        // Ocultar alerta
        document.getElementById('alertaBodegaRuta').style.display = 'none';

        // Mostrar modal
        const modal = document.getElementById('modalNuevaRuta');
        modal.classList.add('active');
    },

    // Validar bodega en tiempo real
    validarBodega() {
        const grandesInicio = parseInt(document.getElementById('charolasGrandesInicio').value) || 0;
        const pequenasInicio = parseInt(document.getElementById('charolasPequenasInicio').value) || 0;

        const bodegaGrandes = this.bodegaDisponible.grandes;
        const bodegaPequenas = this.bodegaDisponible.pequenas;

        const alerta = document.getElementById('alertaBodegaRuta');
        const alertaMensaje = document.getElementById('alertaBodegaRutaMensaje');
        const submitButton = document.getElementById('btnIniciarRuta');

        let hayError = false;
        let mensajesError = [];

        // Validar que no se intente sacar más de lo que hay en bodega
        if (grandesInicio > bodegaGrandes) {
            hayError = true;
            const faltante = grandesInicio - bodegaGrandes;
            mensajesError.push(`Charolas Grandes: Intentas sacar ${grandesInicio}, solo hay ${bodegaGrandes} en bodega. Faltan: ${faltante}`);
        }

        if (pequenasInicio > bodegaPequenas) {
            hayError = true;
            const faltante = pequenasInicio - bodegaPequenas;
            mensajesError.push(`Charolas Pequeñas: Intentas sacar ${pequenasInicio}, solo hay ${bodegaPequenas} en bodega. Faltan: ${faltante}`);
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
            const nuevaBodegaGrandes = bodegaGrandes - grandesInicio;
            const nuevaBodegaPequenas = bodegaPequenas - pequenasInicio;

            if (grandesInicio > 0 || pequenasInicio > 0) {
                alerta.className = 'alerta-bodega success';
                alerta.style.display = 'flex';
                alertaMensaje.innerHTML = `✅ Bodega OK. Después de iniciar la ruta quedará: ${nuevaBodegaGrandes} grandes, ${nuevaBodegaPequenas} pequeñas`;
            } else {
                alerta.style.display = 'none';
            }

            submitButton.disabled = false;
            submitButton.style.opacity = '1';
            submitButton.style.cursor = 'pointer';
        }
    },

    // Iniciar ruta
    async iniciarRuta() {
        try {
            const formData = {
                codigoRuta: document.getElementById('codigoRuta').value.trim(),
                nombreRuta: document.getElementById('nombreRuta').value.trim(),
                entregadorID: parseInt(document.getElementById('entregadorRuta').value),
                fechaInicio: document.getElementById('fechaInicioRuta').value,
                charolasGrandesInicio: parseInt(document.getElementById('charolasGrandesInicio').value) || 0,
                charolasPequenasInicio: parseInt(document.getElementById('charolasPequenasInicio').value) || 0,
                observaciones: document.getElementById('observacionesRuta').value.trim()
            };

            // Validaciones
            if (!formData.codigoRuta || !formData.nombreRuta) {
                alert('⚠️ Por favor complete todos los campos obligatorios');
                return;
            }

            if (!formData.entregadorID) {
                alert('⚠️ Por favor seleccione un entregador');
                return;
            }

            if (formData.charolasGrandesInicio === 0 && formData.charolasPequenasInicio === 0) {
                alert('⚠️ Debe ingresar al menos una cantidad de charolas');
                return;
            }

            const response = await fetch('/api/rutas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                alert('✅ Ruta iniciada exitosamente\n\n' + result.message);
                this.cerrarModal();
                this.cargar();
            } else {
                alert('❌ Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error al iniciar ruta:', error);
            alert('❌ Error de conexión');
        }
    },

    // Mostrar modal de crear entregador
    mostrarModalCrearEntregador() {
        document.getElementById('formCrearEntregador').reset();
        const modal = document.getElementById('modalCrearEntregador');
        modal.classList.add('active');
    },

    // Crear entregador
    async crearEntregador(event) {
        event.preventDefault();

        try {
            const formData = {
                nombre: document.getElementById('nombreEntregador').value.trim(),
                apellido: document.getElementById('apellidoEntregador').value.trim(),
                telefono: document.getElementById('telefonoEntregador').value.trim()
            };

            if (!formData.nombre || !formData.apellido) {
                alert('⚠️ Por favor complete nombre y apellido');
                return;
            }

            const response = await fetch('/api/entregadores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                alert(`✅ Entregador creado exitosamente\nCódigo: ${result.data.codigo}`);
                this.cerrarModalEntregador();
                this.cargarEntregadores();
                
                // Seleccionar automáticamente el entregador recién creado
                document.getElementById('entregadorRuta').value = result.data.id;
            } else {
                alert('❌ Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error al crear entregador:', error);
            alert('❌ Error de conexión');
        }
    },

    // Mostrar modal de finalizar ruta
    async mostrarModalFinalizarRuta(rutaId, codigoRuta, entregador, grandesSalieron, pequenasSalieron) {
        this.rutaActual = {
            id: rutaId,
            codigo: codigoRuta,
            entregador: entregador,
            grandesSalieron: grandesSalieron,
            pequenasSalieron: pequenasSalieron
        };

        // Establecer valores en el modal
        document.getElementById('finalizarRutaID').value = rutaId;
        document.getElementById('finalizarCodigoRuta').textContent = codigoRuta;
        document.getElementById('finalizarEntregador').textContent = entregador;
        document.getElementById('finalizarGrandesSalieron').textContent = grandesSalieron;
        document.getElementById('finalizarPequenasSalieron').textContent = pequenasSalieron;
        document.getElementById('finalizarTotalSalieron').textContent = grandesSalieron + pequenasSalieron;

        // Resetear campos de entrada
        document.getElementById('finalizarGrandesRegresan').value = 0;
        document.getElementById('finalizarPequenasRegresan').value = 0;

        // Calcular diferencia inicial
        this.calcularDiferencia();

        // Mostrar modal
        const modal = document.getElementById('modalFinalizarRuta');
        modal.classList.add('active');
    },

    // Calcular diferencia al finalizar ruta
    calcularDiferencia() {
        const grandesSalieron = this.rutaActual.grandesSalieron;
        const pequenasSalieron = this.rutaActual.pequenasSalieron;

        const grandesRegresan = parseInt(document.getElementById('finalizarGrandesRegresan').value) || 0;
        const pequenasRegresan = parseInt(document.getElementById('finalizarPequenasRegresan').value) || 0;

        const diferenciaGrandes = grandesSalieron - grandesRegresan;
        const diferenciaPequenas = pequenasSalieron - pequenasRegresan;
        const diferenciaTotal = diferenciaGrandes + diferenciaPequenas;

        document.getElementById('finalizarDiferenciaGrandes').textContent = diferenciaGrandes;
        document.getElementById('finalizarDiferenciaPequenas').textContent = diferenciaPequenas;
        document.getElementById('finalizarDiferenciaTotal').textContent = diferenciaTotal;

        // Mensaje explicativo
        const mensaje = document.getElementById('finalizarMensaje');
        if (grandesRegresan > grandesSalieron || pequenasRegresan > pequenasSalieron) {
            mensaje.textContent = '✅ El entregador regresa con más charolas (recogió de clientes)';
            mensaje.style.color = 'var(--success-color)';
        } else if (diferenciaTotal > 0) {
            mensaje.textContent = `📦 Se entregaron/perdieron ${diferenciaTotal} charolas en total`;
            mensaje.style.color = 'var(--primary-color)';
        } else if (diferenciaTotal === 0) {
            mensaje.textContent = '🔄 El entregador regresa con todas las charolas que salieron';
            mensaje.style.color = 'var(--text-medium)';
        } else {
            mensaje.textContent = '✅ El entregador regresa con más charolas de las que salieron';
            mensaje.style.color = 'var(--success-color)';
        }
    },

    // Finalizar ruta
    async finalizarRuta(event) {
        event.preventDefault();

        try {
            const rutaId = document.getElementById('finalizarRutaID').value;
            const grandesRegresan = parseInt(document.getElementById('finalizarGrandesRegresan').value) || 0;
            const pequenasRegresan = parseInt(document.getElementById('finalizarPequenasRegresan').value) || 0;

            const formData = {
                charolasGrandesRegresan: grandesRegresan,
                charolasPequenasRegresan: pequenasRegresan
            };

            const response = await fetch(`/api/rutas/${rutaId}/finalizar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                alert('✅ Ruta finalizada exitosamente\n\n' + result.message);
                this.cerrarModalFinalizar();
                this.cargar();
            } else {
                alert('❌ Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error al finalizar ruta:', error);
            alert('❌ Error de conexión');
        }
    },

    // Limpiar filtros
    limpiarFiltros() {
        document.getElementById('filtroEstadoRuta').value = '';
        document.getElementById('filtroFechaRuta').value = '';
        this.cargar();
    },

    // Cerrar modales
    cerrarModal() {
        const modal = document.getElementById('modalNuevaRuta');
        modal.classList.remove('active');
        document.getElementById('formNuevaRuta').reset();
    },

    cerrarModalEntregador() {
        const modal = document.getElementById('modalCrearEntregador');
        modal.classList.remove('active');
        document.getElementById('formCrearEntregador').reset();
    },

    cerrarModalFinalizar() {
        const modal = document.getElementById('modalFinalizarRuta');
        modal.classList.remove('active');
        document.getElementById('formFinalizarRuta').reset();
        this.rutaActual = null;
    },

    // Ver movimientos de una ruta
    async verMovimientos(rutaId) {
        try {
            const response = await fetch(`/api/rutas/${rutaId}/movimientos`);
            const result = await response.json();

            if (result.success && result.data) {
                const { ruta, movimientos, resumen } = result.data;

                const estadoBadge = ruta.EstadoRuta === 'Iniciada' 
                    ? '<span class="badge badge-warning">🟡 Iniciada</span>' 
                    : '<span class="badge badge-success">🟢 Finalizada</span>';

                const fechaInicio = new Date(ruta.FechaInicio).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                let fechaFin = '-';
                if (ruta.FechaFinalizacion) {
                    fechaFin = new Date(ruta.FechaFinalizacion).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }

                let movimientosHTML = '';
                if (movimientos.length > 0) {
                    movimientosHTML = `
                        <div class="table-container" style="margin-top: 20px;">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Cliente / Establecimiento</th>
                                        <th>Hora</th>
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
                                        const hora = new Date(m.FechaMovimiento).toLocaleTimeString('es-ES', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        });
                                        return `
                                            <tr>
                                                <td>
                                                    <strong>${m.NombreCliente}</strong>
                                                    <br>
                                                    <small style="color: var(--text-medium);">${m.NombreEstablecimiento}</small>
                                                </td>
                                                <td>${hora}</td>
                                                <td>${m.CantidadDescargada || 0}</td>
                                                <td>${m.CantidadRecogida || 0}</td>
                                                <td>${m.CantidadDescargadaPequenas || 0}</td>
                                                <td>${m.CantidadRecogidaPequenas || 0}</td>
                                                <td>
                                                    <strong>${m.SaldoReportado || 0}G</strong><br>
                                                    <strong>${m.SaldoReportadoPequenas || 0}P</strong>
                                                </td>
                                                <td>${m.UsuarioRegistro}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                } else {
                    movimientosHTML = `
                        <div class="info-panel" style="margin-top: 20px; text-align: center;">
                            <p style="color: var(--text-medium);">
                                📋 No hay movimientos registrados para esta ruta
                            </p>
                        </div>
                    `;
                }

                const html = `
                    <div class="info-panel">
                        <h4>📋 Información de la Ruta</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Código:</label>
                                <span><strong>${ruta.CodigoRuta}</strong></span>
                            </div>
                            <div class="info-item">
                                <label>Nombre:</label>
                                <span>${ruta.NombreRuta}</span>
                            </div>
                            <div class="info-item">
                                <label>Entregador:</label>
                                <span>${ruta.EntregadorNombre}</span>
                            </div>
                            <div class="info-item">
                                <label>Estado:</label>
                                <span>${estadoBadge}</span>
                            </div>
                            <div class="info-item">
                                <label>Fecha Inicio:</label>
                                <span>${fechaInicio}</span>
                            </div>
                            <div class="info-item">
                                <label>Fecha Fin:</label>
                                <span>${fechaFin}</span>
                            </div>
                        </div>
                    </div>

                    <div class="info-panel" style="margin-top: 20px;">
                        <h4>📦 Charolas al Iniciar la Ruta</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Charolas Grandes:</label>
                                <span><strong>${resumen.inicioGrandes}</strong></span>
                            </div>
                            <div class="info-item">
                                <label>Charolas Pequeñas:</label>
                                <span><strong>${resumen.inicioPequenas}</strong></span>
                            </div>
                            <div class="info-item">
                                <label>Total:</label>
                                <span><strong>${resumen.inicioGrandes + resumen.inicioPequenas}</strong> charolas</span>
                            </div>
                        </div>
                    </div>

                    <h4 style="margin-top: 24px;">🚚 Movimientos Realizados (${resumen.totalMovimientos})</h4>
                    ${movimientosHTML}

                    <div class="info-panel" style="margin-top: 24px; background: #e7f3ff; border: 2px solid var(--primary-color);">
                        <h4>📊 Resumen de la Ruta</h4>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 16px;">
                            <div>
                                <h5 style="color: var(--primary-color); margin-bottom: 12px;">📦 CHAROLAS GRANDES</h5>
                                <div class="info-grid">
                                    <div class="info-item">
                                        <label>• Inicio:</label>
                                        <span><strong>${resumen.inicioGrandes}</strong></span>
                                    </div>
                                    <div class="info-item">
                                        <label>• Descargadas:</label>
                                        <span style="color: #dc3545;"><strong>${resumen.totalDescargadasG}</strong></span>
                                    </div>
                                    <div class="info-item">
                                        <label>• Recogidas:</label>
                                        <span style="color: #28a745;"><strong>+${resumen.totalRecogidasG}</strong></span>
                                    </div>
                                    <div class="info-item" style="background: white; padding: 8px; border-radius: 4px;">
                                        <label>• En ruta ahora:</label>
                                        <span style="font-size: 18px;"><strong>${resumen.actualesGrandes}</strong></span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h5 style="color: var(--primary-color); margin-bottom: 12px;">📦 CHAROLAS PEQUEÑAS</h5>
                                <div class="info-grid">
                                    <div class="info-item">
                                        <label>• Inicio:</label>
                                        <span><strong>${resumen.inicioPequenas}</strong></span>
                                    </div>
                                    <div class="info-item">
                                        <label>• Descargadas:</label>
                                        <span style="color: #dc3545;"><strong>${resumen.totalDescargadasP}</strong></span>
                                    </div>
                                    <div class="info-item">
                                        <label>• Recogidas:</label>
                                        <span style="color: #28a745;"><strong>+${resumen.totalRecogidasP}</strong></span>
                                    </div>
                                    <div class="info-item" style="background: white; padding: 8px; border-radius: 4px;">
                                        <label>• En ruta ahora:</label>
                                        <span style="font-size: 18px;"><strong>${resumen.actualesPequenas}</strong></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #b3d9ff;">
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>TOTAL EN RUTA:</label>
                                    <span style="font-size: 20px; color: var(--primary-color);"><strong>${resumen.actualesGrandes + resumen.actualesPequenas}</strong> charolas</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="info-panel" style="margin-top: 20px;">
                        <h4>📍 Clientes Visitados</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Total de paradas:</label>
                                <span><strong>${resumen.totalMovimientos}</strong></span>
                            </div>
                            <div class="info-item">
                                <label>Clientes atendidos:</label>
                                <span><strong>${resumen.clientesAtendidos}</strong></span>
                            </div>
                        </div>
                        ${resumen.listaClientes ? `
                            <div style="margin-top: 12px;">
                                <small style="color: var(--text-medium);">
                                    ${resumen.listaClientes}
                                </small>
                            </div>
                        ` : ''}
                    </div>

                    <div style="margin-top: 24px; text-align: center;">
                        <button class="btn-secondary" onclick="Rutas.cerrarModalMovimientos()">Cerrar</button>
                    </div>
                `;

                document.getElementById('movimientosRutaContent').innerHTML = html;
                document.getElementById('modalMovimientosRuta').classList.add('active');
            } else {
                alert('❌ No se pudo cargar la información de la ruta');
            }
        } catch (error) {
            console.error('Error al ver movimientos de ruta:', error);
            alert('❌ Error al cargar movimientos de la ruta');
        }
    },

    cerrarModalMovimientos() {
        document.getElementById('modalMovimientosRuta').classList.remove('active');
    },

    // Descargar Excel de una ruta
    async descargarExcelRuta(rutaId, codigoRuta) {
        try {
            console.log(`📥 Descargando Excel de ruta: ${codigoRuta}`);

            const response = await fetch(`/api/rutas/${rutaId}/excel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Obtener el archivo como blob
                const blob = await response.blob();
                
                // Crear URL temporal
                const url = window.URL.createObjectURL(blob);
                
                // Crear link de descarga
                const a = document.createElement('a');
                a.href = url;
                
                // Nombre del archivo con fecha
                const fecha = new Date().toISOString().split('T')[0];
                a.download = `Ruta_${codigoRuta}_${fecha}.xlsx`;
                
                // Simular click
                document.body.appendChild(a);
                a.click();
                
                // Limpiar
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                console.log(`✅ Excel de ruta ${codigoRuta} descargado`);
            } else {
                const error = await response.json();
                alert('❌ Error al generar Excel: ' + error.message);
            }
        } catch (error) {
            console.error('Error al descargar Excel de ruta:', error);
            alert('❌ Error al descargar Excel: ' + error.message);
        }
    },

    // Eliminar ruta (solo administradores)
    async eliminarRuta(rutaID, codigoRuta) {
        // Verificar permisos
        if (!window.isAdmin || !window.isAdmin()) {
            alert('❌ No tienes permisos para eliminar rutas. Solo administradores pueden realizar esta acción.');
            return;
        }

        // Confirmar eliminación
        if (!confirm(`⚠️ ¿Estás seguro de eliminar la ruta ${codigoRuta}?\n\nEsta acción no se puede deshacer y eliminará todos los movimientos asociados.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/rutas/${rutaID}`, {
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
            console.error('Error al eliminar ruta:', error);
            alert('❌ Error al eliminar ruta');
        }
    }
};


// Exportar para uso global
window.Rutas = Rutas;
