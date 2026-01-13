// =====================================================
// EFECTOS VISUALES NAVIDEÑOS - SOLO NIEVE Y DECORACIONES
// Sin notificaciones, sin cambios de colores
// =====================================================

// ===== CONFIGURACIÓN =====
const SnowConfig = {
    // Cantidad de copos de nieve
    snowflakeCount: 100,
    
    // Símbolos de copos
    snowflakeSymbols: ['❄', '❅', '❆', '✻', '✼', '❉'],
    
    // Activar/desactivar efectos
    enableSnow: true,
    enableCornerDecorations: true,
    enableFloatingParticles: false, // Desactivado por defecto
    enableStars: false, // Desactivado por defecto
    enableGarland: false, // Desactivado por defecto
    enableBigSnowflake: false, // Desactivado por defecto
    
    // Decoraciones en las esquinas
    cornerDecorations: {
        topRight: '🎄',
        topLeft: '⛄'
    }
};

// ===== FUNCIÓN PARA CREAR COPOS DE NIEVE =====
function createSnowflakes() {
    if (!SnowConfig.enableSnow) return;
    
    const container = document.body;
    
    for (let i = 0; i < SnowConfig.snowflakeCount; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.textContent = SnowConfig.snowflakeSymbols[
            Math.floor(Math.random() * SnowConfig.snowflakeSymbols.length)
        ];
        
        // Posición horizontal aleatoria
        snowflake.style.left = Math.random() * 100 + '%';
        
        // Delay aleatorio para que no caigan todos al mismo tiempo
        snowflake.style.animationDelay = Math.random() * 10 + 's';
        
        // Duración aleatoria
        snowflake.style.animationDuration = (Math.random() * 10 + 10) + 's';
        
        container.appendChild(snowflake);
    }
    
    console.log(`❄️ ${SnowConfig.snowflakeCount} copos de nieve creados`);
}

// ===== FUNCIÓN PARA CREAR DECORACIONES EN ESQUINAS =====
function createCornerDecorations() {
    if (!SnowConfig.enableCornerDecorations) return;
    
    const container = document.body;
    
    // Decoración esquina superior derecha
    const topRight = document.createElement('div');
    topRight.className = 'christmas-corner-decoration';
    topRight.textContent = SnowConfig.cornerDecorations.topRight;
    container.appendChild(topRight);
    
    // Decoración esquina superior izquierda
    const topLeft = document.createElement('div');
    topLeft.className = 'christmas-corner-decoration-left';
    topLeft.textContent = SnowConfig.cornerDecorations.topLeft;
    container.appendChild(topLeft);
    
    // Copos pequeños en las esquinas
    const positions = [
        { class: 'corner-snowflake-1' },
        { class: 'corner-snowflake-2' },
        { class: 'corner-snowflake-3' },
        { class: 'corner-snowflake-4' },
        { class: 'corner-snowflake-5' },
        { class: 'corner-snowflake-6' }
    ];
    
    positions.forEach(pos => {
        const snowflake = document.createElement('div');
        snowflake.className = `corner-snowflake ${pos.class}`;
        snowflake.textContent = '❄';
        container.appendChild(snowflake);
    });
    
    console.log('🎄 Decoraciones en esquinas creadas');
}

// ===== FUNCIÓN PARA CREAR EFECTO DE ESCARCHA =====
function createFrostOverlay() {
    const frost = document.createElement('div');
    frost.className = 'frost-overlay';
    document.body.appendChild(frost);
    console.log('❄️ Efecto de escarcha aplicado');
}

// ===== FUNCIÓN PARA CREAR ESTRELLAS =====
function createStars() {
    if (!SnowConfig.enableStars) return;
    
    const starCount = 20;
    const container = document.body;
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.textContent = '⭐';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        container.appendChild(star);
    }
    
    console.log('⭐ Estrellas creadas');
}

// ===== FUNCIÓN PARA CREAR PARTÍCULAS FLOTANTES =====
function createFloatingParticles() {
    if (!SnowConfig.enableFloatingParticles) return;
    
    const particles = ['🎅', '🎁', '🔔', '⛄', '🎄'];
    
    setInterval(() => {
        if (Math.random() < 0.2) { // 20% de probabilidad cada 3 segundos
            const particle = document.createElement('div');
            particle.className = 'floating-particle';
            particle.textContent = particles[Math.floor(Math.random() * particles.length)];
            particle.style.left = Math.random() * 100 + '%';
            particle.style.bottom = '0';
            document.body.appendChild(particle);
            
            // Eliminar después de la animación
            setTimeout(() => particle.remove(), 5000);
        }
    }, 3000);
    
    console.log('✨ Sistema de partículas flotantes activado');
}

