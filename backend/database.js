let pool;

function getDbConfigFromEnv() {
  const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    return { enabled: false, reason: `Faltan variables de entorno: ${missing.join(', ')}` };
  }

  return {
    enabled: true,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
    queueLimit: 0
  };
}

function loadMysqlDriver() {
  try {
    return require('mysql2/promise');
  } catch (error) {
    return null;
  }
}

function getPool() {
  const config = getDbConfigFromEnv();
  if (!config.enabled) {
    return { pool: null, reason: config.reason };
  }

  const mysql = loadMysqlDriver();
  if (!mysql) {
    return {
      pool: null,
      reason: 'No se encontró el paquete mysql2. Ejecuta: npm install mysql2'
    };
  }

  if (!pool) {
    pool = mysql.createPool(config);
  }

  return { pool, reason: null };
}

async function saveOrder({ customer, order, payment }) {
  const { pool: currentPool, reason } = getPool();

  if (!currentPool) {
    return {
      persisted: false,
      reason
    };
  }

  const connection = await currentPool.getConnection();

  try {
    await connection.beginTransaction();

    const [orderResult] = await connection.execute(
      `INSERT INTO orders (
        buy_order,
        session_id,
        token,
        customer_nombre,
        customer_apellido,
        customer_correo,
        customer_telefono,
        customer_empresa,
        customer_comentarios,
        total,
        currency,
        payment_status,
        payment_response_code,
        payment_authorization_code,
        transaction_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.buy_order,
        order.session_id,
        order.token,
        customer.nombre,
        customer.apellido,
        customer.correo,
        customer.telefono,
        customer.empresa,
        customer.comentarios,
        order.amount,
        order.currency,
        payment.status,
        payment.response_code,
        payment.authorization_code,
        payment.transaction_date
      ]
    );

    const orderId = orderResult.insertId;

    for (const item of order.items) {
      await connection.execute(
        `INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          product_type,
          unit_price,
          quantity,
          line_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.id,
          item.name,
          item.type || null,
          item.price,
          item.qty,
          item.price * item.qty
        ]
      );
    }

    await connection.commit();

    return { persisted: true, orderId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  getPool,
  saveOrder,
  getDbConfigFromEnv
};
