// =====================================================
// SISTEMA DE NOTIFICACIONES MOTIVACIONALES
// Con todas las frases personalizadas
// public/js/notifications.js
// =====================================================

// ===== CONFIGURACIÓN =====
const NotificationConfig = {
    // Intervalo entre notificaciones (en minutos)
    interval: 1,
    
    // Duración de cada notificación (en segundos)
    duration: 10,
    
    // Activar/desactivar notificaciones
    enabled: true,
    
    // Mostrar primera notificación después de (segundos)
    initialDelay: 30,
    
    // Animación de entrada
    animationType: 'slideInRight' // 'slideInRight' o 'bounceIn'
};

// ===== FRASES MOTIVACIONALES =====
const MotivationalPhrases = {
    // Frases generales (todo el año)
    general: [
        "Cada charola bien gestionada es un paso más hacia una operación eficiente y ordenada.",
        "La organización de hoy es el éxito operativo de mañana.",
        "Controlar los detalles es lo que marca la diferencia en los grandes resultados.",
        "Una gestión clara reduce errores y potencia el rendimiento del equipo.",
        "La eficiencia comienza con información confiable y procesos bien definidos.",
        "Cuando todo está bajo control, el trabajo fluye mejor.",
        "Optimizar procesos es invertir en tranquilidad y productividad.",
        "Un sistema bien gestionado es sinónimo de confianza y crecimiento.",
        "Cada registro cuenta: la precisión construye excelencia operativa.",
        "La mejora continua empieza con una buena gestión.",
        "La disciplina en la gestión diaria es la base de una operación exitosa."
    ],
    
    // Frases de Navidad (diciembre)
    christmas: [
        "Que esta Navidad esté llena de orden, eficiencia y nuevos logros para tu operación.",
        "Esta Navidad celebramos el progreso, el control y todo lo bien construido durante el año.",
        "Que el cierre de año llegue con procesos claros y objetivos cumplidos.",
        "Navidad es el momento ideal para reconocer el trabajo bien hecho y seguir mejorando.",
        "Que estas fechas impulsen resultados sólidos y una gestión cada vez más eficiente.",
        "Cerramos el año con organización, compromiso y metas alcanzadas.",
        "Que el espíritu de cierre de año motive nuevos avances y mejores decisiones.",
        "Esta Navidad es reflejo del esfuerzo constante y del control bien aplicado.",
        "Que el balance de fin de año deje satisfacción por un trabajo bien estructurado.",
        "Navidad también es valorar el progreso logrado paso a paso.",
        "El verdadero logro de este año: procesos claros y resultados confiables.",
        "Que el nuevo ciclo comience con bases sólidas y una operación bien organizada."
    ],
    
    // Frases de Año Nuevo (1-7 de enero)
    newYear: [
        "Un nuevo año trae nuevas oportunidades para optimizar, crecer y mejorar cada proceso.",
        "Que este Año Nuevo esté lleno de metas claras, procesos eficientes y grandes resultados."
    ],
    
    // Frase de ZoyPri (10% de probabilidad)
    zoypri: [
        "ZoyPri Hypersystems: donde las ideas se convierten en soluciones."
    ]
};

// ===== ICONOS POR TIPO =====
const NotificationIcons = {
    general: '💼',
    christmas: '🎄',
    newYear: '🎊',
    zoypri: '⚡'
};

// ===== TÍTULOS POR TIPO =====
const NotificationTitles = {
    general: 'Consejo del Día',
    christmas: 'Mensaje Navideño',
    newYear: 'Año Nuevo',
    zoypri: 'ZoyPri Hypersystems'
};

// ===== FUNCIÓN PARA DETERMINAR EL TIPO DE FRASE SEGÚN LA FECHA =====
function getPhraseType() {
    const today = new Date();
    const month = today.getMonth() + 1; // 1-12
    const day = today.getDate();
    
    // 10% de probabilidad para ZoyPri
    if (Math.random() < 0.1) {
        return 'zoypri';
    }
    
    // Diciembre: frases navideñas
    if (month === 12) {
        return 'christmas';
    }
    
    // Primera semana de enero: frases de año nuevo
    if (month === 1 && day <= 7) {
        return 'newYear';
    }
    
    // Resto del año: frases generales
    return 'general';
}

// ===== FUNCIÓN PARA OBTENER UNA FRASE ALEATORIA =====
function getRandomPhrase() {
    const type = getPhraseType();
    const phrases = MotivationalPhrases[type];
    const randomIndex = Math.floor(Math.random() * phrases.length);
    
    return {
        type: type,
        message: phrases[randomIndex],
        icon: NotificationIcons[type],
        title: NotificationTitles[type]
    };
}

