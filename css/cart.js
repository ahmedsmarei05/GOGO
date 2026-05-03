let productsMap = new Map();

function getCartItems() {
  return getUserMapData(STORAGE_KEYS.cart);
}

function setCartItems(items) {
  setUserMapData(STORAGE_KEYS.cart, items);
}

function renderCart() {
  const list = document.getElementById("cartList");
  const subtotalEl = document.getElementById("subtotal");
  if (!list || !subtotalEl) return;

  const cart = getCartItems();
  if (!cart.length) {
    list.innerHTML = '<p class="muted">Your cart is empty.</p>';
    subtotalEl.textContent = currency(0);
    return;
  }

  let subtotal = 0;
  list.innerHTML = cart
    .map((item) => {
      const product = productsMap.get(item.productId);
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

function updateQuantity(productId, size, mode) {
  const cart = getCartItems();
  const item = cart.find((i) => i.productId === productId && (i.size || "M") === size);
  if (!item) return;
  if (mode === "increase") item.quantity += 1;
  if (mode === "decrease") item.quantity -= 1;
  if (mode === "remove" || item.quantity <= 0) {
    const idx = cart.findIndex((i) => i.productId === productId && (i.size || "M") === size);
    cart.splice(idx, 1);
  }
  setCartItems(cart);
  renderCart();
}

async function initCart() {
  ensureAuth(["user", "admin"]);
  const products = await fetchProducts();
  productsMap = new Map(products.map((p) => [p.id, p]));
  renderCart();

  const list = document.getElementById("cartList");
  if (list) {
    list.addEventListener("click", (event) => {
      const target = event.target;
      const action = target.getAttribute("data-action");
      const id = Number(target.getAttribute("data-id"));
      const size = target.getAttribute("data-size") || "M";
      if (action && id) updateQuantity(id, size, action);
    });
  }

  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      if (!getCartItems().length) {
        showGogoToast("Your cart is empty. Add something lovely first.", "GOGO");
        return;
      }
      window.location.href = "./checkout.html";
    });
  }
}

initCart().catch(() => {});
