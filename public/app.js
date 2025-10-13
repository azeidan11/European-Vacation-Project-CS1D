
// Simple two-page nav (Home / Distances)
const routes = ["home", "distances", "foods", "plan", "plan-berlin", "plan-london", "plan-custom", "maintenance"];
function show(route) {
  routes.forEach(r => {
    document.getElementById(r).classList.toggle("hidden", r !== route);
    document.getElementById("link-" + r).classList.toggle("active", r === route);
  });
  if (route === "distances") loadDistances();
  if (route === "foods") initFoods();
  if (route === "plan") initPlan();
  if (route === "plan-berlin") initBerlinPlan();
  if (route === "plan-london") initLondonPlan();
  if (route === "plan-custom") initCustomPlan();
  if (route === "maintenance") initMaintenance();
}

// --- Foods data (parsed from the provided spreadsheet; up to six items per city) ---
const FOODS_HINT_DEFAULT = "Click a city to view up to six traditional foods and prices in USD.";

let foodsData = window.foodsData || {
  "Amsterdam": [
    { item: "Stroopwafel", price: "$5.76" },
    { item: "Thick Dutch fries", price: "$3.21" },
    { item: "Kibbeling", price: "$8.65" }
  ],
  "Berlin": [
    { item: "Pretzels", price: "$4.00" },
    { item: "Apfelstrudel", price: "$6.25" },
    { item: "Berliner Pfannkuche", price: "$8.23" },
    { item: "Schnitzel", price: "$9.79" }
  ],
  "Brussels": [
    { item: "Belgian Waffles", price: "$4.56" },
    { item: "Mussels & Fries", price: "$12.50" },
    { item: "Speculoos", price: "$3.40" },
    { item: "Chocolate Truffles", price: "$7.75" }
  ],
 "Budapest": [
    { item: "Goulash", price: "$9.10" },
    { item: "Kürtőskalács (Chimney Cake)", price: "$4.20" },
    { item: "Lángos", price: "$5.30" },
    { item: "Dobos Torte", price: "$4.80" }
  ],
  "Hamburg": [
    { item: "Franzbrötchen", price: "$3.10" },
    { item: "Fischbrötchen", price: "$5.95" },
    { item: "Labskaus", price: "$11.20" },
    { item: "Rote Grütze", price: "$4.35" }
  ],
  "Lisbon": [
    { item: "Pastel de Nata", price: "$2.10" },
    { item: "Bifana", price: "$5.20" },
    { item: "Bacalhau à Brás", price: "$10.60" }
  ],
  "London": [
    { item: "Fish and Chips", price: "$11.40" },
    { item: "Full English Breakfast", price: "$12.80" },
    { item: "Sticky Toffee Pudding", price: "$6.90" }
  ],
  "Madrid": [
    { item: "Churros con Chocolate", price: "$4.30" },
    { item: "Bocadillo de Calamares", price: "$7.50" },
    { item: "Tortilla Española", price: "$6.20" }
  ],
  "Paris": [
    { item: "Crêpe", price: "$5.10" },
    { item: "Croissant", price: "$2.40" },
    { item: "Macarons", price: "$7.30" },
    { item: "Onion Soup", price: "$9.80" }
  ],
  "Prague": [
    { item: "Trdelník", price: "$4.00" },
    { item: "Svíčková", price: "$10.90" },
    { item: "Knedlíky", price: "$3.70" },
    { item: "Palačinky", price: "$4.60" }
  ],
  "Rome": [
    { item: "Margherita Pizza", price: "$9.00" },
    { item: "Cacio e Pepe", price: "$11.20" },
    { item: "Gelato", price: "$3.50" },
    { item: "Tiramisu", price: "$5.80" },
    { item: "Supplì", price: "$3.90" }
  ],
  "Stockholm": [
    { item: "Köttbullar (Meatballs)", price: "$12.30" },
    { item: "Cinnamon Bun (Kanelbulle)", price: "$3.90" },
    { item: "Gravlax", price: "$10.50" }
  ],
  "Zurich": [
    { item: "Rosti", price: "$8.50" },
    { item: "Swiss Fondue", price: "$14.30" },
    { item: "Luxemburgerli", price: "$5.60" }
  ],
  "Copenhagen": [
    { item: "Smorrebrod", price: "$8.40" },
    { item: "Frikadeller", price: "$9.25" },
    { item: "Wienerbrod", price: "$4.05" }
  ],
  "Vienna": [
    { item: "Sachertorte", price: "$6.80" },
    { item: "Wiener Schnitzel", price: "$13.20" },
    { item: "Kaiserschmarrn", price: "$7.10" }
  ]
};
// --- Persistence for foods data (autosave/load) ---
const FOODS_STORAGE_KEY = 'evp_foods_v1';
function saveFoodsToStorage() {
  try {
    localStorage.setItem(FOODS_STORAGE_KEY, JSON.stringify(foodsData));
  } catch (e) {
    console.warn('Failed to save foods to storage', e);
  }
}
function loadFoodsFromStorage() {
  try {
    const raw = localStorage.getItem(FOODS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      foodsData = parsed;
    }
  } catch (e) {
    console.warn('Failed to load foods from storage', e);
  }
}
// Load any saved foods before exposing globally
loadFoodsFromStorage();
window.foodsData = foodsData;

let foodsInitDone = false;
const foodsRefs = {};
const foodsState = { selectedCity: null };

function getSortedFoodCities() {
  return Object.keys(foodsData).sort((a, b) => a.localeCompare(b));
}

function highlightFoodsCityButtons() {
  if (!foodsRefs.citiesBox) return;
  const buttons = foodsRefs.citiesBox.querySelectorAll('button[data-city]');
  buttons.forEach(btn => {
    const active = btn.dataset.city === foodsState.selectedCity;
    btn.style.background = active ? '#eef2ff' : '#fff';
    btn.style.fontWeight = active ? '600' : '400';
  });
}

function renderFoodsCities(preferredCity) {
  if (!foodsRefs.citiesBox) return;
  const cities = getSortedFoodCities();
  let targetCity = null;
  if (preferredCity && cities.includes(preferredCity)) {
    targetCity = preferredCity;
  } else if (foodsState.selectedCity && cities.includes(foodsState.selectedCity)) {
    targetCity = foodsState.selectedCity;
  } else if (foodsInitDone && cities.length) {
    targetCity = cities[0];
  }

  foodsState.selectedCity = targetCity || null;
  foodsRefs.citiesBox.innerHTML = '';
  cities.forEach(city => {
    const btn = document.createElement('button');
    btn.textContent = city;
    btn.dataset.city = city;
    btn.style.padding = '6px 8px';
    btn.style.border = '1px solid #ddd';
    btn.style.borderRadius = '8px';
    btn.style.background = '#fff';
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', () => {
      if (foodsState.selectedCity === city) return;
      foodsState.selectedCity = city;
      renderFoodsTable();
      highlightFoodsCityButtons();
    });
    foodsRefs.citiesBox.appendChild(btn);
  });
  highlightFoodsCityButtons();
}

