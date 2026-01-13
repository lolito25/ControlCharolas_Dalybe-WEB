# 🎯 GUÍA RÁPIDA DE USO

## 🚀 Inicio Rápido en 5 Pasos

### 1️⃣ Instalar Dependencias
```bash
npm install
```

### 2️⃣ Configurar Base de Datos
1. Abrir SQL Server Management Studio
2. Ejecutar el script `schema.sql` (del proyecto original)
3. Verificar que la base de datos `ControlCharolas` esté creada

### 3️⃣ Crear Archivo de Configuración
Crear archivo `.env` en la raíz del proyecto:

```env
DB_USER=sa
DB_PASSWORD=tu_password_aqui
DB_SERVER=localhost
DB_DATABASE=ControlCharolas
PORT=3000
SESSION_SECRET=cambia_esto_por_algo_seguro
NODE_ENV=development
```

### 4️⃣ Iniciar el Servidor

**Opción A - Script automático (Windows):**
```
Doble clic en START.bat
```

**Opción B - Script automático (Linux/Mac):**
```bash
./START.sh
```

**Opción C - Comando manual:**
```bash
npm start
```

### 5️⃣ Acceder a la Aplicación
```
http://localhost:3000
```

## 👤 Usuarios de Prueba

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | Administrador |
| yinethm | boltythomas | Administrador |
| alexm | kym00 | Administrador |
| dayana | dayanita | Oficina |

## 🗺️ Navegación por el Sistema

### 📊 Dashboard
- **Ubicación:** Página principal después del login
- **Qué hacer:** Ver resumen general y estadísticas
- **Actualización:** Automática al cargar

### 📦 Inventario
- **Cómo acceder:** Clic en "Inventario" en el menú lateral
- **Qué hacer:** Consultar el estado de charolas por cliente
- **Botones:** "Actualizar" para refrescar datos

### 🔄 Movimientos
- **Cómo acceder:** Clic en "Movimientos" en el menú lateral
- **Qué hacer:** Ver historial de movimientos de charolas
- **Información:** Fecha, cliente, cantidades, verificación

### 🏪 Bodega
- **Cómo acceder:** Clic en "Bodega" en el menú lateral
- **Qué hacer:** 
  - Ver inventario actual de bodega
  - Actualizar cantidades de charolas
  - Agregar notas sobre cambios

### 🚚 Proveedores
- **Cómo acceder:** Clic en "Proveedores" en el menú lateral
- **Qué hacer:** Consultar saldos de charolas por proveedor
- **Información:** Charolas grandes, pequeñas, último movimiento

## 📱 Uso en Móvil

1. **Abrir menú:** Tap en el icono ☰ (esquina superior izquierda)
2. **Navegar:** Seleccionar sección deseada
3. **Cerrar menú:** Tap en cualquier sección o fuera del menú

## 🔐 Cerrar Sesión

**Método 1:** Clic en el botón 🚪 en la parte inferior del menú lateral
**Método 2:** Navegar a `/logout` en la barra de direcciones

## ⚡ Atajos de Teclado

- `Enter` en campo de usuario → Ir a contraseña
- `Enter` en campo de contraseña → Enviar formulario de login

## 🎨 Características de Diseño

### ✨ Efectos Visuales
- Animaciones suaves en transiciones
- Hover effects en botones y tarjetas
- Loading states para carga de datos
- Iconos SVG vectoriales (escalables)

### 📊 Tarjetas de Estadísticas
- **Azul-Morado:** Total de clientes
- **Rosa-Rojo:** Movimientos del día
- **Azul claro:** Proveedores activos
- **Verde:** Charolas en bodega

### 🎯 Estados Visuales
- ✅ Verde: Verificado / Exitoso
- ❌ Rojo: No verificado / Error
- 🔵 Azul: Información
- ⚠️ Amarillo: Advertencia

## 🆘 Solución de Problemas Comunes

### ❌ "Error de conexión a la base de datos"
**Solución:**
1. Verificar que SQL Server esté ejecutándose
2. Comprobar credenciales en `.env`
3. Verificar que la base de datos `ControlCharolas` exista

### ❌ "Usuario o contraseña incorrectos"
**Solución:**
1. Verificar las credenciales en la tabla `Usuarios`
2. Asegurarse de que el usuario esté activo (`Activo = 1`)
3. Probar con usuario de prueba: `admin` / `admin123`

### ❌ "No se cargan los datos"
**Solución:**
1. Abrir consola del navegador (F12)
2. Revisar errores en pestaña "Console"
3. Verificar que el servidor esté ejecutándose
4. Refrescar la página (F5)

### ❌ "Puerto 3000 ya está en uso"
**Solución:**
1. Cambiar el puerto en `.env`: `PORT=3001`
2. O cerrar la aplicación que usa el puerto 3000

## 📈 Flujo de Trabajo Típico

### 📅 Inicio del Día
1. Login al sistema
2. Revisar dashboard para estadísticas del día
3. Verificar movimientos pendientes

### 📝 Registro de Movimientos
1. Ir a sección "Movimientos"
2. Verificar últimos registros
3. Actualizar si es necesario

### 🔄 Actualización de Bodega
1. Ir a sección "Bodega"
2. Ver estado actual
3. Actualizar cantidades según conteo físico
4. Agregar notas descriptivas

### 📊 Revisión de Inventario
1. Ir a sección "Inventario"
2. Revisar saldos por cliente
3. Identificar discrepancias
4. Tomar acciones correctivas

## 🎓 Consejos de Uso

### ✅ Buenas Prácticas
- Actualizar bodega regularmente (al menos una vez al día)
- Agregar notas descriptivas en actualizaciones importantes
- Verificar movimientos antes de cerrar sesión
- Revisar estadísticas del dashboard diariamente

### ⚠️ Evitar
- No cerrar el navegador sin cerrar sesión
- No compartir credenciales entre usuarios
- No modificar datos directamente en la base de datos
- No usar caracteres especiales en notas

## 🔄 Actualización del Sistema

Cuando haya una nueva versión:

1. Hacer backup de la base de datos
2. Descargar nueva versión
3. Copiar archivo `.env` a la nueva versión
4. Ejecutar `npm install`
5. Iniciar servidor

## 📞 Soporte

Para soporte técnico o reportar problemas:
- Documentar el error (captura de pantalla)
- Anotar los pasos para reproducir el problema
- Contactar al equipo de desarrollo

---

**¡Listo! Ya puedes comenzar a usar el sistema de Control de Charolas 🚀**
