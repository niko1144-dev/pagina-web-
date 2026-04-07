CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  buy_order VARCHAR(40) NOT NULL,
  session_id VARCHAR(40) NOT NULL,
  token VARCHAR(64) NOT NULL,
  customer_nombre VARCHAR(120) NOT NULL,
  customer_apellido VARCHAR(120) NOT NULL,
  customer_correo VARCHAR(190) NOT NULL,
  customer_telefono VARCHAR(50) NOT NULL,
  customer_empresa VARCHAR(190) NOT NULL,
  customer_comentarios TEXT,
  total INT NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'CLP',
  payment_status VARCHAR(32) NOT NULL,
  payment_response_code INT NOT NULL,
  payment_authorization_code VARCHAR(32),
  transaction_date DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_buy_order (buy_order),
  INDEX idx_customer_correo (customer_correo)
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id VARCHAR(60) NOT NULL,
  product_name VARCHAR(190) NOT NULL,
  product_type VARCHAR(80),
  unit_price INT NOT NULL,
  quantity INT NOT NULL,
  line_total INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