function renderFoodsTable() {
  if (!foodsRefs.body || !foodsRefs.title) return;
  const hintEl = foodsRefs.hint;
  const searchVal = foodsRefs.search ? (foodsRefs.search.value || '').trim().toLowerCase() : '';
  const city = foodsState.selectedCity;

  if (!city) {
    foodsRefs.title.textContent = "Select a city";
    foodsRefs.body.innerHTML = '';
    if (hintEl) {
      hintEl.textContent = getSortedFoodCities().length
        ? FOODS_HINT_DEFAULT
        : "Import data or add foods to get started.";
    }
    highlightFoodsCityButtons();
    return;
  }

  foodsRefs.title.textContent = city;
  const items = (foodsData[city] || []).slice();
  const filtered = searchVal
    ? items.filter(it => it.item.toLowerCase().includes(searchVal))
    : items;

  foodsRefs.body.innerHTML = '';
  if (!filtered.length) {
    if (hintEl) {
      hintEl.textContent = items.length ? 'No matching foods.' : 'No foods saved for this city yet.';
    }
    highlightFoodsCityButtons();
    return;
  }

  filtered.slice(0, 6).forEach(({ item, price }) => {
    const tr = document.createElement('tr');
    const td1 = document.createElement('td');
    td1.textContent = item;
    const td2 = document.createElement('td');
    td2.textContent = price;
    tr.appendChild(td1);
    tr.appendChild(td2);
    foodsRefs.body.appendChild(tr);
  });
  if (hintEl) hintEl.textContent = '';
  highlightFoodsCityButtons();
}

function refreshFoodsUI(preferredCity) {
  if (!foodsRefs.citiesBox || !foodsRefs.body || !foodsRefs.title) return;
  renderFoodsCities(preferredCity);
  renderFoodsTable();
}

function initFoods() {
  if (foodsInitDone) return;
  foodsRefs.citiesBox = document.getElementById('foods-cities');
  foodsRefs.body = document.getElementById('foods-body');
  foodsRefs.title = document.getElementById('foods-city-title');
  foodsRefs.search = document.getElementById('foods-search');
  foodsRefs.hint = document.getElementById('foods-hint');
  if (!foodsRefs.citiesBox || !foodsRefs.body || !foodsRefs.title) return;

  if (foodsRefs.search) {
    foodsRefs.search.addEventListener('input', () => renderFoodsTable());
  }

  refreshFoodsUI();
  foodsInitDone = true;
}

