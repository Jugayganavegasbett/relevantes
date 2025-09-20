// assets/templates.js
(function(){
  const defaults = {
    roles: ["Victima","Imputado","Denunciante","Testigo","PP","Aprehendido","Detenido","Menor","NN","Damnificado institucional"]
  };
  // si ya existe CATALOG lo conservamos y completamos
  window.CATALOG = Object.assign({}, defaults, window.CATALOG || {});
})();

