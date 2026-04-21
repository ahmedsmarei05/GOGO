function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
}

function setupRegister() {
  const form = document.getElementById("registerForm");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value.trim();
    const confirmPassword = form.confirmPassword.value.trim();
    const error = document.getElementById("registerError");
    const success = document.getElementById("registerSuccess");
    error.textContent = "";
    success.textContent = "";

    if (name.length < 2) {
      error.textContent = "Name must be at least 2 characters.";
      return;
    }
    if (!validateEmail(email)) {
      error.textContent = "Please enter a valid email.";
      return;
    }
    if (!validatePassword(password)) {
      error.textContent = "Password must be 8+ chars and include letters and numbers.";
      return;
    }
    if (password !== confirmPassword) {
      error.textContent = "Passwords do not match.";
      return;
    }

    const users = getData(STORAGE_KEYS.users, []);
    if (users.some((u) => u.email === email)) {
      error.textContent = "Email already registered.";
      return;
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      password,
      role: "user"
    };
    users.push(newUser);
    setData(STORAGE_KEYS.users, users);
    success.textContent = "Account created. You can login now.";
    form.reset();
  });
}

function setupLogin() {
  const form = document.getElementById("loginForm");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value.trim();
    const error = document.getElementById("loginError");
    error.textContent = "";

    if (!validateEmail(email)) {
      error.textContent = "Please enter a valid email.";
      return;
    }
    if (!password) {
      error.textContent = "Password is required.";
      return;
    }

    const users = getData(STORAGE_KEYS.users, []);
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) {
      error.textContent = "Invalid email or password.";
      return;
    }

    setCurrentUser({ id: user.id, name: user.name, email: user.email, role: user.role });
    if (user.role === "admin") {
      window.location.href = "./admin.html";
      return;
    }
    window.location.href = "./home.html";
  });
}

setupRegister();
setupLogin();