function parsePriceValue(raw) {
  if (raw === null || raw === undefined) return null;
  const normalized = String(raw).replace(/[^0-9.,-]/g, '').replace(',', '.');
  if (!normalized) return null;
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

function formatUSD(value) {
  const num = typeof value === 'number' ? value : Number.parseFloat(value);
  if (!Number.isFinite(num)) return "$0.00";
  return `$${Math.max(0, num).toFixed(2)}`;
}

function importFoodsCsv(text) {
  const summary = {
    addedCities: new Set(),
    touchedCities: new Set(),
    addedItems: 0,
    updatedItems: 0,
    errors: []
  };

  if (!text) return summary;

  const lines = String(text).split(/\r?\n/);
  lines.forEach((line, index) => {
    const normalizedLine = line.replace(/\uFEFF/g, '').trim();
    if (!normalizedLine) return;
    if (index === 0 && /city/i.test(normalizedLine) && /food/i.test(normalizedLine) && /price/i.test(normalizedLine)) {
      return;
    }
    const parts = normalizedLine.split(',');
    if (parts.length < 3) {
      summary.errors.push(`Line ${index + 1}: expected "City,Food Item,Price".`);
      return;
    }
    const city = parts.shift().trim();
    const priceRaw = parts.pop().trim();
    const itemName = parts.join(',').trim();
    if (!city || !itemName || !priceRaw) {
      summary.errors.push(`Line ${index + 1}: missing city, food, or price.`);
      return;
    }
    const priceNumber = parsePriceValue(priceRaw);
    if (priceNumber === null) {
      summary.errors.push(`Line ${index + 1}: invalid price "${priceRaw}".`);
      return;
    }
    if (!foodsData[city]) {
      foodsData[city] = [];
      summary.addedCities.add(city);
    }
    const cityItems = foodsData[city];
    const existing = cityItems.find(entry => entry.item.toLowerCase() === itemName.toLowerCase());
    const formattedPrice = formatUSD(priceNumber);
    if (existing) {
      existing.price = formattedPrice;
      summary.updatedItems++;
    } else {
      cityItems.push({ item: itemName, price: formattedPrice });
      cityItems.sort((a, b) => a.item.localeCompare(b.item));
      summary.addedItems++;
    }
    summary.touchedCities.add(city);
  });

  return summary;
}

const ADMIN_PASSWORD = "123";
let maintenanceInitDone = false;
let maintenanceUnlocked = false;

function initMaintenance() {
  if (maintenanceInitDone) return;

  const loginBox = document.getElementById('maint-login');
  const contentBox = document.getElementById('maint-content');
  if (!loginBox || !contentBox) return;

  const passwordInput = document.getElementById('maint-password');
  const loginBtn = document.getElementById('maint-login-btn');
  const loginHint = document.getElementById('maint-login-hint');
  const lockBtn = document.getElementById('maint-lock-btn');

  const importFile = document.getElementById('maint-import-file');
  const importBtn = document.getElementById('maint-import-btn');
  const importStatus = document.getElementById('maint-import-status');

  const priceCitySel = document.getElementById('maint-price-city');
  const priceItemSel = document.getElementById('maint-price-item');
  const priceInput = document.getElementById('maint-price-value');
  const priceBtn = document.getElementById('maint-price-btn');
  const priceStatus = document.getElementById('maint-price-status');

  const addCitySel = document.getElementById('maint-add-city');
  const addItemInput = document.getElementById('maint-add-item');
  const addPriceInput = document.getElementById('maint-add-price');
  const addBtn = document.getElementById('maint-add-btn');
  const addStatus = document.getElementById('maint-add-status');

  const deleteCitySel = document.getElementById('maint-delete-city');
  const deleteItemSel = document.getElementById('maint-delete-item');
  const deleteBtn = document.getElementById('maint-delete-btn');
  const deleteStatus = document.getElementById('maint-delete-status');

  function setStatus(el, message, isError = false) {
    if (!el) return;
    el.textContent = message || '';
    el.style.color = message ? (isError ? '#b00020' : '#1b5e20') : '';
  }

  function setLockState(locked) {
    maintenanceUnlocked = !locked;
    if (locked) {
      contentBox.classList.add('hidden');
      loginBox.classList.remove('hidden');
      if (passwordInput) passwordInput.value = '';
    } else {
      contentBox.classList.remove('hidden');
      loginBox.classList.add('hidden');
      populateSelectors();
    }
    if (loginHint) loginHint.textContent = '';
    setStatus(importStatus, '');
    setStatus(priceStatus, '');
    setStatus(addStatus, '');
    setStatus(deleteStatus, '');
  }

  function updateItemsFor(citySelect, itemSelect) {
    if (!itemSelect) return;
    itemSelect.innerHTML = '';
    itemSelect.disabled = true;
    const city = citySelect && citySelect.value;
    if (!city || !foodsData[city] || foodsData[city].length === 0) {
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = city ? 'No foods available' : 'Select a city first';
      itemSelect.appendChild(placeholder);
      return;
    }
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select a food item';
    itemSelect.appendChild(placeholder);
    foodsData[city]
      .slice()
      .sort((a, b) => a.item.localeCompare(b.item))
      .forEach(entry => {
        const opt = document.createElement('option');
        opt.value = entry.item;
        opt.textContent = entry.item;
        itemSelect.appendChild(opt);
      });
    itemSelect.disabled = false;
  }

  function populateSelectors() {
    const cities = getSortedFoodCities();
    const selects = [priceCitySel, addCitySel, deleteCitySel];
    selects.forEach(select => {
      if (!select) return;
      const previous = select.value;
      select.innerHTML = '';
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Select a city';
      select.appendChild(placeholder);
      cities.forEach(city => {
        const opt = document.createElement('option');
        opt.value = city;
        opt.textContent = city;
        select.appendChild(opt);
      });
      if (previous && cities.includes(previous)) {
        select.value = previous;
      } else {
        select.value = '';
      }
    });
    updateItemsFor(priceCitySel, priceItemSel);
    updateItemsFor(deleteCitySel, deleteItemSel);
  }

  function requireUnlock(statusEl) {
    if (maintenanceUnlocked) return false;
    setStatus(statusEl, 'Unlock maintenance with the administrator password first.', true);
    return true;
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      const entered = passwordInput ? (passwordInput.value || '').trim() : '';
      if (entered === ADMIN_PASSWORD) {
        setLockState(false);
      } else if (loginHint) {
        loginHint.textContent = 'Incorrect password.';
      }
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener('keyup', evt => {
      if (evt.key === 'Enter') {
        evt.preventDefault();
        if (loginBtn) loginBtn.click();
      }
    });
  }

  if (lockBtn) {
    lockBtn.addEventListener('click', () => setLockState(true));
  }

  if (priceCitySel) {
    priceCitySel.addEventListener('change', () => {
      updateItemsFor(priceCitySel, priceItemSel);
      setStatus(priceStatus, '');
    });
  }

  if (deleteCitySel) {
    deleteCitySel.addEventListener('change', () => {
      updateItemsFor(deleteCitySel, deleteItemSel);
      setStatus(deleteStatus, '');
    });
  }

  if (importBtn) {
    importBtn.addEventListener('click', () => {
      if (requireUnlock(importStatus)) return;
      if (!importFile || !importFile.files || !importFile.files.length) {
        setStatus(importStatus, 'Choose a CSV or text file to import.', true);
        return;
      }
      const file = importFile.files[0];
      const reader = new FileReader();
      reader.onload = evt => {
        const text = evt.target && typeof evt.target.result === 'string' ? evt.target.result : '';
        const summary = importFoodsCsv(text);
        // Persist changes from import
        saveFoodsToStorage();
        const parts = [];
        if (summary.addedCities.size) {
          parts.push(`${summary.addedCities.size} new ${summary.addedCities.size === 1 ? 'city' : 'cities'}`);
        }
        if (summary.addedItems) {
          parts.push(`${summary.addedItems} item(s) added`);
        }
        if (summary.updatedItems) {
          parts.push(`${summary.updatedItems} item(s) updated`);
        }
        if (!parts.length) {
          parts.push('File processed with no changes');
        }
        let message = parts.join(', ') + '.';
        if (summary.errors.length) {
          message += ` ${summary.errors.length} line(s) skipped.`;
          console.warn('Import skipped lines:', summary.errors);
        }
        setStatus(importStatus, message, summary.errors.length > 0);
        if (importFile) importFile.value = '';
        populateSelectors();
        const firstTouched = summary.touchedCities.size ? Array.from(summary.touchedCities)[0] : undefined;
        refreshFoodsUI(firstTouched);
      };
      reader.onerror = () => {
        setStatus(importStatus, 'Unable to read the selected file.', true);
      };
      reader.readAsText(file);
    });
  }

  if (priceBtn) {
    priceBtn.addEventListener('click', () => {
      if (requireUnlock(priceStatus)) return;
      const city = priceCitySel && priceCitySel.value;
      const itemName = priceItemSel && priceItemSel.value;
      const priceValue = priceInput ? priceInput.value : '';
      if (!city) {
        setStatus(priceStatus, 'Select a city.', true);
        return;
      }
      if (!itemName) {
        setStatus(priceStatus, 'Select a food item to update.', true);
        return;
      }
      const parsed = parsePriceValue(priceValue);
      if (parsed === null) {
        setStatus(priceStatus, 'Enter a valid non-negative price.', true);
        return;
      }
      const entries = foodsData[city] || [];
      const entry = entries.find(e => e.item === itemName);
      if (!entry) {
        setStatus(priceStatus, 'Selected food item was not found.', true);
        populateSelectors();
        return;
      }
      entry.price = formatUSD(parsed);
      // Persist price update
      saveFoodsToStorage();
      setStatus(priceStatus, `Price for "${itemName}" updated to ${entry.price}.`, false);
      if (priceInput) priceInput.value = '';
      populateSelectors();
      refreshFoodsUI(city);
    });
  }

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      if (requireUnlock(addStatus)) return;
      const city = addCitySel && addCitySel.value;
      const itemName = addItemInput ? addItemInput.value.trim() : '';
      const priceValue = addPriceInput ? addPriceInput.value : '';
      if (!city) {
        setStatus(addStatus, 'Select a city to add the food item to.', true);
        return;
      }
      if (!itemName) {
        setStatus(addStatus, 'Enter the name of the food item.', true);
        return;
      }
      const parsed = parsePriceValue(priceValue);
      if (parsed === null) {
        setStatus(addStatus, 'Enter a valid non-negative price.', true);
        return;
      }
      const entries = foodsData[city] || (foodsData[city] = []);
      if (entries.some(e => e.item.toLowerCase() === itemName.toLowerCase())) {
        setStatus(addStatus, 'That food item already exists. Use the price change tool instead.', true);
        return;
      }
      entries.push({ item: itemName, price: formatUSD(parsed) });
      entries.sort((a, b) => a.item.localeCompare(b.item));
      // Persist add
      saveFoodsToStorage();
      setStatus(addStatus, `Added "${itemName}" to ${city}.`, false);
      if (addItemInput) addItemInput.value = '';
      if (addPriceInput) addPriceInput.value = '';
      populateSelectors();
      refreshFoodsUI(city);
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (requireUnlock(deleteStatus)) return;
      const city = deleteCitySel && deleteCitySel.value;
      const itemName = deleteItemSel && deleteItemSel.value;
      if (!city) {
        setStatus(deleteStatus, 'Select a city.', true);
        return;
      }
      if (!itemName) {
        setStatus(deleteStatus, 'Select the food item to delete.', true);
        return;
      }
      const entries = foodsData[city] || [];
      const index = entries.findIndex(e => e.item === itemName);
      if (index === -1) {
        setStatus(deleteStatus, 'Selected food item was not found.', true);
        populateSelectors();
        return;
      }
      entries.splice(index, 1);
      // Persist delete
      saveFoodsToStorage();
      setStatus(deleteStatus, `"${itemName}" removed from ${city}.`, false);
      populateSelectors();
      refreshFoodsUI(city);
    });
  }

  setLockState(true);
  maintenanceInitDone = true;
}
window.addEventListener("hashchange", () => {
  const r = (location.hash || "#home").slice(1);
  show(routes.includes(r) ? r : "home");
});

