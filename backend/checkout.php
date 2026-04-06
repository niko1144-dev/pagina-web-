<?php
declare(strict_types=1);

/**
 * WebVentas Chile - Checkout backend (simulación funcional + base para Webpay Plus).
 *
 * Importante para integración real con Transbank:
 * 1) Instalar SDK oficial: composer require transbank/transbank-sdk
 * 2) Reemplazar la función simulateWebpayTransaction() por createWebpayTransaction() usando el SDK.
 * 3) Mover credenciales a variables de entorno:
 *    - TRANSBANK_COMMERCE_CODE
 *    - TRANSBANK_API_KEY
 * 4) Nunca guardar credenciales reales en el repositorio.
 *
 * Estructura preparada para futura base de datos:
 * - Guardar en tabla orders: buy_order, session_id, amount, customer_data, status, created_at
 * - Guardar en tabla order_items: order_id, item_id, name, qty, unit_price
 */

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido. Use POST.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$rawInput = file_get_contents('php://input');
$payload = json_decode($rawInput ?: '', true);

if (!is_array($payload)) {
    respondError('JSON inválido.', 400);
}

$customer = $payload['customer'] ?? [];
$order = $payload['order'] ?? [];
$simulationMode = (string)($payload['payment_simulation'] ?? 'success');

if (!is_array($customer) || !is_array($order)) {
    respondError('Estructura de payload inválida.', 422);
}

$requiredCustomerFields = ['nombre', 'apellido', 'correo', 'telefono', 'empresa'];
foreach ($requiredCustomerFields as $field) {
    if (empty($customer[$field]) || !is_string($customer[$field])) {
        respondError("El campo {$field} es obligatorio.", 422);
    }
}

if (!filter_var((string)$customer['correo'], FILTER_VALIDATE_EMAIL)) {
    respondError('El correo ingresado no es válido.', 422);
}

$items = $order['items'] ?? [];
$total = (int)($order['total'] ?? 0);

if (!is_array($items) || count($items) === 0) {
    respondError('No hay ítems en el carrito.', 422);
}

$calculatedTotal = 0;
foreach ($items as $item) {
    if (!is_array($item)) {
        respondError('Formato de ítems inválido.', 422);
    }

    $price = (int)($item['price'] ?? 0);
    $qty = (int)($item['qty'] ?? 0);
    $name = trim((string)($item['name'] ?? ''));

    if ($price <= 0 || $qty <= 0 || $name === '') {
        respondError('Hay productos con datos inválidos.', 422);
    }

    $calculatedTotal += $price * $qty;
}

if ($calculatedTotal !== $total) {
    respondError('El total del pedido no coincide con la suma de los ítems.', 422);
}

$sessionId = generateSessionId();
$buyOrder = generateBuyOrder();
$token = generateToken();

// Simulación de Webpay Plus.
// Reemplazar por integración real con SDK al contar con credenciales.
$paymentResult = simulateWebpayTransaction($simulationMode, $total);

$response = [
    'ok' => true,
    'message' => $paymentResult['status'] === 'AUTHORIZED'
        ? 'Pago simulado como exitoso. Pedido listo para ejecución del proyecto.'
        : 'Pago simulado como rechazado. Puedes reintentar o solicitar asistencia.',
    'customer' => [
        'nombre' => trim((string)$customer['nombre']),
        'apellido' => trim((string)$customer['apellido']),
        'correo' => trim((string)$customer['correo']),
        'telefono' => trim((string)$customer['telefono']),
        'empresa' => trim((string)$customer['empresa']),
    ],
    'order' => [
        'buy_order' => $buyOrder,
        'session_id' => $sessionId,
        'token' => $token,
        'amount' => $total,
        'currency' => 'CLP',
        'items_count' => count($items),
    ],
    'payment' => $paymentResult,
    'webpay_integration_note' => 'Para producción: implementar create/commit con SDK oficial de Transbank y credenciales por entorno.'
];

echo json_encode($response, JSON_UNESCAPED_UNICODE);

function respondError(string $message, int $statusCode): void
{
    http_response_code($statusCode);
    echo json_encode(['ok' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function generateSessionId(): string
{
    return 'SES-' . strtoupper(bin2hex(random_bytes(4)));
}

function generateBuyOrder(): string
{
    return 'ORD-' . date('YmdHis') . '-' . random_int(1000, 9999);
}

function generateToken(): string
{
    return 'SIM-' . strtoupper(bin2hex(random_bytes(8)));
}

function simulateWebpayTransaction(string $mode, int $amount): array
{
    $authorized = strtolower($mode) !== 'fail';

    return [
        'status' => $authorized ? 'AUTHORIZED' : 'FAILED',
        'response_code' => $authorized ? 0 : -1,
        'authorization_code' => $authorized ? (string)random_int(100000, 999999) : null,
        'amount' => $amount,
        'transaction_date' => date(DATE_ATOM),
        'installments_number' => 0,
        'installments_amount' => 0,
    ];
}
