# Demo de checkout (HTML + CSS + JS + PHP)

Este proyecto es una demo mínima y funcional de un flujo de checkout.

## Estructura del proyecto

- `index.html`: interfaz principal con formulario de pago.
- `style.css`: estilos visuales de la pantalla.
- `script.js`: validación en cliente y llamada `fetch` al backend.
- `backend/checkout.php`: endpoint que valida y simula el cobro.

## Requisitos

- Servidor web con PHP 8+ (recomendado).

## Ejecución local rápida

Desde la raíz del proyecto:

```bash
php -S localhost:8000
```

Luego abre:

- `http://localhost:8000/index.html`

## Flujo funcional

1. El usuario completa nombre, email y monto.
2. `script.js` valida los campos en navegador.
3. Se envía un `POST` JSON a `backend/checkout.php`.
4. El backend valida los datos y retorna JSON:
   - éxito: `ok`, `transaccionId`, datos del cliente y monto.
   - error: mensaje en `error` con código HTTP adecuado.

## Ejemplo de request

```json
{
  "nombre": "Ana Pérez",
  "email": "ana@example.com",
  "monto": 49.99
}
```

## Ejemplo de respuesta exitosa

```json
{
  "ok": true,
  "transaccionId": "TX-1A2B3C4D",
  "nombre": "Ana Pérez",
  "email": "ana@example.com",
  "monto": 49.99,
  "mensaje": "Pago procesado correctamente."
}
```

## Notas

- Todos los archivos del proyecto son texto plano (sin binarios).
- No se incluyen imágenes, zips ni artefactos generados automáticamente.