let loaded = false;
async function loadDistances() {
  if (loaded) return;
  const hint = document.getElementById("dist-hint");
  const tbody = document.getElementById("dist-body");
  try {
    // NOTE the ./ prefix; Live Server will serve /server/distances.csv at /server/distances.csv
    const res = await fetch("./server/distances.csv", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) throw new Error("CSV has no rows");

    // Expect header: City,DistanceFromBerlin(km)
    tbody.innerHTML = "";
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const comma = line.indexOf(",");
      if (comma < 0) continue;

      const city = line.slice(0, comma).trim();
      const dist = line.slice(comma + 1).trim().replace(/[^0-9]/g, "");
      if (!city || !dist) continue;

      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${city}</td><td>${dist}</td>`;
      tbody.appendChild(tr);
    }
    hint.textContent = "Loaded City / DistanceFromBerlin (km).";
    loaded = true;
  } catch (err) {
    console.error(err);
    hint.textContent = "";
  }
}


// Ensure foods list exists only after DOM is ready and foodsData is defined, then show initial route
document.addEventListener('DOMContentLoaded', async () => {
  try { initFoods(); } catch (e) { console.error(e); }
  // Preload edge distances so Paris/London/custom planners can use spreadsheet distances
  try {
    const csvLoaded = await loadEdgeDistancesCSV([
      './server/European Distances and Foods.csv',
      './European Distances and Foods.csv',
      '../European Distances and Foods.csv'
    ]);
    if (!csvLoaded) {
      console.warn('Distance CSV could not be loaded from any known path.');
    }
  } catch (e) {
    console.warn(e);
  }
  const initial = (location.hash || '#home').slice(1) || 'home';
  show(initial);
});

// --- Custom Trip Planner (select start city and destinations) ---
let customInitDone = false;
function initCustomPlan() {
  if (customInitDone) return;

  const startSel = document.getElementById('cus-start');
  const listMount = document.getElementById('cus-city-list');
  const btn = document.getElementById('cus-plan-btn');
  const tbody = document.getElementById('cus-route-body');
  const totalEl = document.getElementById('cus-route-total');
  const foodsMount = document.getElementById('cus-foods');
  const foodTotalEl = document.getElementById('cus-food-total');
  const grandTotalEl = document.getElementById('cus-grand-total');
  const costEl = document.getElementById('cus-costkm');

  if (!startSel || !listMount || !btn || !tbody || !totalEl || !foodsMount) return;

  const allCities = Object.keys(CITY_LATLON);
  allCities.sort((a,b)=>a.localeCompare(b));

  // Populate start select
  startSel.innerHTML = '';
  allCities.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    startSel.appendChild(opt);
  });
  if (allCities.includes('Paris')) startSel.value = 'Paris';

  // Populate destination checkboxes
  function renderCityChecks() {
    const start = startSel.value;
    listMount.innerHTML = '';
    allCities.forEach(c => {
      if (c === start) return;
      const id = `cus-city-${c.replace(/\W+/g,'_')}`;
      const wrap = document.createElement('label');
      wrap.style.display = 'flex';
      wrap.style.alignItems = 'center';
      wrap.style.gap = '6px';
      wrap.innerHTML = `<input type="checkbox" id="${id}" value="${c}"><span>${c}</span>`;
      listMount.appendChild(wrap);
    });
  }
  renderCityChecks();

  const selectAllBtn = document.getElementById('cus-select-all');
  const clearBtn = document.getElementById('cus-clear');
  if (selectAllBtn) selectAllBtn.addEventListener('click', () => {
    listMount.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
  });
  if (clearBtn) clearBtn.addEventListener('click', () => {
    listMount.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  });
  startSel.addEventListener('change', renderCityChecks);

  function renderCustomRoute(cities, order, M) {
    tbody.innerHTML = '';
    let totalKm = 0;
    for (let i=0;i<order.length;i++) {
      const idx = order[i];
      const city = cities[idx];
      const leg = i===0 ? 0 : M[order[i-1]][idx];
      if (i>0) totalKm += leg;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i+1}</td><td>${city}</td><td>${i===0?'-':Math.round(leg)}</td>`;
      tbody.appendChild(tr);
    }
    totalEl.textContent = `Total distance (no return to start): ${Math.round(totalKm)} km`;
    return totalKm;
  }

  let lastKm = 0;
  const recomputeGrand = () => {
    const foodUSD = LON_computeFoodTotalUSD('#cus-foods');
    const costPerKm = parseFloat(costEl && costEl.value ? costEl.value : '0') || 0;
    const distanceUSD = lastKm * costPerKm;
    if (foodTotalEl) foodTotalEl.textContent = `Food total: $${foodUSD.toFixed(2)}`;
    if (grandTotalEl) grandTotalEl.textContent = `Grand total: $${(foodUSD + distanceUSD).toFixed(2)} (includes distance cost $${distanceUSD.toFixed(2)})`;
  };
  if (costEl) costEl.addEventListener('input', recomputeGrand);

  btn.addEventListener('click', () => {
    const start = startSel.value;
    const selected = Array.from(listMount.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    const visit = selected.length ? selected : Array.from(listMount.querySelectorAll('input[type="checkbox"]')).map(cb => cb.value);
    const cities = [start, ...visit];
    const M = buildMatrix(cities);
    let order = nearestNeighborOrder(M); // starts at index 0
    order = twoOptOpen(order, M, 1000);

    lastKm = renderCustomRoute(cities, order, M);
    totalEl.textContent += ` across ${cities.length} cities.`;

    LON_renderFoods(cities, recomputeGrand, '#cus-foods');
    recomputeGrand();
  });

  customInitDone = true;
}

