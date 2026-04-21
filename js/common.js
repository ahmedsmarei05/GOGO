const STORAGE_KEYS = {
  users: "gogo_users",
  currentUser: "gogo_current_user",
  cart: "gogo_cart",
  wishlist: "gogo_wishlist",
  orders: "gogo_orders",
  productsCatalog: "gogo_products_catalog"
};

function getData(key, fallback) {
  return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
}

function setData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function seedDefaults() {
  const users = getData(STORAGE_KEYS.users, []);
  if (!users.length) {
    setData(STORAGE_KEYS.users, [
      { id: 1, name: "Admin", email: "admin@gogo.com", password: "Admin123!", role: "admin" },
      { id: 2, name: "Mona User", email: "user@gogo.com", password: "User123!", role: "user" }
    ]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.cart)) setData(STORAGE_KEYS.cart, {});
  if (!localStorage.getItem(STORAGE_KEYS.wishlist)) setData(STORAGE_KEYS.wishlist, {});
  if (!localStorage.getItem(STORAGE_KEYS.orders)) setData(STORAGE_KEYS.orders, []);
}

function getCurrentUser() {
  return getData(STORAGE_KEYS.currentUser, null);
}

function setCurrentUser(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    return;
  }
  setData(STORAGE_KEYS.currentUser, user);
}

function logout() {
  setCurrentUser(null);
  window.location.href = "./login.html";
}

function ensureAuth(allowedRoles = ["user", "admin"]) {
  const user = getCurrentUser();
  if (!user || !allowedRoles.includes(user.role)) {
    window.location.href = "./login.html";
  }
  return user;
}

function getUserMapData(key) {
  const all = getData(key, {});
  const current = getCurrentUser();
  if (!current) return [];
  return all[current.id] || [];
}

function setUserMapData(key, value) {
  const all = getData(key, {});
  const current = getCurrentUser();
  if (!current) return;
  all[current.id] = value;
  setData(key, all);
}

function updateAuthArea() {
  const slot = document.getElementById("authArea");
  if (!slot) return;
  const current = getCurrentUser();
  if (!current) {
    slot.innerHTML =
      '<a href="./login.html">Login</a><a href="./register.html">Register</a><a href="./wishlist.html">Wishlist</a><a href="./cart.html">Cart</a>';
    return;
  }
  const adminLink = current.role === "admin" ? '<a href="./admin.html">Admin</a>' : "";
  slot.innerHTML =
    `<span class="muted">Hi, ${current.name}</span>${adminLink}<a href="./wishlist.html">Wishlist</a><a href="./cart.html">Cart</a><button class="btn btn-secondary" id="logoutBtn">Logout</button>`;
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
}

function showGogoToast(message, title = "GOGO") {
  let overlay = document.getElementById("gogoToastOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "gogoToastOverlay";
    overlay.className = "gogo-toast-overlay";
    overlay.innerHTML = `
      <div class="gogo-toast" role="alert">
        <p class="gogo-toast-brand"></p>
        <p class="gogo-toast-message"></p>
        <button type="button" class="btn btn-primary gogo-toast-close">OK</button>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.classList.remove("is-visible");
    overlay.querySelector(".gogo-toast-close").addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
  }
  overlay.querySelector(".gogo-toast-brand").textContent = title;
  overlay.querySelector(".gogo-toast-message").textContent = message;
  overlay.classList.add("is-visible");
  clearTimeout(overlay._t);
  overlay._t = setTimeout(() => overlay.classList.remove("is-visible"), 3800);
}

function showCartToast(message) {
  showGogoToast(message, "GOGO");
}

seedDefaults();
updateAuthArea();
