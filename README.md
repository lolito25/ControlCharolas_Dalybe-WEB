# 🚀 Sistema de Control de Charolas - Aplicación Web

Sistema web completo para la gestión de inventario, movimientos y control de charolas con diseño moderno y profesional.

## 📋 Características

- ✅ **Autenticación de usuarios** con roles (Administrador/Oficina)
- 📊 **Dashboard interactivo** con estadísticas en tiempo real
- 📦 **Gestión de inventario** por clientes
- 🔄 **Control de movimientos** de charolas
- 🏪 **Gestión de bodega** con inventario actualizable
- 🚚 **Control de proveedores** con saldos de charolas
- 📱 **Diseño responsive** para todos los dispositivos
- 🎨 **Interfaz moderna** con efectos visuales profesionales

## 🛠️ Tecnologías Utilizadas

- **Backend:** Node.js + Express
- **Base de datos:** SQL Server 2019/2022
- **Frontend:** HTML5 + CSS3 + JavaScript (Vanilla)
- **Sesiones:** express-session
- **Conexión BD:** mssql (driver oficial de Microsoft)

## 📦 Requisitos Previos

- Node.js 14+ instalado
- SQL Server 2019 o 2022 instalado y ejecutándose
- Base de datos `ControlCharolas` creada (usar schema.sql proporcionado)
- Git (opcional, para clonar el repositorio)

## 🔧 Instalación

### 1. Clonar o descargar el proyecto

```bash
cd control-charolas-web
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto con la siguiente configuración:

```env
# Configuración de Base de Datos SQL Server
DB_USER=sa
DB_PASSWORD=tu_contraseña_de_sql_server
DB_SERVER=localhost
DB_DATABASE=ControlCharolas

# Puerto del servidor
PORT=3000

# Secreto para sesiones (cambiar en producción)
SESSION_SECRET=tu_secreto_super_seguro_aqui_12345

# Ambiente
NODE_ENV=development
```

### 4. Configurar la base de datos

1. Abrir SQL Server Management Studio (SSMS)
2. Ejecutar el script `schema.sql` (del proyecto original) para crear la estructura
3. Verificar que la base de datos `ControlCharolas` esté creada correctamente

### 5. Iniciar el servidor

**Modo desarrollo (con nodemon para auto-reload):**
```bash
npm run dev
```

**Modo producción:**
```bash
npm start
```

## 🌐 Acceso a la Aplicación

Una vez iniciado el servidor, accede a:

```
http://localhost:3000
```

### Credenciales de Prueba

Según el schema.sql, hay varios usuarios de prueba:

- **Usuario:** `admin` | **Password:** `admin123` (Administrador)
- **Usuario:** `yinethm` | **Password:** `boltythomas` (Administrador)
- **Usuario:** `alexm` | **Password:** `kym00` (Administrador)
- **Usuario:** `dayana` | **Password:** `dayanita` (Oficina)
- **Usuario:** `santiago` | **Password:** `1234` (Administrador)
- **Usuario:** `karen` | **Password:** `mona` (Oficina)

## 📁 Estructura del Proyecto

```
control-charolas-web/
│
├── config/
│   └── database.js          # Configuración de conexión a SQL Server
│
├── routes/
│   ├── auth.js              # Rutas de autenticación
│   └── api.js               # Rutas de API (datos)
│
├── public/                  # Archivos estáticos
│   ├── css/
│   │   ├── login.css        # Estilos de login
│   │   └── dashboard.css    # Estilos de dashboard
│   │
│   ├── js/
│   │   ├── login.js         # Lógica de login
│   │   └── dashboard.js     # Lógica de dashboard
│   │
│   ├── login.html           # Página de inicio de sesión
│   └── dashboard.html       # Dashboard principal
│
├── server.js                # Servidor principal
├── package.json             # Dependencias del proyecto
├── .env                     # Variables de entorno (crear manualmente)
├── .env.example             # Ejemplo de variables de entorno
└── README.md                # Este archivo
```

## 🎯 Funcionalidades por Módulo

### 1. Dashboard
- Estadísticas generales del sistema
- Contadores de clientes, movimientos, proveedores y charolas
- Actividad reciente

### 2. Inventario
- Lista completa de clientes con sus charolas
- Detalles de descargadas, recogidas y saldo
- Filtrado y búsqueda

### 3. Movimientos
- Historial completo de movimientos
- Información detallada por transacción
- Estado de verificación

### 4. Bodega
- Control de inventario en bodega
- Charolas grandes y pequeñas
- Actualización de inventario
- Historial de cambios

### 5. Proveedores
- Gestión de proveedores
- Control de charolas por proveedor
- Saldos de charolas grandes y pequeñas

## 🔐 Seguridad

- Sesiones seguras con express-session
- Protección de rutas con middleware de autenticación
- Variables sensibles en archivo .env (no incluido en repositorio)
- Validación de datos en frontend y backend

## 🚀 Despliegue en Producción

### Consideraciones:

1. **Cambiar SESSION_SECRET** en .env a un valor único y seguro
2. **Habilitar HTTPS** y cambiar `cookie.secure` a `true`
3. **Configurar NODE_ENV** a `production`
4. **Usar un servidor proxy** (nginx, Apache) delante de Node.js
5. **Implementar logs** y monitoreo
6. **Backups automáticos** de la base de datos (ver backup.sql)

## 📊 API Endpoints

### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/logout` - Cerrar sesión
- `GET /auth/verify` - Verificar sesión

### Datos (requieren autenticación)
- `GET /api/estadisticas` - Estadísticas generales
- `GET /api/inventario` - Lista de inventario
- `GET /api/movimientos` - Movimientos recientes
- `GET /api/bodega` - Estado de bodega
- `POST /api/bodega/actualizar` - Actualizar bodega
- `GET /api/proveedores` - Lista de proveedores

## 🐛 Solución de Problemas

### Error: Cannot connect to SQL Server

**Solución:**
- Verificar que SQL Server esté ejecutándose
- Comprobar credenciales en .env
- Verificar que el puerto de SQL Server (1433) esté disponible
- Revisar configuración de firewall

### Error: Port 3000 already in use

**Solución:**
- Cambiar el puerto en .env: `PORT=3001`
- O detener el proceso que usa el puerto 3000

### Error: Cannot find module 'X'

**Solución:**
- Ejecutar `npm install` nuevamente
- Verificar que package.json esté completo

## 📝 Mejoras Futuras

- [ ] Implementar paginación en tablas
- [ ] Agregar exportación a Excel/PDF
- [ ] Gráficos y reportes visuales
- [ ] Módulo de reportes personalizados
- [ ] Notificaciones en tiempo real
- [ ] Aplicación móvil nativa
- [ ] API RESTful completa
- [ ] Integración con sistemas externos

## 👥 Contribución

Para contribuir al proyecto:

1. Fork el repositorio
2. Crear una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto es privado y confidencial.

## 📧 Soporte

Para soporte técnico, contactar al equipo de desarrollo.

---

**Desarrollado con ❤️ para un mejor control de inventario**
