const crypto = require('crypto');
const { saveOrder } = require('./database');

const WEBPAY_BASE_URLS = {
  integration: 'https://webpay3gint.transbank.cl',
  production: 'https://webpay3g.transbank.cl'
};

const WEBPAY_INTEGRATION_KEYS = {
  commerceCode: '597055555532',
  apiKey: '579B46454561A64EEC68B4556F759FFE60990E75'
};

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
    }
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

function getReturnUrl(req) {
  if (process.env.WEBPAY_RETURN_URL) {
    return process.env.WEBPAY_RETURN_URL;
  }

  const host = req.headers.host || `localhost:${process.env.PORT || 8000}`;
  return `http://${host}/index.html`;
}

function getWebpayConfig() {
  const mode = String(process.env.WEBPAY_ENV || 'integration').toLowerCase();

  if (mode === 'production') {
    if (!process.env.WEBPAY_COMMERCE_CODE || !process.env.WEBPAY_API_KEY) {
      return {
        enabled: false,
        reason: 'Para producción debes definir WEBPAY_COMMERCE_CODE y WEBPAY_API_KEY en .env'
      };
    }

    return {
      enabled: true,
      mode,
      baseUrl: WEBPAY_BASE_URLS.production,
      commerceCode: process.env.WEBPAY_COMMERCE_CODE,
      apiKey: process.env.WEBPAY_API_KEY
    };
  }

  return {
    enabled: true,
    mode: 'integration',
    baseUrl: WEBPAY_BASE_URLS.integration,
    commerceCode: WEBPAY_INTEGRATION_KEYS.commerceCode,
    apiKey: WEBPAY_INTEGRATION_KEYS.apiKey
  };
}

function formatMySqlDate(isoValue) {
  const date = new Date(isoValue || Date.now());
  const YYYY = date.getUTCFullYear();
  const MM = String(date.getUTCMonth() + 1).padStart(2, '0');
  const DD = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
}

function parseRequestJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (_error) {
        reject(buildError('JSON inválido.', 400));
      }
    });

    req.on('error', () => {
      reject(buildError('Error leyendo la solicitud.', 500));
    });
  });
}

async function callWebpay({ endpoint, method, body, config }) {
  const response = await fetch(`${config.baseUrl}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Tbk-Api-Key-Id': config.commerceCode,
      'Tbk-Api-Key-Secret': config.apiKey
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = responseData.error_message || responseData.message || 'Error al comunicarse con Webpay.';
    throw buildError(message, response.status);
  }

  return responseData;
}

async function handleCheckout(req, res) {
  try {
    const payload = await parseRequestJson(req);
    const { customer, order } = validatePayload(payload);

    const webpay = getWebpayConfig();
    if (!webpay.enabled) {
      throw buildError(webpay.reason, 503);
    }

    const buyOrder = generateBuyOrder();
    const sessionId = generateSessionId();
    const returnUrl = getReturnUrl(req);

    const response = await callWebpay({
      endpoint: '/rswebpaytransaction/api/webpay/v1.2/transactions',
      method: 'POST',
      body: {
        buy_order: buyOrder,
        session_id: sessionId,
        amount: order.total,
        return_url: returnUrl
      },
      config: webpay
    });

    sendJson(res, 200, {
      ok: true,
      message: 'Transacción Webpay creada. Redirigiendo a Transbank.',
      webpay: {
        token: response.token,
        url: response.url,
        buy_order: buyOrder,
        session_id: sessionId,
        amount: order.total,
        return_url: returnUrl,
        mode: webpay.mode
      },
      checkout: {
        customer,
        order
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? 'No se pudo iniciar el pago con Webpay.' : error.message;
    sendJson(res, statusCode, { ok: false, error: message });
  }
}

async function handleWebpayCommit(req, res) {
  try {
    const payload = await parseRequestJson(req);
    const token = typeof payload.token_ws === 'string' ? payload.token_ws.trim() : '';

    if (!token) {
      throw buildError('token_ws es obligatorio para confirmar la transacción.', 422);
    }

    const { customer, order } = validatePayload(payload);
    const webpay = getWebpayConfig();
    if (!webpay.enabled) {
      throw buildError(webpay.reason, 503);
    }

    const commitResult = await callWebpay({
      endpoint: `/rswebpaytransaction/api/webpay/v1.2/transactions/${token}`,
      method: 'PUT',
      config: webpay
    });

    const paymentResult = {
      status: commitResult.status,
      response_code: commitResult.response_code,
      authorization_code: commitResult.authorization_code || null,
      amount: commitResult.amount,
      transaction_date: formatMySqlDate(commitResult.transaction_date),
      installments_number: commitResult.installments_number || 0,
      installments_amount: commitResult.installments_amount || 0,
      card_detail: commitResult.card_detail || null
    };

    const orderResponse = {
      buy_order: commitResult.buy_order,
      session_id: commitResult.session_id,
      token,
      amount: commitResult.amount,
      currency: order.currency,
      items_count: order.items.length,
      items: order.items
    };

    const dbStatus = await saveOrder({
      customer,
      order: orderResponse,
      payment: paymentResult
    });

    const isAuthorized = commitResult.status === 'AUTHORIZED' && Number(commitResult.response_code) === 0;

    sendJson(res, 200, {
      ok: true,
      message: isAuthorized
        ? 'Pago autorizado con Webpay Plus. Pedido confirmado para ejecución.'
        : 'Webpay devolvió una transacción no autorizada. Revisa el detalle e intenta nuevamente.',
      customer,
      order: {
        ...orderResponse,
        database_order_id: dbStatus.orderId || null
      },
      payment: paymentResult,
      database: dbStatus,
      webpay_raw: commitResult
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? 'No se pudo confirmar el pago en Webpay.' : error.message;
    sendJson(res, statusCode, { ok: false, error: message });
  }
}

module.exports = { handleCheckout, handleWebpayCommit };
