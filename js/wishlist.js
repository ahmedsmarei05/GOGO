let mapProducts = new Map();

function renderWishlist() {
  const grid = document.getElementById("wishlistGrid");
  if (!grid) return;
  const wishlist = getUserMapData(STORAGE_KEYS.wishlist);
  if (!wishlist.length) {
    grid.innerHTML = '<p class="muted">Your wishlist is empty.</p>';
    return;
  }
  grid.innerHTML = wishlist
    .map((id) => mapProducts.get(id))
    .filter(Boolean)
    .map(
      (product) => `
      <article class="card product-card">
        <a href="./product.html?id=${product.id}"><img class="product-image" src="${product.image}" alt="${product.name}" /></a>
        <div class="product-body">
          <div class="product-top">
            <strong><a href="./product.html?id=${product.id}">${product.name}</a></strong>
            <span>${currency(product.price)}</span>
          </div>
          <p class="muted">${product.category}</p>
          <div class="product-actions">
            <a class="btn btn-secondary" href="./product.html?id=${product.id}">Sizes & details</a>
            <button class="btn btn-primary" data-action="cart" data-id="${product.id}">Quick add (M)</button>
            <button class="btn btn-secondary" data-action="remove" data-id="${product.id}">Remove</button>
          </div>
        </div>
      </article>`
    )
    .join("");
}

function addToCartFromWishlist(productId) {
  const product = mapProducts.get(productId);
  if (!product) return;
  const user = ensureAuth(["user", "admin"]);
  if (!user) return;
  const size = "M";
  const cart = getUserMapData(STORAGE_KEYS.cart);
  const existing = cart.find((x) => x.productId === productId && (x.size || "M") === size);
  if (existing) existing.quantity += 1;
  else cart.push({ productId, quantity: 1, size });
  setUserMapData(STORAGE_KEYS.cart, cart);
  showCartToast(`${product.name} (size ${size}) added to your cart.`);
}

function removeFromWishlist(productId) {
  const wishlist = getUserMapData(STORAGE_KEYS.wishlist).filter((id) => id !== productId);
  setUserMapData(STORAGE_KEYS.wishlist, wishlist);
  renderWishlist();
}

async function initWishlist() {
  ensureAuth(["user", "admin"]);
  const products = await fetchProducts();
  mapProducts = new Map(products.map((p) => [p.id, p]));
  renderWishlist();
  const grid = document.getElementById("wishlistGrid");
  if (!grid) return;
  grid.addEventListener("click", (event) => {
    const target = event.target;
    const action = target.getAttribute("data-action");
    const id = Number(target.getAttribute("data-id"));
    if (!action || !id) return;
    if (action === "cart") addToCartFromWishlist(id);
    if (action === "remove") removeFromWishlist(id);
  });
}

initWishlist().catch(() => {});
