// ===================================
// DASHBOARD CONTROLLER public/js/dashboard-controller.js
// Sistema de carga dinámica de vistas
// ===================================

const DashboardController = {
    // Vista actual cargada
    currentView: null,
    
    // Usuario actual
    currentUser: {
        username: null,
        rol: null
    },
    
    // Módulos disponibles
    modules: {
        'dashboard': {
            html: '/views/dashboard-home.html',
            js: '/js/modules/dashboard-home.js',
            module: 'DashboardHome'
        },
        'inventario': {
            html: '/views/inventario.html',
            js: '/js/modules/inventario.js',
            module: 'Inventario'
        },
        'movimientos': {
            html: '/views/movimientos.html',
            js: '/js/modules/movimientos.js',
            module: 'Movimientos'
        },
        'bodega': {
            html: '/views/bodega.html',
            js: '/js/modules/bodega.js',
            module: 'Bodega'
        },
        'proveedores': {
            html: '/views/proveedores.html',
            js: '/js/modules/proveedores.js',
            module: 'Proveedores'
        },
        'rutas': {
            html: '/views/rutas.html',
            js: '/js/modules/rutas.js',
            module: 'Rutas'
        }
    },

    // Scripts cargados
    loadedScripts: new Set(),

    // Inicializar controlador
    init() {
        this.verificarSesion();
        this.actualizarFecha();
        this.setupNavegacion();
        this.setupLogout();
        this.setupMobileMenu();
        
        // Cargar vista inicial (dashboard)
        this.cargarVista('dashboard');
    },

    // Verificar sesión
    async verificarSesion() {
        try {
            const response = await fetch('/check-session');
            const data = await response.json();
            
            if (!data.authenticated) {
                window.location.href = '/login.html';
            } else {
                // Guardar información del usuario
                this.currentUser.username = data.user.username;
                this.currentUser.rol = data.user.rol;
                
                // Actualizar UI
                document.getElementById('userName').textContent = data.user.username;
                document.getElementById('userRole').textContent = data.user.rol;
            }
        } catch (error) {
            console.error('Error al verificar sesión:', error);
            window.location.href = '/login.html';
        }
    },

    // Actualizar fecha
    actualizarFecha() {
        const dateElement = document.getElementById('currentDate');
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dateElement.textContent = now.toLocaleDateString('es-ES', options);
    },

    // Configurar navegación
    setupNavegacion() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remover active de todos los links
                navLinks.forEach(l => l.classList.remove('active'));
                
                // Agregar active al link clickeado
                link.classList.add('active');
                
                // Obtener sección
                const section = link.getAttribute('data-section');
                
                // Cargar vista
                this.cargarVista(section);
            });
        });
    },

    // Cargar vista dinámica
    async cargarVista(viewName) {
        const moduleInfo = this.modules[viewName];
        
        if (!moduleInfo) {
            console.error(`Vista ${viewName} no encontrada`);
            return;
        }

        // Actualizar título
        this.actualizarTitulo(viewName);

        // Contenedor de contenido
        const contentWrapper = document.querySelector('.content-wrapper');
        
        try {
            // Mostrar indicador de carga
            contentWrapper.innerHTML = '<div class="loading-text" style="padding: 40px; text-align: center;">Cargando...</div>';

            // Cargar HTML
            const htmlResponse = await fetch(moduleInfo.html);
            const html = await htmlResponse.text();
            
            // Insertar HTML
            contentWrapper.innerHTML = html;

            // Cargar script del módulo si no está cargado
            if (!this.loadedScripts.has(moduleInfo.js)) {
                await this.cargarScript(moduleInfo.js);
                this.loadedScripts.add(moduleInfo.js);
            }

            // Inicializar módulo
            if (window[moduleInfo.module] && typeof window[moduleInfo.module].init === 'function') {
                window[moduleInfo.module].init();
            }

            // Actualizar vista actual
            this.currentView = viewName;

        } catch (error) {
            console.error(`Error al cargar vista ${viewName}:`, error);
            contentWrapper.innerHTML = `
                <div style="padding: 40px; text-align: center; color: var(--error-color);">
                    <h3>Error al cargar la vista</h3>
                    <p>Por favor, intenta nuevamente</p>
                </div>
            `;
        }
    },

    // Cargar script dinámicamente
    cargarScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    // Actualizar título de la página
    actualizarTitulo(viewName) {
        const titles = {
            'dashboard': 'Dashboard',
            'inventario': 'Inventario de Charolas',
            'movimientos': 'Movimientos',
            'bodega': 'Control de Bodega',
            'proveedores': 'Proveedores',
            'rutas': 'Gestión de Rutas'
        };
        
        const subtitles = {
            'dashboard': 'Resumen general del sistema',
            'inventario': 'Control de charolas por cliente',
            'movimientos': 'Historial de movimientos',
            'bodega': 'Gestión de inventario en bodega',
            'proveedores': 'Gestión de proveedores',
            'rutas': 'Control y seguimiento de rutas de entrega'
        };
        
        document.getElementById('pageTitle').textContent = titles[viewName];
        document.getElementById('pageSubtitle').textContent = subtitles[viewName];
    },

    // Configurar logout
    setupLogout() {
        const btnLogout = document.getElementById('btnLogout');
        
        btnLogout.addEventListener('click', async () => {
            if (confirm('¿Estás seguro de cerrar sesión?')) {
                try {
                    await fetch('/auth/logout', { method: 'POST' });
                    window.location.href = '/login.html';
                } catch (error) {
                    console.error('Error al cerrar sesión:', error);
                    window.location.href = '/login.html';
                }
            }
        });
    },

    // Configurar menú móvil
    setupMobileMenu() {
        const mobileToggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.getElementById('sidebar');
        
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }
        
        // Cerrar sidebar al hacer clic en un enlace (móvil)
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                }
            });
        });
    }
};

// Función helper para verificar si el usuario es administrador
window.isAdmin = function() {
    return DashboardController.currentUser.rol === 'Administrador';
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    DashboardController.init();
});

// Exportar para uso global
window.DashboardController = DashboardController;
