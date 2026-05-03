let allProducts = [];

function getCart() {
  return getUserMapData(STORAGE_KEYS.cart);
}

function setCart(value) {
  setUserMapData(STORAGE_KEYS.cart, value);
}

function getWishlist() {
  return getUserMapData(STORAGE_KEYS.wishlist);
}

function setWishlist(value) {
  setUserMapData(STORAGE_KEYS.wishlist, value);
}

function addToCart(product, size = "M") {
  const user = ensureAuth(["user", "admin"]);
  if (!user) return;
  const cart = getCart();
  const existing = cart.find((item) => item.productId === product.id && (item.size || "M") === size);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ productId: product.id, quantity: 1, size });
  }
  setCart(cart);
  showCartToast(`${product.name} (size ${size}) added to your cart.`);
}

function toggleWishlist(product) {
  const user = ensureAuth(["user", "admin"]);
  if (!user) return;
  const wishlist = getWishlist();
  const index = wishlist.indexOf(product.id);
  if (index >= 0) {
    wishlist.splice(index, 1);
  } else {
    wishlist.push(product.id);
  }
  setWishlist(wishlist);
  renderProducts();
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

  const wishlist = getWishlist();
  grid.innerHTML = filtered
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
          <p>${product.description}</p>
          <div class="product-actions">
            <a class="btn btn-secondary" href="./product.html?id=${product.id}">Sizes & details</a>
            <button class="btn btn-primary" data-action="cart" data-id="${product.id}">Quick add (M)</button>
            <button class="btn btn-secondary" data-action="wish" data-id="${product.id}">
              ${wishlist.includes(product.id) ? "Remove Wishlist" : "Wishlist"}
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
    if (element) element.addEventListener("input", renderProducts);
    if (element) element.addEventListener("change", renderProducts);
  });

  const grid = document.getElementById("productsGrid");
  if (!grid) return;
  grid.addEventListener("click", (event) => {
    const target = event.target;
    const action = target.getAttribute("data-action");
    const id = Number(target.getAttribute("data-id"));
    if (!action || !id) return;
    const product = allProducts.find((p) => p.id === id);
    if (!product) return;
    if (action === "cart") addToCart(product, "M");
    if (action === "wish") toggleWishlist(product);
  });
}

async function initCollection() {
  allProducts = await fetchProducts();
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
