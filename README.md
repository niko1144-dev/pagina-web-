# WebVentas Chile - Base comercial de desarrollo web (HTML + CSS + JS + Node.js)

Proyecto profesional y reutilizable para vender servicios de creación de páginas web personalizadas en Chile.
Incluye catálogo de servicios, planes, carrito funcional, checkout validado, formulario de contacto y backend en Node.js con simulación de pago preparada para integrar Webpay Plus de Transbank.

## 1) Estructura de archivos

```txt
.
├── index.html
├── style.css
├── script.js
├── backend/
│   ├── checkout.js
│   └── database.js
├── database/
│   └── schema.sql
├── .env.example
├── server.js
└── README.md
```

## 2) ¿Qué incluye esta base funcional?

- **Landing comercial completa** con enfoque de conversión.
- **Header fijo** con navegación y CTA.
- **Hero principal** con propuesta de valor y botones de acción.
- **Sección de servicios** con tarjetas y precios en CLP.
- **Catálogo de planes** tipo producto con opción recomendado.
- **Carrito funcional (JS)**:
  - Agregar productos
  - Eliminar productos
  - Vaciar carrito
  - Cálculo de subtotal/total y resumen de pedido
- **Checkout validado**:
  - Nombre, Apellido, Correo, Teléfono, Empresa, Comentarios
  - Validaciones HTML5 + validación backend
- **Pago simulado funcional (Opción B)**:
  - Simular éxito o rechazo
  - Respuesta estructurada similar a una transacción
- **Persistencia híbrida (MySQL + Local)**:
  - Guarda pedidos en MySQL (`orders` y `order_items`) cuando hay credenciales
  - Si no hay credenciales SQL, guarda en base local JSON (`database/local-orders.json`)
  - Compatible con hosting SQL estándar como BenzaHosting y desarrollo local sin DB externa
- **Secciones comerciales adicionales**:
  - Cómo trabajamos
  - Portafolio ficticio por rubro
  - Testimonios
  - FAQ
  - Footer completo

## 3) Ejecución local

### Requisitos
- Node.js 18+ (recomendado 20 o superior)
- Dependencias instaladas:

```bash
npm install
```

### Pasos
1. Copia variables de entorno:

```bash
cp .env.example .env
```

2. Configura tus credenciales SQL en `.env`.
3. Levanta servidor:

```bash
node server.js
```

4. Abre en navegador:

```txt
http://localhost:8000/index.html
```

## 4) Configurar SQL en BenzaHosting

1. En cPanel de BenzaHosting crea:
   - Base de datos MySQL
   - Usuario MySQL
   - Asigna permisos ALL PRIVILEGES al usuario
2. Importa `database/schema.sql` en phpMyAdmin.
3. En tu servidor Node configura variables de entorno:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=tu_base_de_datos
DB_USER=tu_usuario
DB_PASSWORD=tu_password
```

4. Instala dependencia del driver (si no está instalada):

```bash
npm install mysql2
```

5. Reinicia tu app Node.

> Si las variables no están configuradas, el checkout sigue funcionando y ahora guarda automáticamente los pedidos en una base local JSON: `database/local-orders.json`.

## 5) Flujo de compra y checkout

1. El usuario agrega servicios/planes al carrito.
2. El frontend calcula montos y genera resumen dinámico.
3. En checkout se validan campos obligatorios.
4. Se envía payload JSON al endpoint `POST /api/checkout`.
5. El backend:
   - Valida cliente
   - Valida ítems y total
   - Genera `buy_order`, `session_id` y token simulado
   - Simula autorización/rechazo de pago
   - Inserta pedido en SQL (si DB está configurada)

## 6) Integración de Webpay Plus (ambiente de pruebas)

La implementación actual de pago es simulada para venta de demos. La capa SQL ya está lista para guardar estado transaccional.

## 7) Archivos clave para edición rápida

- `index.html`: estructura de contenido comercial y secciones.
- `style.css`: estilos, responsividad y apariencia moderna.
- `script.js`: carrito, resumen, validaciones frontend y conexión backend.
- `backend/checkout.js`: validaciones de servidor, simulación y persistencia SQL.
- `backend/database.js`: conexión MySQL y transacción de guardado.
- `database/schema.sql`: esquema SQL inicial.
- `server.js`: servidor HTTP en Node.js para frontend + endpoint `/api/checkout`.
