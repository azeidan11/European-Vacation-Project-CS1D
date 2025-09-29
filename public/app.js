
// Simple two-page nav (Home / Distances)
const routes = ["home", "distances", "foods", "plan"];
function show(route) {
  routes.forEach(r => {
    document.getElementById(r).classList.toggle("hidden", r !== route);
    document.getElementById("link-" + r).classList.toggle("active", r === route);
  });
  if (route === "distances") loadDistances();
  if (route === "foods") initFoods();
  if (route === "plan") initPlan();
}

// --- Foods data (parsed from the provided spreadsheet; up to six items per city) ---
const foodsData = {
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
  "Vienna": [
    { item: "Sachertorte", price: "$6.80" },
    { item: "Wiener Schnitzel", price: "$13.20" },
    { item: "Kaiserschmarrn", price: "$7.10" }
  ]
};

let foodsInitDone = false;
function initFoods() {
  if (foodsInitDone) return;
  const citiesBox = document.getElementById('foods-cities');
  const body = document.getElementById('foods-body');
  const title = document.getElementById('foods-city-title');
  const search = document.getElementById('foods-search');
  const hint = document.getElementById('foods-hint');
  if (!citiesBox || !body || !title) return;

  // render city buttons
  const cities = Object.keys(foodsData).sort((a,b)=>a.localeCompare(b));
  citiesBox.innerHTML = '';
  cities.forEach(city => {
    const btn = document.createElement('button');
    btn.textContent = city;
    btn.style.padding = '6px 8px';
    btn.style.border = '1px solid #ddd';
    btn.style.borderRadius = '8px';
    btn.style.background = '#fff';
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', () => {
      title.textContent = city;
      renderFoods(city, search.value || '');
    });
    citiesBox.appendChild(btn);
  });

  function renderFoods(city, q) {
    const items = (foodsData[city] || []).slice(0, 6);
    const norm = (q||'').trim().toLowerCase();
    const filtered = norm ? items.filter(it => it.item.toLowerCase().includes(norm)) : items;

    body.innerHTML = '';
    filtered.forEach(({item, price}) => {
      const tr = document.createElement('tr');
      const td1 = document.createElement('td'); td1.textContent = item; // clicking item does nothing
      const td2 = document.createElement('td'); td2.textContent = price;
      tr.appendChild(td1); tr.appendChild(td2);
      body.appendChild(tr);
    });
    if (hint) hint.textContent = filtered.length ? '' : 'No matching foods.';
  }

  // live search within current city
  if (search) {
    search.addEventListener('input', () => {
      const currentCity = title.textContent && foodsData[title.textContent] ? title.textContent : null;
      if (currentCity) renderFoods(currentCity, search.value || '');
    });
  }

  foodsInitDone = true;
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
document.addEventListener('DOMContentLoaded', () => {
  try { initFoods(); } catch (e) { console.error(e); }
  const initial = (location.hash || '#home').slice(1) || 'home';
  show(initial);
});

// --- Trip planner (Paris start, visit 11 cities) ---
const PLAN_CITIES = [
  // Paris is fixed start; rest will be visited efficiently
  "Paris",
  "Amsterdam", "Brussels", "London", "Madrid", "Rome",
  "Vienna", "Prague", "Zurich", "Budapest", "Copenhagen", "Lisbon"
];

// Latitude/Longitude (approximate city centers)
const CITY_LATLON = {
  Paris: [48.8566, 2.3522],
  Amsterdam: [52.3676, 4.9041],
  Brussels: [50.8503, 4.3517],
  London: [51.5074, -0.1278],
  Madrid: [40.4168, -3.7038],
  Rome: [41.9028, 12.4964],
  Vienna: [48.2082, 16.3738],
  Prague: [50.0755, 14.4378],
  Zurich: [47.3769, 8.5417],
  Budapest: [47.4979, 19.0402],
  Copenhagen: [55.6761, 12.5683],
  Lisbon: [38.7223, -9.1393]
};

function haversineKm(a, b) {
  const R = 6371; // km
  const [lat1, lon1] = a.map(x => x * Math.PI / 180);
  const [lat2, lon2] = b.map(x => x * Math.PI / 180);
  const dlat = lat2 - lat1;
  const dlon = lon2 - lon1;
  const s = Math.sin(dlat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dlon/2)**2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

function buildMatrix(cities) {
  const n = cities.length;
  const M = Array.from({length:n}, () => Array(n).fill(0));
  for (let i=0;i<n;i++) {
    for (let j=i+1;j<n;j++) {
      const dij = haversineKm(CITY_LATLON[cities[i]], CITY_LATLON[cities[j]]);
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

let planInitDone = false;
function initPlan() {
  if (planInitDone) return;
  const btn = document.getElementById('plan-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const cities = PLAN_CITIES.slice();
    const M = buildMatrix(cities);
    let order = nearestNeighborOrder(M);
    order = twoOptOpen(order, M, 1500);
    renderPlan(cities, order, M);
  });
  planInitDone = true;
}
