let allProducts = [];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function countAdmins(users) {
  return users.filter((u) => u.role === "admin").length;
}

function renderProductsTable() {
  const tbody = document.getElementById("productsTableBody");
  if (!tbody) return;
  tbody.innerHTML = allProducts
    .map(
      (product) => `
      <tr>
        <td>${product.id}</td>
        <td>${escapeHtml(product.name)}</td>
        <td>${escapeHtml(product.category)}</td>
        <td>${currency(product.price)}</td>
        <td><button type="button" class="btn btn-secondary" data-action="delete-product" data-id="${product.id}">Remove</button></td>
      </tr>`
    )
    .join("");
}

function orderItemsSummary(order) {
  return order.items
    .map((i) => {
      const product = allProducts.find((p) => p.id === i.productId);
      const name = product ? escapeHtml(product.name) : `#${i.productId}`;
      const size = escapeHtml(i.size || "M");
      return `${name} ×${i.quantity} (${size})`;
    })
    .join("<br />");
}

function renderOrdersTable() {
  const tbody = document.getElementById("ordersTableBody");
  if (!tbody) return;
  const orders = getData(STORAGE_KEYS.orders, []);
  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="muted">No orders yet.</td></tr>';
    return;
  }
  tbody.innerHTML = orders
    .map(
      (order) => `
      <tr>
        <td>${escapeHtml(order.id)}</td>
        <td>${escapeHtml(order.userName)}</td>
        <td>${order.phone ? escapeHtml(order.phone) : "—"}</td>
        <td class="order-items-cell">${orderItemsSummary(order)}</td>
        <td>${escapeHtml(order.paymentMethod || "COD")}</td>
        <td>${escapeHtml(order.status)}</td>
        <td>${new Date(order.createdAt).toLocaleString()}</td>
      </tr>`
    )
    .join("");
}

function renderUsersTable() {
  const tbody = document.getElementById("usersTableBody");
  if (!tbody) return;
  const current = getCurrentUser();
  const users = getData(STORAGE_KEYS.users, []);
  tbody.innerHTML = users
    .map((user) => {
      const isSelf = current && user.id === current.id;
      const disableRemove =
        isSelf || (user.role === "admin" && countAdmins(users) <= 1);
      return `
      <tr>
        <td>${user.id}</td>
        <td>${escapeHtml(user.name)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>${escapeHtml(user.role)}</td>
        <td>
          ${
            disableRemove
              ? '<span class="muted">—</span>'
              : `<button type="button" class="btn btn-secondary" data-action="delete-user" data-id="${user.id}">Remove</button>`
          }
        </td>
      </tr>`;
    })
    .join("");
}

function renderQuickInfo() {
  const totalOrders = document.getElementById("totalOrders");
  const totalUsers = document.getElementById("totalUsers");
  const totalProducts = document.getElementById("totalProducts");
  const users = getData(STORAGE_KEYS.users, []);
  if (totalOrders) totalOrders.textContent = getData(STORAGE_KEYS.orders, []).length;
  if (totalUsers) totalUsers.textContent = users.filter((u) => u.role === "user").length;
  if (totalProducts) totalProducts.textContent = allProducts.length;
}

function setupAddProductForm() {
  const form = document.getElementById("addProductForm");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const err = document.getElementById("addProductError");
    const ok = document.getElementById("addProductSuccess");
    err.textContent = "";
    ok.textContent = "";

    const name = form.pName.value.trim();
    const category = form.pCategory.value.trim();
    const price = Number(form.pPrice.value);
    const image = form.pImage.value.trim();
    const description = form.pDescription.value.trim();

    if (name.length < 2) return (err.textContent = "Name is too short.");
    if (category.length < 2) return (err.textContent = "Category is too short.");
    if (!Number.isFinite(price) || price <= 0) return (err.textContent = "Enter a valid price.");
    if (!image.startsWith("../") && !image.startsWith("./") && !image.startsWith("http"))
      return (err.textContent = "Image path should start with ../ or http.");
    if (description.length < 4) return (err.textContent = "Description is too short.");

    const nextId = allProducts.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    allProducts.push({ id: nextId, name, category, price, image, description });
    saveProductsCatalog(allProducts);
    form.reset();
    ok.textContent = "Product added to catalog.";
    refreshAdminTables();
  });
}

function deleteProduct(id) {
  if (!confirm("Remove this product from the catalog?")) return;
  allProducts = allProducts.filter((p) => p.id !== id);
  saveProductsCatalog(allProducts);
  refreshAdminTables();
}

function deleteUser(id) {
  const users = getData(STORAGE_KEYS.users, []);
  const target = users.find((u) => u.id === id);
  if (!target) return;
  if (!confirm(`Remove user ${target.email}? This cannot be undone.`)) return;
  const current = getCurrentUser();
  if (current && target.id === current.id) return;
  if (target.role === "admin" && countAdmins(users) <= 1) return;
  setData(
    STORAGE_KEYS.users,
    users.filter((u) => u.id !== id)
  );
  refreshAdminTables();
}

function refreshAdminTables() {
  renderProductsTable();
  renderOrdersTable();
  renderUsersTable();
  renderQuickInfo();
}

function bindAdminActions() {
  document.body.addEventListener("click", (event) => {
    const target = event.target;
    const action = target.getAttribute("data-action");
    if (action === "delete-product") {
      const id = Number(target.getAttribute("data-id"));
      if (id) deleteProduct(id);
    }
    if (action === "delete-user") {
      const id = Number(target.getAttribute("data-id"));
      if (id) deleteUser(id);
    }
  });
}

async function initAdmin() {
  ensureAuth(["admin"]);
  allProducts = await fetchProducts();
  bindAdminActions();
  setupAddProductForm();
  refreshAdminTables();
}

initAdmin().catch(() => {});
