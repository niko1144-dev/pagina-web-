const cart = [];

const cartItemsEl = document.getElementById('cart-items');
const subtotalEl = document.getElementById('subtotal');
const totalEl = document.getElementById('total');
const summaryListEl = document.getElementById('order-summary');
const summaryTotalEl = document.getElementById('summary-total');
const resultEl = document.getElementById('checkout-result');
const checkoutForm = document.getElementById('checkout-form');

const currencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0
});

function formatCLP(value) {
  return currencyFormatter.format(value);
}

function getTotal() {
  return cart.reduce((acc, item) => acc + item.price * item.qty, 0);
}

function renderCart() {
  if (!cartItemsEl || !summaryListEl) {
    return;
  }

  cartItemsEl.innerHTML = '';
  summaryListEl.innerHTML = '';

  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<li class="cart-item">Tu carrito está vacío. Agrega un servicio o plan.</li>';
    summaryListEl.innerHTML = '<li>Sin productos seleccionados.</li>';
  }

  cart.forEach((item) => {
    const cartRow = document.createElement('li');
    cartRow.className = 'cart-item';
    cartRow.innerHTML = `
      <div>
        <strong>${item.name}</strong>
        <p class="item-meta">Cantidad: ${item.qty}</p>
      </div>
      <div>
        <p>${formatCLP(item.price * item.qty)}</p>
        <button class="btn btn-danger remove-item" data-id="${item.id}" type="button">Eliminar</button>
      </div>
    `;
    cartItemsEl.appendChild(cartRow);

    const summaryItem = document.createElement('li');
    summaryItem.textContent = `${item.qty} x ${item.name} (${formatCLP(item.price * item.qty)})`;
    summaryListEl.appendChild(summaryItem);
  });

  const total = getTotal();
  subtotalEl.textContent = formatCLP(total);
  totalEl.textContent = formatCLP(total);
  summaryTotalEl.textContent = formatCLP(total);
}

function addToCart(product) {
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  renderCart();
}

function removeFromCart(id) {
  const index = cart.findIndex((item) => item.id === id);
  if (index === -1) return;

  if (cart[index].qty > 1) {
    cart[index].qty -= 1;
  } else {
    cart.splice(index, 1);
  }
  renderCart();
}

function showMessage(message, isError = false) {
  resultEl.style.color = isError ? '#ffc9d5' : '#d0f8df';
  resultEl.textContent = message;
}

async function processCheckout(mode) {
  if (!checkoutForm.checkValidity()) {
    checkoutForm.reportValidity();
    showMessage('❌ Revisa los campos del formulario antes de continuar.', true);
    return;
  }

  if (cart.length === 0) {
    showMessage('❌ Debes agregar al menos un servicio o plan al carrito.', true);
    return;
  }

  const formData = new FormData(checkoutForm);
  const payload = {
    customer: {
      nombre: String(formData.get('nombre') || '').trim(),
      apellido: String(formData.get('apellido') || '').trim(),
      correo: String(formData.get('correo') || '').trim(),
      telefono: String(formData.get('telefono') || '').trim(),
      empresa: String(formData.get('empresa') || '').trim(),
      comentarios: String(formData.get('comentarios') || '').trim()
    },
    order: {
      items: cart,
      total: getTotal(),
      currency: 'CLP'
    },
    payment_simulation: mode
  };

  showMessage('Procesando solicitud y simulación de pago...');

  try {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'No se pudo procesar la solicitud.');
    }

    const statusLabel = data.payment?.status === 'AUTHORIZED' ? '✅ Pago exitoso' : '⚠️ Pago rechazado';

    showMessage(
      `${statusLabel}\n` +
        `Orden: ${data.order?.buy_order}\n` +
        `Token: ${data.order?.token}\n` +
        `Cliente: ${data.customer?.nombre} ${data.customer?.apellido}\n` +
        `Total: ${formatCLP(data.order?.amount || 0)}\n` +
        `Mensaje: ${data.message}`,
      data.payment?.status !== 'AUTHORIZED'
    );

    if (data.payment?.status === 'AUTHORIZED') {
      checkoutForm.reset();
      cart.length = 0;
      renderCart();
    }
  } catch (error) {
    showMessage(`❌ ${error.message}`, true);
  }
}

function bindEvents() {
  document.querySelectorAll('.add-to-cart').forEach((button) => {
    button.addEventListener('click', () => {
      const card = button.closest('.product-card');
      if (!card) return;

      const product = {
        id: card.dataset.id,
        name: card.dataset.name,
        type: card.dataset.type,
        price: Number(card.dataset.price)
      };

      addToCart(product);
      button.textContent = 'Agregado ✓';
      setTimeout(() => {
        button.textContent = 'Agregar al carrito';
      }, 900);
    });
  });

  cartItemsEl.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches('.remove-item')) {
      removeFromCart(target.dataset.id);
    }
  });

  document.getElementById('clear-cart').addEventListener('click', () => {
    cart.length = 0;
    renderCart();
  });

  checkoutForm.addEventListener('submit', (event) => {
    event.preventDefault();
    processCheckout('success');
  });

  document.getElementById('pay-fail').addEventListener('click', () => processCheckout('fail'));
}

function bootstrap() {
  document.getElementById('year').textContent = new Date().getFullYear();
  renderCart();
  bindEvents();
}

bootstrap();
