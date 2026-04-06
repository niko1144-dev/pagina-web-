const crypto = require('crypto');

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function buildError(message, statusCode) {
  return { message, statusCode };
}

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw buildError('JSON inválido.', 400);
  }

  const customer = payload.customer;
  const order = payload.order;

  if (!customer || typeof customer !== 'object' || Array.isArray(customer)) {
    throw buildError('Estructura de cliente inválida.', 422);
  }

  if (!order || typeof order !== 'object' || Array.isArray(order)) {
    throw buildError('Estructura de pedido inválida.', 422);
  }

  const requiredCustomerFields = ['nombre', 'apellido', 'correo', 'telefono', 'empresa'];
  for (const field of requiredCustomerFields) {
    if (!customer[field] || typeof customer[field] !== 'string' || customer[field].trim().length === 0) {
      throw buildError(`El campo ${field} es obligatorio.`, 422);
    }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customer.correo.trim())) {
    throw buildError('El correo ingresado no es válido.', 422);
  }

  if (!Array.isArray(order.items) || order.items.length === 0) {
    throw buildError('No hay ítems en el carrito.', 422);
  }

  const total = Number(order.total);
  if (!Number.isFinite(total) || total <= 0) {
    throw buildError('El total del pedido es inválido.', 422);
  }

  let calculatedTotal = 0;
  for (const item of order.items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw buildError('Formato de ítems inválido.', 422);
    }

    const price = Number(item.price);
    const qty = Number(item.qty);
    const name = typeof item.name === 'string' ? item.name.trim() : '';

    if (!Number.isInteger(price) || !Number.isInteger(qty) || price <= 0 || qty <= 0 || !name) {
      throw buildError('Hay productos con datos inválidos.', 422);
    }

    calculatedTotal += price * qty;
  }

  if (calculatedTotal !== total) {
    throw buildError('El total del pedido no coincide con la suma de los ítems.', 422);
  }

  return {
    customer: {
      nombre: customer.nombre.trim(),
      apellido: customer.apellido.trim(),
      correo: customer.correo.trim(),
      telefono: customer.telefono.trim(),
      empresa: customer.empresa.trim(),
      comentarios: typeof customer.comentarios === 'string' ? customer.comentarios.trim() : ''
    },
    order: {
      items: order.items,
      total,
      currency: typeof order.currency === 'string' ? order.currency : 'CLP'
    },
    simulationMode: String(payload.payment_simulation || 'success')
  };
}

function generateSessionId() {
  return `SES-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function generateBuyOrder() {
  const now = new Date();
  const YYYY = now.getUTCFullYear();
  const MM = String(now.getUTCMonth() + 1).padStart(2, '0');
  const DD = String(now.getUTCDate()).padStart(2, '0');
  const hh = String(now.getUTCHours()).padStart(2, '0');
  const mm = String(now.getUTCMinutes()).padStart(2, '0');
  const ss = String(now.getUTCSeconds()).padStart(2, '0');

  return `ORD-${YYYY}${MM}${DD}${hh}${mm}${ss}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function generateToken() {
  return `SIM-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}

function simulatePayment(mode, amount) {
  const authorized = mode.toLowerCase() !== 'fail';

  return {
    status: authorized ? 'AUTHORIZED' : 'FAILED',
    response_code: authorized ? 0 : -1,
    authorization_code: authorized ? String(Math.floor(100000 + Math.random() * 900000)) : null,
    amount,
    transaction_date: new Date().toISOString(),
    installments_number: 0,
    installments_amount: 0
  };
}

function handleCheckout(req, res) {
  let body = '';

  req.on('data', (chunk) => {
    body += chunk;

    if (body.length > 1_000_000) {
      req.destroy();
    }
  });

  req.on('end', () => {
    try {
      const payload = JSON.parse(body || '{}');
      const { customer, order, simulationMode } = validatePayload(payload);
      const paymentResult = simulatePayment(simulationMode, order.total);

      sendJson(res, 200, {
        ok: true,
        message:
          paymentResult.status === 'AUTHORIZED'
            ? 'Pago simulado como exitoso. Pedido listo para ejecución del proyecto.'
            : 'Pago simulado como rechazado. Puedes reintentar o solicitar asistencia.',
        customer,
        order: {
          buy_order: generateBuyOrder(),
          session_id: generateSessionId(),
          token: generateToken(),
          amount: order.total,
          currency: order.currency,
          items_count: order.items.length
        },
        payment: paymentResult,
        integration_note:
          'Backend en Node.js listo para reemplazar la simulación por una pasarela real usando SDK/API del proveedor de pagos.'
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      const message =
        statusCode === 500 ? 'No se pudo procesar la solicitud.' : error.message || 'Error de validación.';
      sendJson(res, statusCode, { ok: false, error: message });
    }
  });

  req.on('error', () => {
    sendJson(res, 500, { ok: false, error: 'Error leyendo la solicitud.' });
  });
}

module.exports = { handleCheckout };
