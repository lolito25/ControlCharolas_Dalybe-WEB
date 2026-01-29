// ===================================
// LOGIN.JS - Lógica de Autenticación
// public/js/login.js
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginButton = document.getElementById('loginButton');
    const errorMessage = document.getElementById('errorMessage');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // ===================================
    // TOGGLE PASSWORD VISIBILITY
    // ===================================
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        
        // Cambiar ícono
        togglePassword.innerHTML = type === 'password' 
            ? '<svg class="eye-icon" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" fill="currentColor"/><path d="M10 4C5 4 1.73 7.11 1 10c.73 2.89 4 6 9 6s8.27-3.11 9-6c-.73-2.89-4-6-9-6z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
            : '<svg class="eye-icon" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 3l14 14M10 7a3 3 0 013 3m-.5 2.5A3 3 0 017 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    });

    // ===================================
    // MANEJO DEL FORMULARIO
    // ===================================
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Obtener valores del formulario
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        // Validaciones básicas
        if (!username || !password) {
            showError('Por favor, completa todos los campos');
            return;
        }

        // Mostrar estado de carga
        setLoadingState(true);
        hideError();

        try {
            // Realizar petición de login
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Login exitoso
                showSuccessMessage('¡Inicio de sesión exitoso!');
                
                // Guardar recordatorio si está marcado
                const remember = document.getElementById('remember').checked;
                if (remember) {
                    localStorage.setItem('rememberedUser', username);
                } else {
                    localStorage.removeItem('rememberedUser');
                }

                // Redirigir al dashboard después de un breve momento
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 800);

            } else {
                // Login fallido
                showError(data.message || 'Usuario o contraseña incorrectos');
                setLoadingState(false);
            }

        } catch (error) {
            console.error('Error en login:', error);
            showError('Error de conexión. Por favor, intenta nuevamente.');
            setLoadingState(false);
        }
    });

    // ===================================
    // FUNCIONES AUXILIARES
    // ===================================

    function setLoadingState(loading) {
        loginButton.disabled = loading;
        if (loading) {
            loginButton.classList.add('loading');
        } else {
            loginButton.classList.remove('loading');
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
    }

    function hideError() {
        errorMessage.classList.remove('show');
    }

    function showSuccessMessage(message) {
        errorMessage.style.background = '#d1fae5';
        errorMessage.style.color = '#10b981';
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
    }

    // ===================================
    // CARGAR USUARIO RECORDADO
    // ===================================
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
        document.getElementById('username').value = rememberedUser;
        document.getElementById('remember').checked = true;
        document.getElementById('password').focus();
    }

    // ===================================
    // ANIMACIÓN DE ENTRADA DE INPUTS
    // ===================================
    const inputs = document.querySelectorAll('.form-group input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });

        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });

    // ===================================
    // VERIFICAR SI YA HAY SESIÓN ACTIVA
    // ===================================
    fetch('/check-session')
        .then(response => response.json())
        .then(data => {
            if (data.authenticated) {
                window.location.href = '/dashboard.html';
            }
        })
        .catch(error => {
            console.log('No hay sesión activa');
        });

    // ===================================
    // EASTER EGG - PRESIONAR ENTER EN USERNAME
    // ===================================
    document.getElementById('username').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('password').focus();
        }
    });
});

// ===================================
// ANIMACIÓN DE PARTÍCULAS (OPCIONAL)
// ===================================
function createParticles() {
    const container = document.querySelector('.background-animation');
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 5 + 2}px;
            height: ${Math.random() * 5 + 2}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            animation: float ${Math.random() * 20 + 10}s infinite ease-in-out;
            animation-delay: ${Math.random() * 5}s;
        `;
        container.appendChild(particle);
    }
}

// Crear partículas al cargar la página
// createParticles();
