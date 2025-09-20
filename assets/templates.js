// Catálogos editables (robustos: si otro script lee antes, evitamos undefined)
window.CATALOG = Object.assign(
  { roles: ["Victima","Imputado","Denunciante","Testigo","PP","Aprehendido","Detenido","Menor","NN","Damnificado institucional"] },
  window.CATALOG || {}
);