// --- Trip planner (Paris start, visit 11 cities) ---
const PLAN_CITIES = [
  // Paris is fixed start; rest will be visited efficiently
  "Paris",
  "Amsterdam", "Berlin", "Brussels", "Budapest", "Hamburg",
  "Lisbon", "London", "Madrid", "Prague", "Rome"
];

// --- Edge-list distance graph from CSV (Starting City, Ending City, Kilometers) ---
const EDGE_DIST = {
  CityIndex: Object.create(null), // name -> index
  CityNames: [],                  // index -> name
  Dist: [],                       // NxN matrix (km); Infinity if unknown; 0 on diagonal
  Ready: false                    // becomes true after CSV distances load successfully
};

function edgeEnsureCity(name) {
  if (name in EDGE_DIST.CityIndex) return EDGE_DIST.CityIndex[name];
  const idx = EDGE_DIST.CityNames.length;
  EDGE_DIST.CityIndex[name] = idx;
  EDGE_DIST.CityNames.push(name);
  // expand matrix
  EDGE_DIST.Dist.forEach(row => row.push(Infinity));
  EDGE_DIST.Dist.push(Array(idx + 1).fill(Infinity));
  EDGE_DIST.Dist[idx][idx] = 0;
  return idx;
}

function edgeResetDistances() {
  EDGE_DIST.CityIndex = Object.create(null);
  EDGE_DIST.CityNames = [];
  EDGE_DIST.Dist = [];
  EDGE_DIST.Ready = false;
}

function edgeSetDistance(a, b, km) {
  const i = edgeEnsureCity(a);
  const j = edgeEnsureCity(b);
  const v = Number(km);
  if (!Number.isFinite(v) || v < 0) return;
  const cur = EDGE_DIST.Dist[i][j];
  const best = Number.isFinite(cur) ? Math.min(cur, v) : v;
  EDGE_DIST.Dist[i][j] = EDGE_DIST.Dist[j][i] = best;
}

// Prefer CSV distance; fallback to haversine if needed
function distanceBetweenCities(aName, bName) {
  if (aName === bName) return 0;
  const ai = EDGE_DIST.CityIndex[aName];
  const bi = EDGE_DIST.CityIndex[bName];
  if (ai !== undefined && bi !== undefined) {
    const v = EDGE_DIST.Dist[ai][bi];
    if (Number.isFinite(v) && v > 0) return v;
  }
  if (CITY_LATLON[aName] && CITY_LATLON[bName]) {
    return haversineKm(CITY_LATLON[aName], CITY_LATLON[bName]);
  }
  return Infinity;
}

function csvDistanceBetweenCities(aName, bName) {
  if (aName === bName) return 0;
  const ai = EDGE_DIST.CityIndex[aName];
  const bi = EDGE_DIST.CityIndex[bName];
  if (ai === undefined || bi === undefined) return Infinity;
  const row = EDGE_DIST.Dist[ai];
  if (!row) return Infinity;
  const v = row[bi];
  return Number.isFinite(v) && v >= 0 ? v : Infinity;
}

async function loadEdgeDistancesCSV(paths = './server/European Distances and Foods.csv') {
  const candidates = Array.isArray(paths) ? paths : [paths];
  let lastError = null;
  edgeResetDistances();

  for (const path of candidates) {
    try {
      const res = await fetch(path, { cache: 'no-store' });
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status} for ${path}`);
        continue;
      }
      const text = await res.text();
      const lines = text.trim().split(/\r?\n/).filter(Boolean);
      if (!lines.length) continue;

      const header = lines[0].split(',').map(s => s.trim().toLowerCase());
      const si = header.indexOf('starting city');
      const ei = header.indexOf('ending city');
      const ki = header.indexOf('kilometers');
      if (si === -1 || ei === -1 || ki === -1) {
        lastError = new Error(`Edge CSV header not recognized for ${path}`);
        continue;
      }

      for (let r = 1; r < lines.length; r++) {
        const raw = lines[r].trim();
        if (!raw) continue;
        const parts = raw.split(',');
        if (parts.length < 3) continue;
        const start = (parts[si] || '').trim();
        const end   = (parts[ei] || '').trim();
        const km    = parseFloat(String(parts[ki]).replace(/[^0-9.\\-]/g, ''));
        if (!start || !end || !Number.isFinite(km)) continue;
        edgeSetDistance(start, end, km);
      }

      EDGE_DIST.Ready = EDGE_DIST.CityNames.length > 0;
      if (EDGE_DIST.Ready) {
        console.log(`Loaded edge distances for ${EDGE_DIST.CityNames.length} cities from ${path}`);
        return true;
      }
    } catch (e) {
      lastError = e;
    }
  }

  if (lastError) {
    console.warn('Failed to load edge distance CSV:', lastError);
  }
  return false;
}

// Latitude/Longitude (approximate city centers)
const CITY_LATLON = {
  Amsterdam: [52.3676, 4.9041],
  Berlin: [52.52, 13.405],
  Brussels: [50.8503, 4.3517],
  Budapest: [47.4979, 19.0402],
  Copenhagen: [55.6761, 12.5683],
  Lisbon: [38.7223, -9.1393],
  London: [51.5074, -0.1278],
  Madrid: [40.4168, -3.7038],
  Paris: [48.8566, 2.3522],
  Prague: [50.0755, 14.4378],
  Rome: [41.9028, 12.4964],
  Stockholm: [59.3293, 18.0686],
  Vienna: [48.2082, 16.3738],
  Zurich: [47.3769, 8.5417]
};

const BERLIN_PLAN_CITIES = [
  "Berlin",
  "Amsterdam",
  "Brussels",
  "Paris",
  "London",
  "Madrid",
  "Lisbon",
  "Rome",
  "Vienna",
  "Prague",
  "Budapest",
  "Copenhagen",
  "Stockholm"
];

function haversineKm(a, b) {
  const R = 6371; // km
  const [lat1, lon1] = a.map(x => x * Math.PI / 180);
  const [lat2, lon2] = b.map(x => x * Math.PI / 180);
  const dlat = lat2 - lat1;
  const dlon = lon2 - lon1;
  const s = Math.sin(dlat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dlon/2)**2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

function buildMatrix(cities, opts = {}) {
  const { csvOnly = false } = opts;
  const n = cities.length;
  const M = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dij = csvOnly
        ? csvDistanceBetweenCities(cities[i], cities[j])
        : distanceBetweenCities(cities[i], cities[j]);
      M[i][j] = M[j][i] = dij;
    }
  }
  return M;
}

// Nearest Neighbor from fixed start at index 0 (Paris)
function nearestNeighborOrder(M) {
  const n = M.length;
  const visited = Array(n).fill(false);
  const order = [0];
  visited[0] = true;
  for (let step=1; step<n; step++) {
    const last = order[order.length-1];
    let best = -1, bestD = Infinity;
    for (let j=0;j<n;j++) if (!visited[j]) {
      const d = M[last][j];
      if (d < bestD) { bestD = d; best = j; }
    }
    if (best === -1 || !Number.isFinite(bestD)) {
      break;
    }
    visited[best] = true; order.push(best);
  }
  return order; // open path (do not return to Paris)
}

// 2-opt improvement for an open path (keeps first node fixed)
function twoOptOpen(order, M, maxIter=2000) {
  const n = order.length;
  function pathLen(ord) {
    let s=0; for (let i=0;i<n-1;i++) s += M[ord[i]][ord[i+1]]; return s;
  }
  let best = order.slice();
  let bestLen = pathLen(best);
  let improved = true, iter=0;
  while (improved && iter < maxIter) {
    improved = false; iter++;
    for (let i=1;i<n-2;i++) {
      for (let k=i+1;k<n-1;k++) {
        const a=best[i-1], b=best[i], c=best[k], d=best[k+1];
        const delta = (M[a][c] + M[b][d]) - (M[a][b] + M[c][d]);
        if (delta < -1e-6) {
          const seg = best.slice(i, k+1).reverse();
          best.splice(i, k-i+1, ...seg);
          bestLen += delta;
          improved = true;
        }
      }
    }
  }
  return best;
}

function renderPlan(cities, order, M) {
  const tbody = document.getElementById('plan-body');
  const totalP = document.getElementById('plan-total');
  tbody.innerHTML = '';
  let total = 0;
  for (let i=0;i<order.length;i++) {
    const idx = order[i];
    const city = cities[idx];
    const leg = i===0 ? 0 : M[order[i-1]][idx];
    if (i>0) total += leg;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td>${city}</td><td>${i===0?'-':Math.round(leg)}</td>`;
    tbody.appendChild(tr);
  }
  totalP.textContent = `Total distance (no return to start): ${Math.round(total)} km`;
}