// ===== FUNCIÓN PARA CREAR GUIRNALDA =====
function createGarland() {
    if (!SnowConfig.enableGarland) return;
    
    const garland = document.createElement('div');
    garland.className = 'christmas-garland';
    document.body.insertBefore(garland, document.body.firstChild);
    console.log('🎊 Guirnalda creada');
}

// ===== FUNCIÓN PARA CREAR COPO DECORATIVO GRANDE =====
function createBigSnowflake() {
    if (!SnowConfig.enableBigSnowflake) return;
    
    const bigSnowflake = document.createElement('div');
    bigSnowflake.className = 'decorative-snowflake';
    bigSnowflake.textContent = '❄';
    document.body.appendChild(bigSnowflake);
    console.log('❄️ Copo decorativo grande creado');
}

// ===== FUNCIÓN PARA CREAR BOTÓN DE TOGGLE =====
function createToggleButton() {
    const button = document.createElement('button');
    button.className = 'christmas-toggle-btn';
    button.innerHTML = '❄️';
    button.title = 'Activar/Desactivar efectos de nieve';
    button.onclick = toggleSnowEffects;
    document.body.appendChild(button);
    console.log('🎄 Botón de toggle creado');
}

// ===== FUNCIÓN PARA ACTIVAR/DESACTIVAR EFECTOS =====
function toggleSnowEffects() {
    const elements = document.querySelectorAll(
        '.snowflake, .christmas-corner-decoration, .christmas-corner-decoration-left, ' +
        '.corner-snowflake, .frost-overlay, .star, .floating-particle, ' +
        '.christmas-garland, .decorative-snowflake'
    );
    
    const isHidden = elements[0]?.classList.contains('christmas-effects-hidden');
    
    elements.forEach(el => {
        if (isHidden) {
            el.classList.remove('christmas-effects-hidden');
        } else {
            el.classList.add('christmas-effects-hidden');
        }
    });
    
    // Guardar preferencia
    localStorage.setItem('snowEffectsEnabled', isHidden);
    
    console.log(isHidden ? '❄️ Efectos activados' : '❌ Efectos desactivados');
}

// ===== FUNCIÓN PARA ELIMINAR TODOS LOS EFECTOS =====
function removeAllEffects() {
    const selectors = [
        '.snowflake',
        '.christmas-corner-decoration',
        '.christmas-corner-decoration-left',
        '.corner-snowflake',
        '.frost-overlay',
        '.star',
        '.floating-particle',
        '.christmas-garland',
        '.decorative-snowflake',
        '.christmas-toggle-btn'
    ];
    
    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => el.remove());
    });
    
    console.log('🗑️ Todos los efectos eliminados');
}

// ===== FUNCIÓN PRINCIPAL DE INICIALIZACIÓN =====
function initSnowEffects() {
    console.log('❄️ Inicializando efectos de nieve...');
    
    // Verificar si el usuario deshabilitó los efectos
    const isEnabled = localStorage.getItem('snowEffectsEnabled');
    if (isEnabled === 'false') {
        console.log('❌ Efectos deshabilitados por el usuario');
        return;
    }
    
    // Crear efectos
    createSnowflakes();
    createCornerDecorations();
    createFrostOverlay();
    createStars();
    createFloatingParticles();
    createGarland();
    createBigSnowflake();
    createToggleButton();
    
    console.log('✅ Efectos de nieve activados');
}

// ===== INICIAR AUTOMÁTICAMENTE CUANDO EL DOM ESTÉ LISTO =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSnowEffects);
} else {
    initSnowEffects();
}

// ===== EXPORTAR PARA USO GLOBAL =====
window.SnowEffects = {
    init: initSnowEffects,
    toggle: toggleSnowEffects,
    remove: removeAllEffects,
    config: SnowConfig
};

console.log('❄️ Sistema de efectos de nieve cargado');
console.log('💡 Usa SnowEffects.toggle() para activar/desactivar');
console.log('💡 Usa SnowEffects.config para ajustar configuración');