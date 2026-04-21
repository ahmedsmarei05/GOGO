let productMap = new Map();

function validatePhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function renderOrderReview() {
  const review = document.getElementById("orderReview");
  if (!review) return;
  const cart = getUserMapData(STORAGE_KEYS.cart);
  if (!cart.length) {
    review.innerHTML = '<p class="muted">No items in cart.</p>';
    return;
  }

  let total = 0;
  review.innerHTML =
    cart
      .map((item) => {
        const product = productMap.get(item.productId);
        if (!product) return "";
        const lineTotal = item.quantity * product.price;
        total += lineTotal;
        const size = item.size || "M";
        return `<p>${product.name} <span class="muted">(Size ${size})</span> × ${item.quantity} <strong>${currency(lineTotal)}</strong></p>`;
      })
      .join("") + `<hr /><p><strong>Total: ${currency(total)}</strong></p><p class="muted">Payment: Cash on delivery (COD)</p>`;
}

function setupCheckout() {
  const form = document.getElementById("codForm");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const error = document.getElementById("codError");
    const success = document.getElementById("codSuccess");
    error.textContent = "";
    success.textContent = "";

    const fullName = form.fullName.value.trim();
    const phone = form.phone.value.trim();
    const address = form.address.value.trim();
    const notes = form.notes.value.trim();

    if (fullName.length < 2) return (error.textContent = "Enter a valid full name.");
    if (!validatePhone(phone)) return (error.textContent = "Enter a valid phone number (10–15 digits).");
    if (address.length < 8) return (error.textContent = "Address must be at least 8 characters.");

    const current = getCurrentUser();
    const cart = getUserMapData(STORAGE_KEYS.cart);
    if (!cart.length) return (error.textContent = "Cart is empty.");

    const orders = getData(STORAGE_KEYS.orders, []);
    orders.push({
      id: `ORD-${Date.now()}`,
      userId: current.id,
      userName: current.name,
      userEmail: current.email,
      phone,
      address,
      notes: notes || null,
      items: cart.map((i) => ({ ...i, size: i.size || "M" })),
      createdAt: new Date().toISOString(),
      paymentMethod: "COD",
      status: "Pending (COD)"
    });
    setData(STORAGE_KEYS.orders, orders);
    setUserMapData(STORAGE_KEYS.cart, []);
    success.textContent = "Order placed. You will pay cash when your package arrives.";
    form.reset();
    renderOrderReview();
  });
}

async function initCheckout() {
  ensureAuth(["user", "admin"]);
  const products = await fetchProducts();
  productMap = new Map(products.map((p) => [p.id, p]));
  renderOrderReview();
  setupCheckout();
}

initCheckout().catch(() => {});
