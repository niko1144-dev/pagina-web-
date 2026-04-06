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
│   └── checkout.js
├── server.js
└── README.md
```

> Todos los archivos son texto plano y están listos para editar y reutilizar.

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
- **Secciones comerciales adicionales**:
  - Cómo trabajamos
  - Portafolio ficticio por rubro
  - Testimonios
  - FAQ
  - Footer completo
- **SEO básico**:
  - meta description, keywords, author, robots y Open Graph
- **Botones de WhatsApp** en flotante y CTA final.

## 3) Ejecución local

### Requisitos
- Node.js 18+ (recomendado 20 o superior)

### Pasos
1. Abre una terminal en la raíz del proyecto.
2. Ejecuta:

```bash
node server.js
```

3. Abre en navegador:

```txt
http://localhost:8000/index.html
```

## 4) Flujo de compra y checkout

1. El usuario agrega servicios/planes al carrito.
2. El frontend calcula montos y genera resumen dinámico.
3. En checkout se validan campos obligatorios.
4. Se envía payload JSON al endpoint `POST /api/checkout`.
5. El backend:
   - Valida cliente
   - Valida ítems y total
   - Genera `buy_order`, `session_id` y token simulado
   - Responde pago simulado exitoso o rechazado

## 5) Integración de Webpay Plus (ambiente de pruebas)

La implementación actual es simulada para que puedas vender demos sin credenciales reales.

### ¿Cómo conectarlo a Webpay real?

1. Instala SDK oficial:
   ```bash
   composer require transbank/transbank-sdk
   ```
2. Crea método real para **crear transacción** (`create`) y **confirmar transacción** (`commit`).
3. Reemplaza en `backend/checkout.js` la función `simulatePayment()` por llamadas reales al SDK/API del proveedor.
4. Usa credenciales por entorno (variables de entorno), por ejemplo:
   - `TRANSBANK_COMMERCE_CODE`
   - `TRANSBANK_API_KEY`
5. Define URLs de retorno (`return_url`) para recibir confirmación del pago.
6. Guarda cada transacción en base de datos con estado pendiente/aprobado/rechazado.

### Buenas prácticas
- No subir claves al repositorio.
- Separar configuración de ambientes (integración/producción).
- Registrar logs de intentos y respuestas de la pasarela.
- Validar en backend que total recibido coincide con pedido persistido.

## 6) Preparación para base de datos futura

`backend/checkout.js` incluye validaciones y un flujo simulado con estructura preparada para:
- `orders`
- `order_items`

Más adelante puedes conectar MySQL/PostgreSQL y persistir:
- datos de cliente
- detalle de ítems
- estado de pago
- historial de transacciones

## 7) Personalización para vender a otros rubros

Para transformar esta base en una plantilla comercializable:

1. **Branding por cliente**
   - Cambia logo/nombre, paleta de colores y tipografías.
2. **Catálogo adaptable**
   - Reemplaza planes y servicios según industria (salud, legal, educación, etc.).
3. **Módulos reutilizables**
   - Activa/desactiva secciones (testimonios, FAQ, portafolio) según proyecto.
4. **Integraciones por vertical**
   - Reservas (salud, belleza)
   - Cotizaciones (construcción, industria)
   - E-commerce (retail)
5. **Upselling técnico**
   - Mantenimiento mensual
   - SEO continuo
   - Automatización de ventas y CRM

## 8) Archivos clave para edición rápida

- `index.html`: estructura de contenido comercial y secciones.
- `style.css`: estilos, responsividad y apariencia moderna.
- `script.js`: carrito, resumen, validaciones frontend y conexión backend.
- `backend/checkout.js`: validaciones de servidor y flujo de pago simulado/preparado para Webpay.
- `server.js`: servidor HTTP en Node.js para servir frontend + endpoint `/api/checkout`.

---

Si quieres, como siguiente paso puedo convertir esta base en:
- versión multi-página,
- plantilla con panel simple de administración,
- o versión conectada a base de datos real + Webpay de pruebas end-to-end.