function renderBerlinRoute(tbodyEl, totalEl, cities, order, M) {
  if (!tbodyEl || !totalEl) return 0;
  tbodyEl.innerHTML = '';
  let total = 0;
  for (let i = 0; i < order.length; i++) {
    const idx = order[i];
    const city = cities[idx];
    const leg = i === 0 ? 0 : M[order[i - 1]][idx];
    if (i > 0) total += leg;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i + 1}</td><td>${city}</td><td>${i === 0 ? '-' : Math.round(leg)}</td>`;
    tbodyEl.appendChild(tr);
  }
  totalEl.textContent = `Total distance (no return to start): ${Math.round(total)} km`;
  return total;
}

let planInitDone = false;
function initPlan() {
  if (planInitDone) return;
  const btn = document.getElementById('plan-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const tbody = document.getElementById('plan-body');
    const totalP = document.getElementById('plan-total');
    if (!tbody || !totalP) return;

    tbody.innerHTML = '';
    totalP.textContent = '';

    if (!EDGE_DIST.Ready) {
      totalP.textContent = 'Distance data is still loading from the CSV. Please try again shortly.';
      return;
    }

    const cities = PLAN_CITIES.slice();
    const missingCities = cities.filter(city => EDGE_DIST.CityIndex[city] === undefined);
    if (missingCities.length) {
      totalP.textContent = `Missing CSV distance data for: ${missingCities.join(', ')}.`;
      return;
    }

    const M = buildMatrix(cities, { csvOnly: true });
    let gap = null;
    for (let i = 0; i < cities.length && !gap; i++) {
      for (let j = i + 1; j < cities.length; j++) {
        if (!Number.isFinite(M[i][j]) || M[i][j] <= 0) {
          gap = [cities[i], cities[j]];
          break;
        }
      }
    }
    if (gap) {
      totalP.textContent = `Missing distance between ${gap[0]} and ${gap[1]} in the CSV dataset.`;
      return;
    }

    const order = nearestNeighborOrder(M);
    if (order.length !== cities.length) {
      totalP.textContent = 'Unable to compute a full route with the available CSV distances.';
      return;
    }

    renderPlan(cities, order, M);
  });
  planInitDone = true;
}

let berlinInitDone = false;
function initBerlinPlan() {
  if (berlinInitDone) return;

  const btn = document.getElementById('berlin-plan-btn');
  const routeBody = document.getElementById('berlin-route-body');
  const routeTotalEl = document.getElementById('berlin-route-total');
  const foodsMount = document.getElementById('berlin-foods');
  const foodTotalEl = document.getElementById('berlin-food-total');

  if (!btn || !routeBody || !routeTotalEl || !foodsMount || !foodTotalEl) return;

  const recomputeFoodTotal = () => {
    const foodUSD = LON_computeFoodTotalUSD('#berlin-foods');
    foodTotalEl.textContent = `Food total: $${foodUSD.toFixed(2)}`;
  };

  btn.addEventListener('click', () => {
    const cities = BERLIN_PLAN_CITIES.slice();
    const M = buildMatrix(cities);
    let order = nearestNeighborOrder(M);
    order = twoOptOpen(order, M, 1500);
    renderBerlinRoute(routeBody, routeTotalEl, cities, order, M);
    const orderedCities = order.map(idx => cities[idx]);
    LON_renderFoods(orderedCities, recomputeFoodTotal, '#berlin-foods');
    recomputeFoodTotal();
  });

  berlinInitDone = true;
}

// -------------------- London Trip Planner (Shortest with food purchases) --------------------
const LON_START = "London";

// Cities available for selection (ensure they exist in CITY_LATLON and ideally foodsData)
const LON_CHOOSABLE_CITIES = [
  "Paris","Amsterdam","Brussels","Madrid","Rome",
  "Vienna","Prague","Zurich","Budapest","Copenhagen","Lisbon","Hamburg"
];

// Fallback for lat/lon if not already defined somewhere else
window.CITY_LATLON = window.CITY_LATLON || {
  Berlin: [52.52, 13.405],
  Hamburg: [53.5511, 9.9937],
  London: [51.5074, -0.1278],
  Paris: [48.8566, 2.3522],
  Amsterdam: [52.3676, 4.9041],
  Brussels: [50.8503, 4.3517],
  Madrid: [40.4168, -3.7038],
  Rome: [41.9028, 12.4964],
  Vienna: [48.2082, 16.3738],
  Prague: [50.0755, 14.4378],
  Zurich: [47.3769, 8.5417],
  Budapest: [47.4979, 19.0402],
  Copenhagen: [55.6761, 12.5683],
  Lisbon: [38.7223, -9.1393],
  Stockholm: [59.3293, 18.0686]
};

// Fallback foodsData if missing (keep it minimal; you already have a richer foodsData)
window.foodsData = window.foodsData || {
  London: [
    { item: "Fish and Chips", price: "$11.40" },
    { item: "Full English Breakfast", price: "$12.80" },
    { item: "Sticky Toffee Pudding", price: "$6.90" }
  ],
  Paris: [
    { item: "CrÃªpe", price: "$5.10" },
    { item: "Croissant", price: "$2.40" },
    { item: "Macarons", price: "$7.30" }
  ],
  Amsterdam: [
    { item: "Stroopwafel", price: "$5.76" },
    { item: "Thick Dutch fries", price: "$3.21" },
    { item: "Kibbeling", price: "$8.65" }
  ],
  Brussels: [
    { item: "Belgian Waffles", price: "$4.56" },
    { item: "Mussels & Fries", price: "$12.50" }
  ],
  Madrid: [
    { item: "Churros con Chocolate", price: "$4.30" },
    { item: "Bocadillo de Calamares", price: "$7.50" }
  ],
  Rome: [
    { item: "Margherita Pizza", price: "$9.00" },
    { item: "Cacio e Pepe", price: "$11.20" }
  ],
  Vienna: [
    { item: "Sachertorte", price: "$6.80" },
    { item: "Wiener Schnitzel", price: "$13.20" }
  ],
  Prague: [
    { item: "TrdelnÃ­k", price: "$4.00" },
    { item: "SvÃ­ÄkovÃ¡", price: "$10.90" }
  ],
  Zurich: [
    { item: "RÃ¶sti", price: "$8.50" },
    { item: "Fondue", price: "$14.30" }
  ],
  Budapest: [
    { item: "Goulash", price: "$9.10" },
    { item: "LÃ¡ngos", price: "$5.30" }
  ],
  Copenhagen: [
    { item: "SmÃ¸rrebrÃ¸d", price: "$8.40" },
    { item: "Cinnamon Bun", price: "$3.90" }
  ],
  Lisbon: [
    { item: "Pastel de Nata", price: "$2.10" },
    { item: "Bifana", price: "$5.20" }
  ]
};

// Haversine (namespaced to avoid clashes)
function LON_haversineKm(a, b) {
  const R = 6371;
  const [lat1, lon1] = a.map(x => x * Math.PI / 180);
  const [lat2, lon2] = b.map(x => x * Math.PI / 180);
  const dlat = lat2 - lat1;
  const dlon = lon2 - lon1;
  const s = Math.sin(dlat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dlon/2)**2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

function LON_buildMatrix(cities) {
  // Use the CSV-aware global buildMatrix (falls back to haversine when needed)
  return buildMatrix(cities);
}

// Build a greedy path that always visits the closest unvisited city next
function LON_planGreedy(count) {
  const usableCities = LON_CHOOSABLE_CITIES.filter(city => CITY_LATLON[city]);
  const desired = Math.min(Math.max(1, count || 0), usableCities.length + 1);
  if (desired <= 0) return [];

  const route = [LON_START];
  if (desired === 1) return route;

  const remaining = usableCities.slice();
  let current = LON_START;

  while (route.length < desired && remaining.length) {
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      const dist = distanceBetweenCities(current, candidate);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    if (bestIdx === -1) break;

    const nextCity = remaining.splice(bestIdx, 1)[0];
    route.push(nextCity);
    current = nextCity;
  }

  return route;
}

// Nearest Neighbor (fixed start index 0: London)
function LON_nearestNeighbor(M) {
  const n = M.length;
  const visited = Array(n).fill(false);
  const order = [0];
  visited[0] = true;
  for (let step=1; step<n; step++) {
    const last = order[order.length-1];
    let best = -1, bestD = Infinity;
    for (let j=0;j<n;j++) if (!visited[j]) {
      const d = M[last][j];
      if (d < bestD) { bestD = d; best = j; }
    }
    visited[best] = true; order.push(best);
  }
  return order;
}

// 2-opt improvement for open path (keeps first node fixed)
function LON_twoOpt(order, M, maxIter=1500) {
  const n = order.length;
  function pathLen(ord) { let s=0; for (let i=0;i<n-1;i++) s += M[ord[i]][ord[i+1]]; return s; }
  let best = order.slice();
  let bestLen = pathLen(best);
  let improved = true, iter = 0;
  while (improved && iter < maxIter) {
    improved = false; iter++;
    for (let i=1;i<n-2;i++) {
      for (let k=i+1;k<n-1;k++) {
        const a=best[i-1], b=best[i], c=best[k], d=best[k+1];
        const delta = (M[a][c] + M[b][d]) - (M[a][b] + M[c][d]);
        if (delta < -1e-6) {
          const seg = best.slice(i, k+1).reverse();
          best.splice(i, k-i+1, ...seg);
          bestLen += delta;
          improved = true;
        }
      }
    }
  }
  return best;
}

function LON_renderRoute(cities, order, M) {
  const tbody = document.getElementById('lon-route-body');
  const totalP = document.getElementById('lon-route-total');
  tbody.innerHTML = '';
  let totalKm = 0;
  for (let i=0;i<order.length;i++) {
    const idx = order[i];
    const city = cities[idx];
    const leg = i===0 ? 0 : M[order[i-1]][idx];
    if (i>0) totalKm += leg;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td>${city}</td><td>${i===0?'-':Math.round(leg)}</td>`;
    tbody.appendChild(tr);
  }
  totalP.textContent = `Total distance (no return to start): ${Math.round(totalKm)} km`;
  return totalKm;
}

