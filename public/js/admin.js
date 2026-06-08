let allProducts = [];
let currentUserId = null;
let cachedUsers = [];
let cachedOrders = [];

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
        <td>${product.id.slice(-6)}</td>
        <td>${escapeHtml(product.name)}</td>
        <td>${escapeHtml(product.category)}</td>
        <td>${currency(product.price)}</td>
        <td class="admin-table-actions">
          <button type="button" class="btn btn-secondary" data-action="edit-product" data-id="${product.id}">Edit</button>
          <button type="button" class="btn btn-secondary" data-action="delete-product" data-id="${product.id}">Remove</button>
        </td>
      </tr>`
    )
    .join("");
}

function orderItemsSummary(order) {
  return order.items
    .map((i) => {
      const name = escapeHtml(i.productName || `#${i.productId}`);
      const size = escapeHtml(i.size || "M");
      return `${name} ×${i.quantity} (${size})`;
    })
    .join("<br />");
}

function renderOrdersTable(orders) {
  const tbody = document.getElementById("ordersTableBody");
  if (!tbody) return;
  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="muted">No orders yet.</td></tr>';
    return;
  }
  tbody.innerHTML = orders
    .map(
      (order) => `
      <tr>
        <td>${escapeHtml(order.id.slice(-8))}</td>
        <td>${escapeHtml(order.userName)}</td>
        <td>${order.phone ? escapeHtml(order.phone) : "—"}</td>
        <td class="order-address-cell">${order.address ? escapeHtml(order.address) : "—"}</td>
        <td class="order-items-cell">${orderItemsSummary(order)}</td>
        <td>${escapeHtml(order.paymentMethod || "COD")}</td>
        <td>${escapeHtml(order.status)}</td>
        <td>${new Date(order.createdAt).toLocaleString()}</td>
        <td>
          <button type="button" class="btn btn-secondary" data-action="edit-order" data-id="${order.id}">Edit</button>
        </td>
      </tr>`
    )
    .join("");
}

