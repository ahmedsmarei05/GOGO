function getQueryId() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  return id || null;
}

async function addToCartWithSize(product, size) {
  try {
    const data = await apiFetch("/api/shop/cart", {
      method: "POST",
      body: { productId: product.id, size }
    });
    showCartToast(data.message);
  } catch (err) {
    if (err.status === 401) window.location.href = "/login";
    else showGogoToast(err.message, "Error");
  }
}

async function toggleWishlistProduct(product) {
  try {
    const data = await apiFetch("/api/shop/wishlist/toggle", {
      method: "POST",
      body: { productId: product.id }
    });
    const btn = document.getElementById("wishToggle");
    if (btn) btn.textContent = data.added ? "Remove from wishlist" : "Add to wishlist";
  } catch (err) {
    if (err.status === 401) window.location.href = "/login";
    else showGogoToast(err.message, "Error");
  }
}

let currentProduct = null;
let currentInWishlist = false;

function renderProduct(product, inWishlist) {
  const root = document.getElementById("productRoot");
  if (!root) return;
  document.title = `GOGO | ${product.name}`;
  root.innerHTML = `
    <div class="product-visual card">
      <img src="${product.image}" alt="${product.name}" />
    </div>
    <div class="product-detail">
      <h1>${product.name}</h1>
      <p class="product-meta"><span class="muted">${product.category}</span> · <strong>${currency(product.price)}</strong></p>
      <p>${product.description}</p>
      <form id="sizeForm" novalidate>
        <span class="size-label">Size</span>
        <div class="size-options" role="radiogroup" aria-label="Choose size">
          <label><input type="radio" name="size" value="S" required /><span class="size-pill">S</span></label>
          <label><input type="radio" name="size" value="M" checked /><span class="size-pill">M</span></label>
          <label><input type="radio" name="size" value="L" /><span class="size-pill">L</span></label>
        </div>
        <p id="sizeError" class="error field-error"></p>
        <div class="product-actions">
          <button type="submit" class="btn btn-primary">Add to cart</button>
          <button type="button" class="btn btn-secondary" id="wishToggle">${inWishlist ? "Remove from wishlist" : "Add to wishlist"}</button>
        </div>
      </form>
    </div>`;

  const form = document.getElementById("sizeForm");
  const sizeError = document.getElementById("sizeError");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    sizeError.textContent = "";
    const selected = form.querySelector('input[name="size"]:checked');
    if (!selected) {
      sizeError.textContent = "Please choose a size.";
      return;
    }
    addToCartWithSize(product, selected.value);
  });

  document.getElementById("wishToggle").addEventListener("click", () => {
    toggleWishlistProduct(product);
  });
}

async function initProductPage() {
  const id = getQueryId();
  const root = document.getElementById("productRoot");
  if (!id) {
    if (root) root.innerHTML = '<p class="error">Product not found.</p>';
    return;
  }
  try {
    const product = await apiFetch(`/api/products/${id}`);
    let inWishlist = false;
    try {
      const wishlist = await apiFetch("/api/shop/wishlist");
      inWishlist = wishlist.some((p) => p.id === product.id);
    } catch {
      inWishlist = false;
    }
    renderProduct(product, inWishlist);
    currentProduct = product;
    currentInWishlist = inWishlist;
  } catch {
    if (root) root.innerHTML = '<p class="error">Product not found.</p>';
  }
}

initProductPage().catch(() => {
  const root = document.getElementById("productRoot");
  if (root) root.innerHTML = '<p class="error">Could not load product.</p>';
});
onCurrencyChange(() => {
  if (currentProduct) renderProduct(currentProduct, currentInWishlist);
});
