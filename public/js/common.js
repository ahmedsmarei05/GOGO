async function apiFetch(url, options = {}) {
  const config = {
    credentials: "same-origin",
    headers: { ...(options.headers || {}) },
    ...options
  };
  if (config.body && !(config.body instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(config.body);
  }
  const response = await fetch(url, config);
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : {};
  if (!response.ok || (!contentType.includes("application/json") && response.status !== 204)) {
    const err = new Error(
      data.message ||
        (contentType.includes("text/html")
          ? "Unexpected server response. Restart the app (npm start) and log in again."
          : "Request failed")
    );
    err.status = response.status;
    err.fieldErrors = data.fieldErrors || {};
    throw err;
  }
  return data;
}

function clearFieldErrors(form) {
  form.querySelectorAll(".field-error").forEach((el) => {
    el.textContent = "";
  });
}

function showFieldErrors(form, fieldErrors) {
  Object.entries(fieldErrors).forEach(([field, message]) => {
    const el = form.querySelector(`#${field}Error`) || form.querySelector(`[data-error-for="${field}"]`);
    if (el) el.textContent = message;
  });
}

const currencyState = {
  code: localStorage.getItem("gogoCurrency") || "USD",
  egpRate: null
};

const currencyListeners = new Set();

function onCurrencyChange(callback) {
  currencyListeners.add(callback);
}

function notifyCurrencyChange() {
  currencyListeners.forEach((fn) => fn());
}

function currency(value) {
  const amount = Number(value);
  if (currencyState.code === "EGP" && currencyState.egpRate) {
    return `${(amount * currencyState.egpRate).toFixed(2)} EGP`;
  }
  return `$${amount.toFixed(2)}`;
}

async function loadExchangeRates() {
  try {
    const data = await apiFetch("/api/external/exchange-rates");
    currencyState.egpRate = data.rates?.EGP || null;
  } catch {
    currencyState.egpRate = null;
  }
}

function setupCurrencySwitcher() {
  const nav = document.querySelector(".nav-links");
  if (!nav || document.getElementById("currencySwitcher")) return;

  const wrap = document.createElement("span");
  wrap.id = "currencySwitcher";
  wrap.className = "currency-switcher";
  wrap.innerHTML = `
    <label class="sr-only" for="currencySelect">Currency</label>
    <select id="currencySelect" aria-label="Currency">
      <option value="USD">USD</option>
      <option value="EGP">EGP</option>
    </select>`;
  nav.insertBefore(wrap, nav.firstChild);

  const select = wrap.querySelector("#currencySelect");
  select.value = currencyState.code;
  select.addEventListener("change", () => {
    currencyState.code = select.value;
    localStorage.setItem("gogoCurrency", currencyState.code);
    notifyCurrencyChange();
  });
}

function markActiveNavLinks() {
  const path = window.location.pathname;
  document.querySelectorAll(".nav-links a").forEach((link) => {
    const href = link.getAttribute("href");
    link.classList.remove("active");
    if (href === path || (href !== "/" && path.startsWith(href))) {
      link.classList.add("active");
    }
  });
  if (path === "/") {
    document.querySelector('.nav-links a[href="/"]')?.classList.add("active");
  }
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

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
}

async function fetchProducts() {
  return apiFetch("/api/products");
}

async function updateAuthArea() {
  const slot = document.getElementById("authArea");
  if (!slot) return;

  try {
    const data = await apiFetch("/api/auth/me");
    const current = data.user;
    if (!current) {
      slot.innerHTML =
        '<a href="/login">Login</a><a href="/register">Register</a><a href="/wishlist">Wishlist</a><a href="/cart">Cart</a>';
      markActiveNavLinks();
      return;
    }
    const adminLink = current.role === "admin" ? '<a href="/admin">Admin</a>' : "";
    slot.innerHTML =
      `<span class="muted">Hi, ${current.name}</span>${adminLink}<a href="/wishlist">Wishlist</a><a href="/cart">Cart</a><button class="btn btn-secondary" id="logoutBtn" type="button">Logout</button>`;
    markActiveNavLinks();
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        const res = await apiFetch("/api/auth/logout", { method: "POST" });
        window.location.href = res.redirect || "/login";
      });
    }
  } catch {
    slot.innerHTML =
      '<a href="/login">Login</a><a href="/register">Register</a><a href="/wishlist">Wishlist</a><a href="/cart">Cart</a>';
    markActiveNavLinks();
  }
}

async function initCommon() {
  setupCurrencySwitcher();
  await loadExchangeRates();
  await updateAuthArea();
}

initCommon();