function renderUsersTable(users) {
  const tbody = document.getElementById("usersTableBody");
  if (!tbody) return;
  tbody.innerHTML = users
    .map((user) => {
      const isSelf = currentUserId && user.id === currentUserId;
      const disableRemove = isSelf || (user.role === "admin" && countAdmins(users) <= 1);
      return `
      <tr>
        <td>${user.id.slice(-6)}</td>
        <td>${escapeHtml(user.name)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>${escapeHtml(user.role)}</td>
        <td class="admin-table-actions">
          <button type="button" class="btn btn-secondary" data-action="edit-user" data-id="${user.id}">Edit</button>
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

function renderQuickInfo(stats) {
  const totalOrders = document.getElementById("totalOrders");
  const totalUsers = document.getElementById("totalUsers");
  const totalProducts = document.getElementById("totalProducts");
  if (totalOrders) totalOrders.textContent = stats.totalOrders;
  if (totalUsers) totalUsers.textContent = stats.totalUsers;
  if (totalProducts) totalProducts.textContent = stats.totalProducts;
}

function setupAddProductForm() {
  const form = document.getElementById("addProductForm");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFieldErrors(form);
    const ok = document.getElementById("addProductSuccess");
    ok.textContent = "";

    const formData = new FormData(form);
    const file = form.pImage.files[0];

    let hasError = false;
    const name = form.pName.value.trim();
    const category = form.pCategory.value.trim();
    const price = Number(form.pPrice.value);
    const description = form.pDescription.value.trim();

    if (name.length < 2) {
      document.getElementById("nameError").textContent = "Name is too short.";
      hasError = true;
    }
    if (category.length < 2) {
      document.getElementById("categoryError").textContent = "Category is too short.";
      hasError = true;
    }
    if (!Number.isFinite(price) || price <= 0) {
      document.getElementById("priceError").textContent = "Enter a valid price.";
      hasError = true;
    }
    if (!file) {
      document.getElementById("pImageError").textContent = "Product image is required.";
      hasError = true;
    }
    if (description.length < 4) {
      document.getElementById("descriptionError").textContent = "Description is too short.";
      hasError = true;
    }
    if (hasError) return;

    formData.set("pImage", file);

    try {
      await apiFetch("/api/products", { method: "POST", body: formData });
      form.reset();
      ok.textContent = "Product added to catalog.";
      allProducts = await fetchProducts();
      refreshAdminTables();
    } catch (err) {
      if (err.fieldErrors) {
        const mapped = {};
        Object.entries(err.fieldErrors).forEach(([k, v]) => {
          if (k === "pImage") mapped.pImage = v;
          else mapped[k] = v;
        });
        showFieldErrors(form, mapped);
      } else {
        document.getElementById("pImageError").textContent = err.message;
      }
    }
  });
}

function setupEditUserModal() {
  const modal = document.getElementById("editUserModal");
  const form = document.getElementById("editUserForm");
  const cancelBtn = document.getElementById("cancelEditUser");
  if (!modal || !form) return;

  cancelBtn.addEventListener("click", () => {
    modal.hidden = true;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFieldErrors(form);
    const id = document.getElementById("editUserId").value;
    const name = document.getElementById("editUserName").value.trim();
    const email = document.getElementById("editUserEmail").value.trim();
    const role = document.getElementById("editUserRole").value;

    try {
      await apiFetch(`/api/admin/users/${id}`, {
        method: "PUT",
        body: { name, email, role }
      });
      modal.hidden = true;
      refreshAdminTables();
    } catch (err) {
      if (err.fieldErrors) {
        const mapped = {};
        if (err.fieldErrors.name) mapped.editName = err.fieldErrors.name;
        if (err.fieldErrors.email) mapped.editEmail = err.fieldErrors.email;
        if (err.fieldErrors.role) mapped.editRole = err.fieldErrors.role;
        Object.entries(mapped).forEach(([field, message]) => {
          const el = document.getElementById(`${field}Error`);
          if (el) el.textContent = message;
        });
      }
    }
  });
}

function openEditUser(user) {
  const modal = document.getElementById("editUserModal");
  document.getElementById("editUserId").value = user.id;
  document.getElementById("editUserName").value = user.name;
  document.getElementById("editUserEmail").value = user.email;
  document.getElementById("editUserRole").value = user.role;
  clearFieldErrors(document.getElementById("editUserForm"));
  modal.hidden = false;
}

function openEditProduct(product) {
  const modal = document.getElementById("editProductModal");
  document.getElementById("editProductId").value = product.id;
  document.getElementById("editProductName").value = product.name;
  document.getElementById("editProductCategory").value = product.category;
  document.getElementById("editProductPrice").value = product.price;
  document.getElementById("editProductDescription").value = product.description;
  document.getElementById("editProductImage").value = "";
  clearFieldErrors(document.getElementById("editProductForm"));
  modal.hidden = false;
}

function openEditOrder(order) {
  const modal = document.getElementById("editOrderModal");
  const statusSelect = document.getElementById("editOrderStatus");
  document.getElementById("editOrderId").value = order.id;
  if (![...statusSelect.options].some((option) => option.value === order.status)) {
    const option = document.createElement("option");
    option.value = order.status;
    option.textContent = order.status;
    statusSelect.appendChild(option);
  }
  statusSelect.value = order.status;
  document.getElementById("editOrderPhone").value = order.phone || "";
  document.getElementById("editOrderAddress").value = order.address || "";
  document.getElementById("editOrderSummary").textContent = `Order for ${order.userName} · ${currency(order.total)}`;
  clearFieldErrors(document.getElementById("editOrderForm"));
  modal.hidden = false;
}

function setupEditProductModal() {
  const modal = document.getElementById("editProductModal");
  const form = document.getElementById("editProductForm");
  const cancelBtn = document.getElementById("cancelEditProduct");
  if (!modal || !form) return;

  cancelBtn.addEventListener("click", () => {
    modal.hidden = true;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFieldErrors(form);
    const id = document.getElementById("editProductId").value;
    if (!id) {
      showGogoToast("Could not identify this product. Close the modal and try again.", "Error");
      return;
    }

    const formData = new FormData();
    formData.append("name", document.getElementById("editProductName").value.trim());
    formData.append("category", document.getElementById("editProductCategory").value.trim());
    formData.append("price", document.getElementById("editProductPrice").value);
    formData.append("description", document.getElementById("editProductDescription").value.trim());

    const fileInput = document.getElementById("editProductImage");
    if (fileInput?.files?.[0]) {
      formData.append("pImage", fileInput.files[0]);
    }

    try {
      await apiFetch(`/api/products/${id}`, { method: "PUT", body: formData });
      modal.hidden = true;
      allProducts = await fetchProducts();
      await refreshAdminTables();
      showGogoToast("Product saved to the catalog.", "Saved");
    } catch (err) {
      if (err.fieldErrors) {
        const mapped = {};
        Object.entries(err.fieldErrors).forEach(([k, v]) => {
          if (k === "pImage") mapped.editProductImage = v;
          else mapped[`editProduct${k.charAt(0).toUpperCase()}${k.slice(1)}`] = v;
        });
        showFieldErrors(form, mapped);
      } else {
        document.getElementById("editProductImageError").textContent = err.message;
      }
    }
  });
}

function setupEditOrderModal() {
  const modal = document.getElementById("editOrderModal");
  const form = document.getElementById("editOrderForm");
  const cancelBtn = document.getElementById("cancelEditOrder");
  if (!modal || !form) return;

  cancelBtn.addEventListener("click", () => {
    modal.hidden = true;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFieldErrors(form);
    const id = document.getElementById("editOrderId").value;
    if (!id) {
      showGogoToast("Could not identify this order. Close the modal and try again.", "Error");
      return;
    }
    const status = document.getElementById("editOrderStatus").value;
    const phone = document.getElementById("editOrderPhone").value.trim();
    const address = document.getElementById("editOrderAddress").value.trim();

    try {
      await apiFetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        body: { status, phone, address }
      });
      modal.hidden = true;
      await refreshAdminTables();
      showGogoToast("Order saved successfully.", "Saved");
    } catch (err) {
      if (err.fieldErrors) {
        const mapped = {};
        if (err.fieldErrors.status) mapped.editOrderStatus = err.fieldErrors.status;
        if (err.fieldErrors.phone) mapped.editOrderPhone = err.fieldErrors.phone;
        if (err.fieldErrors.address) mapped.editOrderAddress = err.fieldErrors.address;
        Object.entries(mapped).forEach(([field, message]) => {
          const el = document.getElementById(`${field}Error`);
          if (el) el.textContent = message;
        });
      } else {
        document.getElementById("editOrderAddressError").textContent = err.message;
      }
    }
  });
}

async function deleteProduct(id) {
  if (!confirm("Remove this product from the catalog?")) return;
  await apiFetch(`/api/products/${id}`, { method: "DELETE" });
  allProducts = allProducts.filter((p) => p.id !== id);
  refreshAdminTables();
}

async function deleteUser(id) {
  if (!confirm("Remove this user? This cannot be undone.")) return;
  try {
    await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
    refreshAdminTables();
  } catch (err) {
    showGogoToast(err.message, "Error");
  }
}

async function refreshAdminTables() {
  const [stats, users, orders] = await Promise.all([
    apiFetch("/api/admin/stats"),
    apiFetch("/api/admin/users"),
    apiFetch("/api/admin/orders")
  ]);
  cachedUsers = users;
  cachedOrders = orders;
  renderProductsTable();
  renderOrdersTable(orders);
  renderUsersTable(users);
  renderQuickInfo(stats);
}

function bindAdminActions() {
  document.body.addEventListener("click", (event) => {
    const target = event.target;
    const action = target.getAttribute("data-action");
    if (action === "delete-product") {
      const id = target.getAttribute("data-id");
      if (id) deleteProduct(id);
    }
    if (action === "delete-user") {
      const id = target.getAttribute("data-id");
      if (id) deleteUser(id);
    }
    if (action === "edit-user") {
      const id = target.getAttribute("data-id");
      const user = cachedUsers.find((u) => u.id === id);
      if (user) openEditUser(user);
    }
    if (action === "edit-product") {
      const id = target.getAttribute("data-id");
      const product = allProducts.find((p) => p.id === id);
      if (product) openEditProduct(product);
    }
    if (action === "edit-order") {
      const id = target.getAttribute("data-id");
      const order = cachedOrders.find((o) => o.id === id);
      if (order) openEditOrder(order);
    }
  });
}

async function initAdmin() {
  const me = await apiFetch("/api/auth/me");
  if (!me.user || me.user.role !== "admin") {
    window.location.href = "/login";
    return;
  }
  currentUserId = me.user.id;
  allProducts = await fetchProducts();
  bindAdminActions();
  setupAddProductForm();
  setupEditUserModal();
  setupEditProductModal();
  setupEditOrderModal();
  await refreshAdminTables();
}

initAdmin().catch(() => {
  window.location.href = "/login";
});
onCurrencyChange(renderProductsTable);
