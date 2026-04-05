const form = document.getElementById('checkout-form');
const submitBtn = document.getElementById('submit-btn');
const resultBox = document.getElementById('result');

function setResult(message, isError = false) {
  resultBox.textContent = message;
  resultBox.style.color = isError ? '#b91c1c' : '#1f2937';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!form.checkValidity()) {
    setResult('Revisa el formulario: hay campos inválidos.', true);
    form.reportValidity();
    return;
  }

  const payload = {
    nombre: form.nombre.value.trim(),
    email: form.email.value.trim(),
    monto: Number(form.monto.value)
  };

  submitBtn.disabled = true;
  setResult('Procesando pago...');

  try {
    const response = await fetch('backend/checkout.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'No se pudo completar el pago.');
    }

    setResult(
      `✅ Pago aprobado\nID Transacción: ${data.transaccionId}\nCliente: ${data.nombre}\nMonto: $${data.monto.toFixed(2)}`
    );
    form.reset();
  } catch (error) {
    setResult(`❌ ${error.message}`, true);
  } finally {
    submitBtn.disabled = false;
  }
});
