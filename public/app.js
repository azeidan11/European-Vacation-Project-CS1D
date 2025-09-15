// Simple two-page nav (Home / Distances)
const routes = ["home", "distances"];
function show(route) {
  routes.forEach(r => {
    document.getElementById(r).classList.toggle("hidden", r !== route);
    document.getElementById("link-" + r).classList.toggle("active", r === route);
  });
  if (route === "distances") loadDistances();
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

// Initial screen
show((location.hash || "#home").slice(1) || "home");