let cartItems = [];

function validatePhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function renderOrderReview() {
  const review = document.getElementById("orderReview");
  if (!review) return;
  if (!cartItems.length) {
    review.innerHTML = '<p class="muted">No items in cart.</p>';
    return;
  }

  let total = 0;
  review.innerHTML =
    cartItems
      .map((item) => {
        const product = item.product;
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
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFieldErrors(form);
    const success = document.getElementById("codSuccess");
    success.textContent = "";

    const fullName = form.fullName.value.trim();
    const phone = form.phone.value.trim();
    const address = form.address.value.trim();
    const notes = form.notes.value.trim();

    let hasError = false;
    if (fullName.length < 2) {
      document.getElementById("fullNameError").textContent = "Enter a valid full name.";
      hasError = true;
    }
    if (!validatePhone(phone)) {
      document.getElementById("phoneError").textContent = "Enter a valid phone number (10–15 digits).";
      hasError = true;
    }
    if (address.length < 8) {
      document.getElementById("addressError").textContent = "Address must be at least 8 characters.";
      hasError = true;
    }
    if (!cartItems.length) {
      document.getElementById("addressError").textContent = "Cart is empty.";
      hasError = true;
    }
    if (hasError) return;

    try {
      const data = await apiFetch("/api/shop/orders", {
        method: "POST",
        body: { fullName, phone, address, notes }
      });
      success.textContent = data.message;
      form.reset();
      cartItems = [];
      renderOrderReview();
    } catch (err) {
      if (err.fieldErrors) showFieldErrors(form, err.fieldErrors);
      else document.getElementById("addressError").textContent = err.message;
    }
  });
}

async function initCheckout() {
  try {
    cartItems = await apiFetch("/api/shop/cart");
  } catch (err) {
    if (err.status === 401) {
      window.location.href = "/login";
      return;
    }
    cartItems = [];
  }
  renderOrderReview();
  setupCheckout();
}

initCheckout().catch(() => {});
onCurrencyChange(renderOrderReview);
