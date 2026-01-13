// ===================================
// MÓDULO: BODEGA public/js/modules/bodega.js
// ===================================

const Bodega = {
    // Inicializar módulo
    init() {
        this.verificarPermisos();
        this.cargar();
        this.setupFormulario();
    },

    // Verificar permisos del usuario
    verificarPermisos() {
        // Solo administradores pueden actualizar bodega
        if (!window.isAdmin()) {
            // Deshabilitar formulario
            document.getElementById('inputGrandes').disabled = true;
            document.getElementById('inputPequenas').disabled = true;
            document.getElementById('inputNotas').disabled = true;
            
            const submitBtn = document.querySelector('#bodegaForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
                submitBtn.style.cursor = 'not-allowed';
                submitBtn.title = 'Solo administradores pueden actualizar la bodega';
            }
            
            // Mostrar mensaje informativo
            const form = document.getElementById('bodegaForm');
            if (form) {
                const alerta = document.createElement('div');
                alerta.className = 'alert alert-warning';
                alerta.style.marginTop = '10px';
                alerta.innerHTML = `
                    <strong>ℹ️ Información:</strong> 
                    Solo los usuarios con rol de <strong>Administrador</strong> pueden actualizar el inventario de bodega.
                `;
                form.appendChild(alerta);
            }
        }
    },

    // Cargar datos de bodega
    async cargar() {
        try {
            const response = await fetch('/api/bodega');
            const result = await response.json();
            
            if (result.success && result.data) {
                const data = result.data;
                
                document.getElementById('bodegaGrandes').textContent = data.CharolasGrandesBodega || 0;
                document.getElementById('bodegaPequenas').textContent = data.CharolasPequenasBodega || 0;
                document.getElementById('bodegaTotal').textContent = data.TotalCharolasBodega || 0;
                
                if (data.FechaActualizacion) {
                    const fecha = new Date(data.FechaActualizacion);
                    document.getElementById('bodegaFecha').textContent = fecha.toLocaleString('es-ES');
                }
                
                document.getElementById('bodegaUsuario').textContent = data.UsuarioActualizacion || '-';
                document.getElementById('bodegaNotas').textContent = data.Notas || 'Sin notas';
                
                // Actualizar inputs del formulario
                document.getElementById('inputGrandes').value = data.CharolasGrandesBodega || 0;
                document.getElementById('inputPequenas').value = data.CharolasPequenasBodega || 0;
            }
        } catch (error) {
            console.error('Error al cargar bodega:', error);
        }
    },

    // Configurar formulario de actualización
    setupFormulario() {
        const form = document.getElementById('bodegaForm');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const charolasGrandes = parseInt(document.getElementById('inputGrandes').value);
            const charolasPequenas = parseInt(document.getElementById('inputPequenas').value);
            const notas = document.getElementById('inputNotas').value;
            
            try {
                const response = await fetch('/api/bodega/actualizar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        charolasGrandes,
                        charolasPequenas,
                        notas
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('✅ Inventario de bodega actualizado correctamente');
                    this.cargar();
                    document.getElementById('inputNotas').value = '';
                } else {
                    alert('❌ ' + (result.message || 'Error al actualizar bodega'));
                }
            } catch (error) {
                console.error('Error al actualizar bodega:', error);
                alert('❌ Error de conexión');
            }
        });
    }
};

// Exportar para uso global
window.Bodega = Bodega;
