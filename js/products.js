async function fetchProducts() {
  const cached = localStorage.getItem(STORAGE_KEYS.productsCatalog);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      localStorage.removeItem(STORAGE_KEYS.productsCatalog);
    }
  }
  const response = await fetch("../data/products.json");
  if (!response.ok) throw new Error("Could not load products.");
  const data = await response.json();
  setData(STORAGE_KEYS.productsCatalog, data);
  return data;
}

function saveProductsCatalog(products) {
  setData(STORAGE_KEYS.productsCatalog, products);
}

function currency(value) {
  return `$${Number(value).toFixed(2)}`;
}
