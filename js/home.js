function initSlideshow() {
  const slides = Array.from(document.querySelectorAll(".slide"));
  const dotsWrap = document.getElementById("slideDots");
  const prev = document.getElementById("slidePrev");
  const next = document.getElementById("slideNext");
  if (!slides.length || !dotsWrap) return;

  let index = 0;
  let timer;

  slides.forEach((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "slide-dot" + (i === 0 ? " is-active" : "");
    b.setAttribute("aria-label", `Go to slide ${i + 1}`);
    b.addEventListener("click", () => go(i));
    dotsWrap.appendChild(b);
  });

  const dots = () => Array.from(dotsWrap.querySelectorAll(".slide-dot"));

  function go(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, j) => s.classList.toggle("is-active", j === index));
    dots().forEach((d, j) => d.classList.toggle("is-active", j === index));
  }

  function nextSlide() {
    go(index + 1);
  }

  function start() {
    clearInterval(timer);
    timer = setInterval(nextSlide, 5500);
  }

  prev.addEventListener("click", () => {
    go(index - 1);
    start();
  });
  next.addEventListener("click", () => {
    go(index + 1);
    start();
  });
  start();
}

async function loadHighlights() {
  const productsCount = document.getElementById("productsCount");
  const wishlistCount = document.getElementById("wishlistCount");
  const featuredGrid = document.getElementById("featuredGrid");
  if (!productsCount) return;

  const products = await fetchProducts();
  productsCount.textContent = products.length;
  wishlistCount.textContent = getUserMapData(STORAGE_KEYS.wishlist).length;

  if (featuredGrid) {
    const picks = products.slice(0, 4);
    featuredGrid.innerHTML = picks
      .map(
        (p) => `
      <a class="card featured-card" href="./product.html?id=${p.id}">
        <img src="${p.image}" alt="${p.name}" />
        <div class="featured-body">
          <strong>${p.name}</strong>
          <span class="muted">${currency(p.price)}</span>
        </div>
      </a>`
      )
      .join("");
  }
}

initSlideshow();
loadHighlights().catch(() => {});
