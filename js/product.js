function getQueryId() {
  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get("id"));
  return Number.isFinite(id) ? id : null;
}

function addToCartWithSize(product, size) {
  const user = ensureAuth(["user", "admin"]);
  if (!user) return;
  const cart = getUserMapData(STORAGE_KEYS.cart);
  const existing = cart.find((item) => item.productId === product.id && (item.size || "M") === size);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ productId: product.id, quantity: 1, size });
  }
  setUserMapData(STORAGE_KEYS.cart, cart);
  showCartToast(`${product.name} (size ${size}) added to your cart.`);
}

function toggleWishlistProduct(product) {
  const user = ensureAuth(["user", "admin"]);
  if (!user) return;
  const wishlist = getUserMapData(STORAGE_KEYS.wishlist);
  const idx = wishlist.indexOf(product.id);
  if (idx >= 0) wishlist.splice(idx, 1);
  else wishlist.push(product.id);
  setUserMapData(STORAGE_KEYS.wishlist, wishlist);
  const btn = document.getElementById("wishToggle");
  const nowIn = wishlist.includes(product.id);
  if (btn) btn.textContent = nowIn ? "Remove from wishlist" : "Add to wishlist";
}

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
        <p id="sizeError" class="error"></p>
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
  const products = await fetchProducts();
  const product = products.find((p) => p.id === id);
  if (!product) {
    if (root) root.innerHTML = '<p class="error">Product not found.</p>';
    return;
  }
  const wishlist = getUserMapData(STORAGE_KEYS.wishlist);
  renderProduct(product, wishlist.includes(product.id));
}

initProductPage().catch(() => {
  const root = document.getElementById("productRoot");
  if (root) root.innerHTML = '<p class="error">Could not load product.</p>';
});
