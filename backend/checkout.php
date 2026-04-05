<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido. Usa POST.']);
    exit;
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput ?? '', true);

if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'JSON inválido.']);
    exit;
}

$nombre = trim((string)($input['nombre'] ?? ''));
$email = trim((string)($input['email'] ?? ''));
$monto = (float)($input['monto'] ?? 0);

if (strlen($nombre) < 3) {
    http_response_code(422);
    echo json_encode(['error' => 'El nombre debe tener al menos 3 caracteres.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['error' => 'El correo electrónico no es válido.']);
    exit;
}

if ($monto <= 0) {
    http_response_code(422);
    echo json_encode(['error' => 'El monto debe ser mayor que 0.']);
    exit;
}

$transaccionId = 'TX-' . strtoupper(bin2hex(random_bytes(4)));

$response = [
    'ok' => true,
    'transaccionId' => $transaccionId,
    'nombre' => $nombre,
    'email' => $email,
    'monto' => round($monto, 2),
    'mensaje' => 'Pago procesado correctamente.'
];

echo json_encode($response, JSON_UNESCAPED_UNICODE);
