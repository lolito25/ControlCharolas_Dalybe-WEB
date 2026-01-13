// ===================================
// MÓDULO: DASHBOARD HOME public/js/modules/dashboard-home.js
// ===================================

const DashboardHome = {
    // Inicializar módulo
    init() {
        this.cargarEstadisticas();
    },

    // Cargar estadísticas del dashboard
    async cargarEstadisticas() {
        try {
            const response = await fetch('/api/estadisticas');
            const result = await response.json();
            
            if (result.success) {
                document.getElementById('totalClientes').textContent = result.data.totalClientes;
                document.getElementById('movimientosHoy').textContent = result.data.movimientosHoy;
                document.getElementById('totalProveedores').textContent = result.data.totalProveedores;
                document.getElementById('charolasBodega').textContent = result.data.charolasBodega;
            }
            
            // Cargar actividad reciente
            this.cargarActividadReciente();
            
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    },

    // Cargar actividad reciente
    async cargarActividadReciente() {
        try {
            const response = await fetch('/api/movimientos');
            const result = await response.json();
            
            const activityList = document.getElementById('activityList');
            
            if (result.success && result.data.length > 0) {
                const html = result.data.slice(0, 5).map(mov => {
                    const fecha = new Date(mov.FechaMovimiento);
                    const fechaFormato = fecha.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    return `
                        <div class="activity-item">
                            <div class="activity-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                                📦
                            </div>
                            <div class="activity-details">
                                <h4>${mov.NombreCliente} - ${mov.NombreEstablecimiento}</h4>
                                <p>Descargadas: ${mov.CantidadDescargada} | Recogidas: ${mov.CantidadRecogida} | ${fechaFormato}</p>
                            </div>
                        </div>
                    `;
                }).join('');
                
                activityList.innerHTML = html;
            } else {
                activityList.innerHTML = '<p class="loading-text">No hay actividad reciente</p>';
            }
            
        } catch (error) {
            console.error('Error al cargar actividad:', error);
        }
    }
};

// Exportar para uso global
window.DashboardHome = DashboardHome;
