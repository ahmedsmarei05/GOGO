let allProducts = [];
let wishlistIds = new Set();

async function loadWishlistIds() {
  try {
    const items = await apiFetch("/api/shop/wishlist");
    wishlistIds = new Set(items.map((p) => p.id));
  } catch {
    wishlistIds = new Set();
  }
}

async function addToCart(product, size = "M") {
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

async function toggleWishlist(product) {
  try {
    const data = await apiFetch("/api/shop/wishlist/toggle", {
      method: "POST",
      body: { productId: product.id }
    });
    if (data.added) wishlistIds.add(product.id);
    else wishlistIds.delete(product.id);
    renderProducts();
  } catch (err) {
    if (err.status === 401) window.location.href = "/login";
    else showGogoToast(err.message, "Error");
  }
}

function renderProducts() {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const category = document.getElementById("categoryFilter").value;
  const sort = document.getElementById("sortFilter").value;
  const minPrice = Number(document.getElementById("minPrice").value || 0);
  const maxPrice = Number(document.getElementById("maxPrice").value || Number.MAX_SAFE_INTEGER);

  let filtered = allProducts.filter((product) => {
    const matchesName = product.name.toLowerCase().includes(search);
    const matchesCategory = !category || product.category === category;
    const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
    return matchesName && matchesCategory && matchesPrice;
  });

  if (sort === "priceAsc") filtered.sort((a, b) => a.price - b.price);
  if (sort === "priceDesc") filtered.sort((a, b) => b.price - a.price);
  if (sort === "nameAsc") filtered.sort((a, b) => a.name.localeCompare(b.name));

  grid.innerHTML = filtered
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
          <p>${product.description}</p>
          <div class="product-actions">
            <a class="btn btn-secondary" href="/product?id=${product.id}">Sizes & details</a>
            <button class="btn btn-primary" data-action="cart" data-id="${product.id}">Quick add (M)</button>
            <button class="btn btn-secondary" data-action="wish" data-id="${product.id}">
              ${wishlistIds.has(product.id) ? "Remove Wishlist" : "Wishlist"}
            </button>
          </div>
        </div>
      </article>`
    )
    .join("");
}

function bindFilters() {
  ["searchInput", "categoryFilter", "sortFilter", "minPrice", "maxPrice"].forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener("input", renderProducts);
      element.addEventListener("change", renderProducts);
    }
  });

  const grid = document.getElementById("productsGrid");
  if (!grid) return;
  grid.addEventListener("click", (event) => {
    const target = event.target;
    const action = target.getAttribute("data-action");
    const id = target.getAttribute("data-id");
    if (!action || !id) return;
    const product = allProducts.find((p) => p.id === id);
    if (!product) return;
    if (action === "cart") addToCart(product, "M");
    if (action === "wish") toggleWishlist(product);
  });
}

async function initCollection() {
  allProducts = await fetchProducts();
  await loadWishlistIds();
  const categories = [...new Set(allProducts.map((p) => p.category))];
  const categoryFilter = document.getElementById("categoryFilter");
  if (categoryFilter) {
    categoryFilter.innerHTML =
      '<option value="">All Categories</option>' +
      categories.map((c) => `<option value="${c}">${c}</option>`).join("");
  }
  bindFilters();
  renderProducts();
}

initCollection().catch(() => {
  const grid = document.getElementById("productsGrid");
  if (grid) grid.innerHTML = '<p class="error">Failed to load products.</p>';
});
onCurrencyChange(renderProducts);