// ===== FUNCIÓN PARA MOSTRAR NOTIFICACIÓN =====
function showNotification(phraseData) {
    // Verificar si ya hay una notificación visible
    const existing = document.querySelector('.motivational-notification');
    if (existing) {
        existing.remove();
    }
    
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `motivational-notification type-${phraseData.type}`;
    
    if (NotificationConfig.animationType === 'bounceIn') {
        notification.classList.add('bounce-in');
    }
    
    notification.innerHTML = `
        <div class="icon">${phraseData.icon}</div>
        <div class="content">
            <p class="title">${phraseData.title}</p>
            <p class="message">${phraseData.message}</p>
            ${phraseData.type === 'zoypri' ? '' : '<p class="footer">Sistema de Control de Charolas</p>'}
        </div>
        <button class="close-btn" onclick="this.parentElement.remove()">×</button>
        <div class="progress-bar"></div>
    `;
    
    // Agregar al body
    document.body.appendChild(notification);
    
    // Reproducir sonido suave (opcional)
    playNotificationSound();
    
    // Eliminar automáticamente después de la duración configurada
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, NotificationConfig.duration * 1000);
    
    console.log(`💬 Notificación mostrada: ${phraseData.type}`);
}

// ===== FUNCIÓN PARA REPRODUCIR SONIDO (OPCIONAL) =====
function playNotificationSound() {
    // Sonido muy suave y corto (opcional)
    // Si no quieres sonido, comenta esta función
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // Silenciosamente fallar si no hay soporte de audio
    }
}

// ===== FUNCIÓN PARA INICIAR SISTEMA DE NOTIFICACIONES =====
function startNotificationSystem() {
    if (!NotificationConfig.enabled) {
        console.log('❌ Sistema de notificaciones desactivado');
        return;
    }
    
    // Verificar preferencias del usuario
    const userPreference = localStorage.getItem('notificationsEnabled');
    if (userPreference === 'false') {
        console.log('❌ Notificaciones desactivadas por el usuario');
        return;
    }
    
    console.log('💬 Sistema de notificaciones iniciado');
    console.log(`⏰ Intervalo: ${NotificationConfig.interval} minutos`);
    console.log(`⏱️  Duración: ${NotificationConfig.duration} segundos`);
    
    // Mostrar primera notificación después del delay inicial
    setTimeout(() => {
        const phrase = getRandomPhrase();
        showNotification(phrase);
    }, NotificationConfig.initialDelay * 1000);
    
    // Mostrar notificaciones periódicamente
    setInterval(() => {
        const phrase = getRandomPhrase();
        showNotification(phrase);
    }, NotificationConfig.interval * 60 * 1000);
}

// ===== FUNCIÓN PARA ACTIVAR/DESACTIVAR NOTIFICACIONES =====
function toggleNotifications() {
    const isEnabled = localStorage.getItem('notificationsEnabled') !== 'false';
    
    if (isEnabled) {
        localStorage.setItem('notificationsEnabled', 'false');
        NotificationConfig.enabled = false;
        
        // Eliminar notificación actual si existe
        const existing = document.querySelector('.motivational-notification');
        if (existing) existing.remove();
        
        console.log('❌ Notificaciones desactivadas');
        alert('Las notificaciones han sido desactivadas.\nRecarga la página para reactivarlas.');
    } else {
        localStorage.setItem('notificationsEnabled', 'true');
        NotificationConfig.enabled = true;
        console.log('✅ Notificaciones activadas');
        alert('Las notificaciones han sido activadas.\nRecarga la página para aplicar los cambios.');
    }
}

// ===== FUNCIÓN PARA MOSTRAR NOTIFICACIÓN MANUAL =====
function showManualNotification(message, type = 'general') {
    const phraseData = {
        type: type,
        message: message,
        icon: NotificationIcons[type] || '💬',
        title: NotificationTitles[type] || 'Notificación'
    };
    
    showNotification(phraseData);
}

// ===== FUNCIÓN PARA AGREGAR BOTÓN DE CONTROL (OPCIONAL) =====
function addNotificationControlButton() {
    const button = document.createElement('button');
    button.innerHTML = '💬';
    button.title = 'Activar/Desactivar notificaciones';
    button.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        z-index: 10000;
        background: linear-gradient(135deg, #00BFFF, #1E90FF);
        border: 2px solid #1E90FF;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        font-size: 1.5em;
        cursor: pointer;
        box-shadow: 0 4px 10px rgba(0, 191, 255, 0.3);
        transition: all 0.3s ease;
        color: white;
    `;
    
    button.onclick = toggleNotifications;
    
    button.onmouseover = function() {
        this.style.transform = 'scale(1.1)';
        this.style.boxShadow = '0 6px 15px rgba(0, 191, 255, 0.5)';
    };
    
    button.onmouseout = function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 4px 10px rgba(0, 191, 255, 0.3)';
    };
    
    document.body.appendChild(button);
    console.log('💬 Botón de control de notificaciones agregado');
}

// ===== INICIAR AUTOMÁTICAMENTE CUANDO EL DOM ESTÉ LISTO =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        startNotificationSystem();
        // addNotificationControlButton(); // Descomentar si quieres el botón
    });
} else {
    startNotificationSystem();
    // addNotificationControlButton(); // Descomentar si quieres el botón
}

// ===== EXPORTAR PARA USO GLOBAL =====
window.Notifications = {
    start: startNotificationSystem,
    show: showManualNotification,
    toggle: toggleNotifications,
    config: NotificationConfig,
    getPhrase: getRandomPhrase
};

console.log('💬 Sistema de notificaciones cargado');
console.log('💡 Usa Notifications.toggle() para activar/desactivar');