// Simple price parser like "$12.50" -> 12.50
function LON_parseUSD(s) {
  if (!s) return 0;
  const n = parseFloat(String(s).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

// Render food purchase panel for the visited cities into a given mount
function LON_renderFoods(visitedCities, onTotalsChanged, mountSelector = '#lon-foods') {
  const mount = document.querySelector(mountSelector);
  mount.innerHTML = '';

  visitedCities.forEach(city => {
    const items = (foodsData[city] || []).slice(0, 6);
    const section = document.createElement('div');
    section.style.marginTop = '10px';
    section.innerHTML = `
      <h3 style="margin:6px 0;">${city}</h3>
      <table>
        <thead><tr><th>Food</th><th>Price (USD)</th><th>Qty</th><th>Subtotal</th></tr></thead>
        <tbody></tbody>
      </table>
      <p class="lon-city-summary hint" style="margin:6px 0 0;">City total: $0.00 • Items: 0</p>
    `;
    const tbody = section.querySelector('tbody');
    const summaryEl = section.querySelector('.lon-city-summary');

    const updateCitySummary = () => {
      let citySum = 0;
      let itemCount = 0;
      tbody.querySelectorAll('tr').forEach(tr => {
        const sub = tr.querySelector('.lon-sub');
        const qty = tr.querySelector('input');
        citySum += LON_parseUSD(sub && sub.textContent);
        itemCount += Math.max(0, Math.min(9999, parseInt(qty && qty.value || '0', 10) || 0));
      });
      if (summaryEl) summaryEl.textContent = `City total: $${citySum.toFixed(2)} • Items: ${itemCount}`;
    };

    items.forEach(({item, price}) => {
      const tr = document.createElement('tr');
      const unit = LON_parseUSD(price);
      tr.innerHTML = `
        <td>${item}</td>
        <td>${price}</td>
        <td><input type="number" min="0" max="9" value="0" style="width:60px; padding:2px 4px; border:1px solid #ddd; border-radius:6px;"></td>
        <td class="lon-sub">$0.00</td>
      `;
      const qtyEl = tr.querySelector('input');
      const subEl = tr.querySelector('.lon-sub');
      const recalc = () => {
        const qty = Math.max(0, Math.min(9, parseInt(qtyEl.value || '0', 10) || 0));
        const sub = unit * qty;
        subEl.textContent = `$${sub.toFixed(2)}`;
        updateCitySummary();
        onTotalsChanged();
      };
      qtyEl.addEventListener('input', recalc);
      tbody.appendChild(tr);
    });

    // initialize per-city summary once rows exist
    updateCitySummary();
    mount.appendChild(section);
  });
}

function LON_computeFoodTotalUSD(mountSelector = '#lon-foods') {
  let sum = 0;
  document.querySelectorAll(`${mountSelector} .lon-sub`).forEach(td => {
    const v = LON_parseUSD(td.textContent);
    sum += v;
  });
  return sum;
}

let lonInitDone = false;
function initLondonPlan() {
  if (lonInitDone) return;

  const countEl = document.getElementById('lon-city-count');
  const rangeEl = document.getElementById('lon-city-range');
  const listEl = document.getElementById('lon-city-list');
  const costEl = document.getElementById('lon-costkm');
  const routeBody = document.getElementById('lon-route-body');
  const routeTotalEl = document.getElementById('lon-route-total');
  const foodMount = document.getElementById('lon-foods');
  const foodTotalEl = document.getElementById('lon-food-total');
  const grandTotalEl = document.getElementById('lon-grand-total');
  const planBtn = document.getElementById('lon-plan-btn');
  const usableCount = LON_CHOOSABLE_CITIES.filter(city => CITY_LATLON[city]).length;
  const maxVisit = Math.min(12, usableCount); // up to 12 cities NOT including London
  if (countEl) {
    countEl.max = maxVisit;
    if (!countEl.value) {
      countEl.value = String(Math.min(5, maxVisit));
    }
  }
  if (rangeEl) {
    rangeEl.textContent = `Choose between 1 and ${maxVisit} cities to visit (not including London).`;
  }
  if (listEl) {
    listEl.textContent = `Other cities considered: ${LON_CHOOSABLE_CITIES.join(', ')}.`;
  }

  let lastTotalKm = 0;

  const recomputeGrand = () => {
    const foodUSD = LON_computeFoodTotalUSD('#lon-foods');
    const costPerKm = parseFloat(costEl && costEl.value ? costEl.value : '0') || 0;
    const distanceUSD = lastTotalKm * costPerKm;
    if (foodTotalEl) {
      foodTotalEl.textContent = `Food total: $${foodUSD.toFixed(2)}`;
    }
    if (grandTotalEl) {
      grandTotalEl.textContent = `Grand total: $${(foodUSD + distanceUSD).toFixed(2)} (includes distance cost $${distanceUSD.toFixed(2)})`;
    }
  };

  if (costEl) {
    costEl.addEventListener('input', recomputeGrand);
  }

  if (planBtn) {
    planBtn.addEventListener('click', () => {
      if (!routeBody || !routeTotalEl || !foodMount) return;

      let requested = parseInt(countEl ? countEl.value : '0', 10);
if (isNaN(requested) || requested < 1) {
  routeBody.innerHTML = '';
  routeTotalEl.textContent = 'Enter how many cities you want to visit (minimum 1).';
  foodMount.innerHTML = '';
  if (foodTotalEl) foodTotalEl.textContent = '';
  if (grandTotalEl) grandTotalEl.textContent = '';
  lastTotalKm = 0;
  return;
}

// cap to 12 cities (excluding London)
const maxCities = 12;
requested = Math.min(requested, maxCities);

// always ensure Hamburg is considered as a potential nearby city
if (!LON_CHOOSABLE_CITIES.includes('Hamburg')) {
  LON_CHOOSABLE_CITIES.push('Hamburg');
}

      const targetCount = Math.min(requested, maxCities);
      if (countEl) {
        countEl.value = String(targetCount);
      }
      const routeCities = LON_planGreedy(targetCount);

      if (routeCities.length === 0) {
        routeBody.innerHTML = '';
        routeTotalEl.textContent = 'No cities available to plan a trip.';
        foodMount.innerHTML = '';
        if (foodTotalEl) foodTotalEl.textContent = '';
        if (grandTotalEl) grandTotalEl.textContent = '';
        lastTotalKm = 0;
        return;
      }

      const M = LON_buildMatrix(routeCities);
      const order = routeCities.map((_, idx) => idx);
      const totalKm = LON_renderRoute(routeCities, order, M);
      lastTotalKm = totalKm;
      routeTotalEl.textContent += ` across ${routeCities.length} cities.`;

      LON_renderFoods(routeCities, recomputeGrand, '#lon-foods');
      recomputeGrand();

      if (requested > maxCities) {
        routeTotalEl.textContent += ` Only ${maxCities} cities are available for this planner.`;
      } else if (routeCities.length < requested) {
        if (countEl) {
          countEl.value = String(routeCities.length);
        }
        routeTotalEl.textContent += ` Only ${routeCities.length} cities have distance data.`;
      }
    });
  }

  lonInitDone = true;
}


