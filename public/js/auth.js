function setupRegister() {
  const form = document.getElementById("registerForm");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFieldErrors(form);
    const success = document.getElementById("registerSuccess");
    success.textContent = "";

    const name = form.name.value.trim();
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value.trim();
    const confirmPassword = form.confirmPassword.value.trim();

    let hasError = false;
    if (name.length < 2) {
      document.getElementById("nameError").textContent = "Name must be at least 2 characters.";
      hasError = true;
    }
    if (!validateEmail(email)) {
      document.getElementById("emailError").textContent = "Please enter a valid email.";
      hasError = true;
    }
    if (!validatePassword(password)) {
      document.getElementById("passwordError").textContent = "Password must be 8+ chars and include letters and numbers.";
      hasError = true;
    }
    if (password !== confirmPassword) {
      document.getElementById("confirmPasswordError").textContent = "Passwords do not match.";
      hasError = true;
    }
    if (hasError) return;

    try {
      const data = await apiFetch("/api/auth/register", {
        method: "POST",
        body: { name, email, password, confirmPassword }
      });
      success.textContent = data.message;
      form.reset();
    } catch (err) {
      if (err.fieldErrors) showFieldErrors(form, err.fieldErrors);
      else document.getElementById("emailError").textContent = err.message;
    }
  });
}

function setupLogin() {
  const form = document.getElementById("loginForm");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFieldErrors(form);

    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value.trim();

    let hasError = false;
    if (!validateEmail(email)) {
      document.getElementById("emailError").textContent = "Please enter a valid email.";
      hasError = true;
    }
    if (!password) {
      document.getElementById("passwordError").textContent = "Password is required.";
      hasError = true;
    }
    if (hasError) return;

    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: { email, password }
      });
      window.location.href = data.redirect || "/";
    } catch (err) {
      if (err.fieldErrors) showFieldErrors(form, err.fieldErrors);
      else document.getElementById("emailError").textContent = err.message;
    }
  });
}

setupRegister();
setupLogin();
