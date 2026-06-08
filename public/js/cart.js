let cartItems = [];

function renderCart() {
  const list = document.getElementById("cartList");
  const subtotalEl = document.getElementById("subtotal");
  if (!list || !subtotalEl) return;

  if (!cartItems.length) {
    list.innerHTML = '<p class="muted">Your cart is empty.</p>';
    subtotalEl.textContent = currency(0);
    return;
  }

  let subtotal = 0;
  list.innerHTML = cartItems
    .map((item) => {
      const product = item.product;
      if (!product) return "";
      const size = item.size || "M";
      const total = product.price * item.quantity;
      subtotal += total;
      return `
        <div class="cart-item">
          <img src="${product.image}" alt="${product.name}" />
          <div>
            <strong>${product.name}</strong>
            <p class="muted">${currency(product.price)} each · Size ${size}</p>
            <div class="qty-box">
              <button class="btn btn-secondary" data-action="decrease" data-id="${product.id}" data-size="${size}">-</button>
              <span>${item.quantity}</span>
              <button class="btn btn-secondary" data-action="increase" data-id="${product.id}" data-size="${size}">+</button>
              <button class="btn btn-secondary" data-action="remove" data-id="${product.id}" data-size="${size}">Remove</button>
            </div>
          </div>
          <strong>${currency(total)}</strong>
        </div>
      `;
    })
    .join("");
  subtotalEl.textContent = currency(subtotal);
}

async function updateQuantity(productId, size, action) {
  await apiFetch("/api/shop/cart", {
    method: "PATCH",
    body: { productId, size, action }
  });
  cartItems = await apiFetch("/api/shop/cart");
  renderCart();
}

async function initCart() {
  try {
    cartItems = await apiFetch("/api/shop/cart");
  } catch (err) {
    if (err.status === 401) {
      window.location.href = "/login";
      return;
    }
    cartItems = [];
  }
  renderCart();

  const list = document.getElementById("cartList");
  if (list) {
    list.addEventListener("click", (event) => {
      const target = event.target;
      const action = target.getAttribute("data-action");
      const id = target.getAttribute("data-id");
      const size = target.getAttribute("data-size") || "M";
      if (action && id) updateQuantity(id, size, action);
    });
  }

  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      if (!cartItems.length) {
        showGogoToast("Your cart is empty. Add something lovely first.", "GOGO");
        return;
      }
      window.location.href = "/checkout";
    });
  }
}

initCart().catch(() => {});
onCurrencyChange(renderCart);
