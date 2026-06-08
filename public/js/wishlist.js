let wishlistProducts = [];

function renderWishlist() {
  const grid = document.getElementById("wishlistGrid");
  if (!grid) return;
  if (!wishlistProducts.length) {
    grid.innerHTML = '<p class="muted">Your wishlist is empty.</p>';
    return;
  }
  grid.innerHTML = wishlistProducts
    .map(
      (product) => `
      <article class="card product-card">
        <a href="/product?id=${product.id}"><img class="product-image" src="${product.image}" alt="${product.name}" /></a>
        <div class="product-body">
          <div class="product-top">
            <strong><a href="/product?id=${product.id}">${product.name}</a></strong>
            <span>${currency(product.price)}</span>
          </div>
          <p class="muted">${product.category}</p>
          <div class="product-actions">
            <a class="btn btn-secondary" href="/product?id=${product.id}">Sizes & details</a>
            <button class="btn btn-primary" data-action="cart" data-id="${product.id}">Quick add (M)</button>
            <button class="btn btn-secondary" data-action="remove" data-id="${product.id}">Remove</button>
          </div>
        </div>
      </article>`
    )
    .join("");
}

async function addToCartFromWishlist(productId) {
  const product = wishlistProducts.find((p) => p.id === productId);
  if (!product) return;
  try {
    const data = await apiFetch("/api/shop/cart", {
      method: "POST",
      body: { productId, size: "M" }
    });
    showCartToast(data.message);
  } catch (err) {
    showGogoToast(err.message, "Error");
  }
}

async function removeFromWishlist(productId) {
  await apiFetch(`/api/shop/wishlist/${productId}`, { method: "DELETE" });
  wishlistProducts = wishlistProducts.filter((p) => p.id !== productId);
  renderWishlist();
}

async function initWishlist() {
  try {
    wishlistProducts = await apiFetch("/api/shop/wishlist");
  } catch (err) {
    if (err.status === 401) {
      window.location.href = "/login";
      return;
    }
    wishlistProducts = [];
  }
  renderWishlist();
  const grid = document.getElementById("wishlistGrid");
  if (!grid) return;
  grid.addEventListener("click", (event) => {
    const target = event.target;
    const action = target.getAttribute("data-action");
    const id = target.getAttribute("data-id");
    if (!action || !id) return;
    if (action === "cart") addToCartFromWishlist(id);
    if (action === "remove") removeFromWishlist(id);
  });
}

initWishlist().catch(() => {});
onCurrencyChange(renderWishlist);
