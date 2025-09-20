(function(){
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const showErr = m => { const b=$("#errorBox"); if(b){ b.textContent="Error: "+m; b.hidden=false; } };

  // === helper: bind seguro (no rompe si falta el botón)
  function bindClick(id, handler){
    const n = document.getElementById(id);
    if (n) n.onclick = handler;
    return !!n;
  }

  const CASEKEY="hr_cases_v1";

  const TitleCase = (s)=> (s||"").toLowerCase().split(/(\s|-)/).map(p=>{
    if(p.trim()===""||p==='-') return p; return p.charAt(0).toUpperCase()+p.slice(1);
  }).join("");

  function getCases(){ try{ return JSON.parse(localStorage.getItem(CASEKEY)||"[]"); }catch{ return []; } }
  function setCases(arr){ localStorage.setItem(CASEKEY, JSON.stringify(arr)); }
  function freshId(){ return "c_"+Date.now()+"_"+Math.random().toString(36).slice(2,7); }

  function renderCases(){
    const box=$("#casesList"); if(!box) return;
    const cases = getCases();
    if(!cases.length){ box.innerHTML="Sin hechos guardados."; return; }
    box.innerHTML = `<table><thead><tr><th></th><th></th><th>Nombre</th><th>Fecha</th><th>PU</th></tr></thead><tbody>${
      cases.map(c=>`<tr>
        <td><input type="checkbox" class="caseCheck" data-id="${c.id}"></td>
        <td><input type="radio" name="caseSel" data-id="${c.id}"></td>
        <td>${c.name||''}</td><td>${c.generales?.fecha_hora||''}</td><td>${c.generales?.pu||''}</td>
      </tr>`).join("")
    }</tbody></table>`;
  }

  // ===== Tag helper =====
  const ROLE_KEYS = ["victima","imputado","denunciante","testigo","pp","aprehendido","detenido","menor","nn","damnificado institucional"];
  const OBJ_CATS  = ["secuestro","sustraccion","hallazgo","otro"];

  function insertAtCursor(textarea, text){
    if(!textarea) return;
    const start = textarea.selectionStart ?? textarea.value.length;
    const end   = textarea.selectionEnd   ?? textarea.value.length;
    const before = textarea.value.slice(0,start);
    const after  = textarea.value.slice(end);
    const needsSpace = before && !/\s$/.test(before) ? " " : "";
    textarea.value = before + needsSpace + text + " " + after;
    const pos = (before + needsSpace + text + " ").length;
    textarea.setSelectionRange(pos,pos);
    textarea.focus();
  }

  function availableTags(){
    const tags = new Set();
    const allPeople = (CIV.store||[]).concat(FZA.store||[]);
    ROLE_KEYS.forEach(role=>{
      const arr = allPeople.filter(p => String(p.vinculo||"").toLowerCase() === role);
      for(let i=0;i<arr.length;i++){ tags.add(`#${role}:${i}`); }
    });
    for(let i=0;i<(FZA.store||[]).length;i++){ tags.add(`#pf:${i}`); }
    if((FZA.store||[]).length){ tags.add(`#pf`); }
    OBJ_CATS.forEach(cat=>{
      const arr = (OBJ.store||[]).filter(o => String(o.vinculo||"").toLowerCase()===cat);
      for(let i=0;i<arr.length;i++){ tags.add(`#${cat}:${i}`); }
      if(arr.length) tags.add(`#${cat}`);
    });
    return Array.from(tags);
  }

  function renderTagHelper(){
    const box = document.getElementById("tagHelper");
    if(!box) return;
    const tags = availableTags();
    if(!tags.length){
      box.innerHTML = `<span class="muted">No hay etiquetas disponibles. Cargá personas/objetos para ver sugerencias.</span>`;
      return;
    }
    box.innerHTML = tags.map(t=>`<button type="button" class="chip" data-tag="${t}">${t}</button>`).join("");
    box.querySelectorAll("[data-tag]").forEach(btn=>{
      btn.onclick = ()=> insertAtCursor(document.getElementById("cuerpo"), btn.dataset.tag);
    });
  }

  // ===== almacenes =====
  const CIV = { store:[], add(){
      const p = {
        nombre: $("#c_nombre").value, apellido: $("#c_apellido").value, edad: $("#c_edad").value,
        genero: $("#c_genero").value, dni: $("#c_dni").value, pais: $("#c_pais").value,
        loc_domicilio: $("#c_loc").value, calle_domicilio: $("#c_calle").value,
        vinculo: $("#c_vinculo").value, obito: $("#c_obito").value==="true"
      };
      this.store.push(p); this.render();
    },
    render(){
      const box=$("#civilesList");
      if(!this.store.length){ box.innerHTML=""; renderTagHelper(); return; }
      box.innerHTML = `<div class="table"><table><thead><tr>
        <th>#</th><th>Vínculo</th><th>Nombre</th><th>Apellido</th><th>Edad</th><th>DNI</th><th>Domicilio</th><th>Acción</th>
      </tr></thead><tbody>${
        this.store.map((p,i)=>`<tr>
          <td>${i}</td><td>${p.vinculo}</td>
          <td>${TitleCase(p.nombre||"")}</td><td>${TitleCase(p.apellido||"")}</td>
          <td>${p.edad||""}</td><td>${p.dni||""}</td>
          <td>${[TitleCase(p.calle_domicilio||""), TitleCase(p.loc_domicilio||"")].filter(Boolean).join(", ")}</td>
          <td><button class="btn ghost" data-delc="${i}">Quitar</button></td>
        </tr>`).join("")
      }</tbody></table></div>`;
      $$("#civilesList [data-delc]").forEach(b=> b.onclick = ()=>{ this.store.splice(parseInt(b.dataset.delc,10),1); this.render(); });
      renderTagHelper();
    }
  };

  const FZA = { store:[], add(){
      const p = {
        nombre: $("#f_nombre").value, apellido: $("#f_apellido").value, edad: $("#f_edad").value,
        fuerza: $("#f_fuerza").value, jerarquia: $("#f_jerarquia").value, legajo: $("#f_legajo").value,
        destino: $("#f_destino").value, loc_domicilio: $("#f_loc").value, calle_domicilio: $("#f_calle").value,
        vinculo: $("#f_vinculo").value, obito: $("#f_obito").value==="true"
      };
      this.store.push(p); this.render();
    },
    render(){
      const box=$("#fuerzasList");
      if(!this.store.length){ box.innerHTML=""; renderTagHelper(); return; }
      box.innerHTML = `<div class="table"><table><thead><tr>
        <th>#</th><th>Vínculo</th><th>Nombre</th><th>Apellido</th><th>Edad</th><th>Fuerza</th><th>Jerarquía</th><th>Destino</th><th>Acción</th>
      </tr></thead><tbody>${
        this.store.map((p,i)=>`<tr>
          <td>${i}</td><td>${p.vinculo}</td>
          <td>${TitleCase(p.nombre||"")}</td><td>${TitleCase(p.apellido||"")}</td>
          <td>${p.edad||""}</td><td>${p.fuerza||""}</td><td>${p.jerarquia||""}</td><td>${p.destino||""}</td>
          <td><button class="btn ghost" data-delf="${i}">Quitar</button></td>
        </tr>`).join("")
      }</tbody></table></div>`;
      $$("#fuerzasList [data-delf]").forEach(b=> b.onclick = ()=>{ this.store.splice(parseInt(b.dataset.delf,10),1); this.render(); });
      renderTagHelper();
    }
  };

  const OBJ = { store:[], add(){
      const o = { descripcion: $("#o_desc").value, vinculo: $("#o_vinc").value };
      if(!o.descripcion.trim()) return;
      this.store.push(o); this.render();
    },
    render(){
      const box=$("#objetosList");
      if(!this.store.length){ box.innerHTML=""; renderTagHelper(); return; }
      box.innerHTML = `<div class="table"><table><thead><tr>
        <th>#</th><th>Descripción</th><th>Vínculo</th><th>Acción</th>
      </tr></thead><tbody>${
        this.store.map((o,i)=>`<tr>
          <td>${i}</td><td>${o.descripcion}</td><td>${o.vinculo}</td>
          <td><button class="btn ghost" data-delo="${i}">Quitar</button></td>
        </tr>`).join("")
      }</tbody></table></div>`;
      $$("#objetosList [data-delo]").forEach(b=> b.onclick = ()=>{ this.store.splice(parseInt(b.dataset.delo,10),1); this.render(); });
      renderTagHelper();
    }
  };

  function buildDataFromForm(){
    return {
      generales: {
        fecha_hora: $("#g_fecha").value.trim(),
        pu: $("#g_pu").value.trim(),
        dependencia: $("#g_dep").value.trim(),
        caratula: $("#g_car").value.trim(),
        subtitulo: $("#g_sub").value.trim(),
        esclarecido: $("#g_ok").value==="si"
      },
      civiles: CIV.store.slice(),
      fuerzas: FZA.store.slice(),
      objetos: OBJ.store.slice(),
      cuerpo: $("#cuerpo").value
    };
  }

  function renderTitlePreview(){
    const t = [$("#g_fecha").value,$("#g_pu").value,$("#g_dep").value,$("#g_car").value].filter(Boolean).join(" – ");
    const sub = $("#g_sub").value; const ok = ($("#g_ok").value==="si");
    $("#tituloCompuesto").innerHTML = `<strong>${t.toUpperCase()}</strong>`;
    $("#subCompuesto").innerHTML = `<span class="badge ${ok?'blue':'red'}"><strong>${sub}</strong></span>`;
  }
  ["g_fecha","g_pu","g_dep","g_car","g_sub","g_ok"].forEach(id=>{
    const n=document.getElementById(id); if(n) n.addEventListener("input", renderTitlePreview);
  });

  function preview(){
    const data = buildDataFromForm();
    const out = HRFMT.buildAll(data);
    $("#previewHtml").innerHTML = out.html;
    return out;
  }

  // ===== binds seguros =====
  bindClick("addCivil",  ()=> CIV.add());
  bindClick("addFuerza", ()=> FZA.add());
  bindClick("addObjeto", ()=> OBJ.add());

  bindClick("generar",   ()=>{ preview(); });
  document.addEventListener("keydown",(e)=>{ if(e.ctrlKey && e.key==="Enter"){ e.preventDefault(); preview(); } });

  bindClick("copiarWA", ()=>{ const out=preview(); navigator.clipboard.writeText(out.waLong).then(()=>alert("Copiado para WhatsApp")); });

  bindClick("descargarWord", async ()=>{
    try{ await HRFMT.downloadDocx(buildDataFromForm(), (window.docx||{})); }
    catch(e){ console.error(e); showErr(e.message||e); }
  });

  bindClick("exportCSV1", ()=>{ HRFMT.downloadCSV([buildDataFromForm()]); });

  // casos
  const selectedRadio = ()=> { const r = document.querySelector('input[name="caseSel"]:checked'); return r ? r.getAttribute("data-id") : null; };
  const selectedChecks = ()=> $$(".caseCheck:checked").map(x=>x.getAttribute("data-id"));

  bindClick("saveCase", ()=>{
    const name = ($("#caseName").value||"").trim() || "Hecho sin nombre";
    const snap = buildDataFromForm(); snap.id = freshId(); snap.name=name;
    const cases = getCases(); cases.push(snap); setCases(cases); renderCases(); alert("Guardado.");
  });

  bindClick("updateCase", ()=>{
    const id = selectedRadio(); if(!id){ alert("Elegí un hecho (radio) para actualizar."); return; }
    const cases = getCases(); const idx = cases.findIndex(c=>c.id===id); if(idx<0){ alert("No encontrado"); return; }
    const snap = buildDataFromForm(); snap.id = id; snap.name = cases[idx].name;
    cases[idx] = snap; setCases(cases); renderCases(); alert("Actualizado.");
  });

  bindClick("deleteCase", ()=>{
    const id = selectedRadio(); if(!id){ alert("Elegí un hecho (radio) para borrar."); return; }
    const cases = getCases().filter(c=>c.id!==id); setCases(cases); renderCases();
  });

  bindClick("loadSelected", ()=>{
    const id = selectedRadio(); if(!id){ alert("Elegí un hecho (radio) para cargar."); return; }
    const c = getCases().find(x=>x.id===id); if(!c){ alert("No encontrado"); return; }
    loadSnapshot(c); renderCases(); preview(); alert("Cargado.");
  });

  bindClick("exportCSV", ()=>{
    const ids = selectedChecks(); if(!ids.length){ alert("Seleccioná al menos un hecho (checkbox)."); return; }
    const list = getCases().filter(c=>ids.includes(c.id));
    HRFMT.downloadCSV(list);
  });

  bindClick("downloadWordMulti", async ()=>{
    const ids = selectedChecks(); if(!ids.length){ alert("Seleccioná al menos un hecho (checkbox)."); return; }
    const docx = window.docx||{}; const { Document, Packer, TextRun, Paragraph, AlignmentType } = docx;
    if(!Document){ showErr("docx no cargada"); return; }

    const JUST = AlignmentType.JUSTIFIED;
    const toRuns = (html)=>{
      const parts=(html||"").split(/(<\/?strong>|<\/?em>|<\/?u>)/g);
      let B=false,I=false,U=false; const runs=[];
      for(const part of parts){
        if(part==="<strong>"){B=true;continue;}
        if(part==="</strong>"){B=false;continue;}
        if(part==="<em>"){I=true;continue;}
        if(part==="</em>"){I=false;continue;}
        if(part==="<u>"){U=true;continue;}
        if(part==="</u>"){U=false;continue;}
        if(part){ runs.push(new TextRun({text:part,bold:B,italics:I,underline:U?{}:undefined})); }
      }
      return runs;
    };

    const selected = getCases().filter(c=>ids.includes(c.id));
    const children = [];
    selected.forEach((snap,i)=>{
      const built = HRFMT.buildAll(snap);
      children.push(new Paragraph({ children:[ new TextRun({ text: built.forDocx.titulo, bold:true }) ] }));
      children.push(new Paragraph({ children:[ new TextRun({ text: built.forDocx.subtitulo, bold:true, color: built.forDocx.color }) ] }));
      (built.forDocx.bodyHtml||"").split(/\n\n+/).forEach(p=>{
        children.push(new Paragraph({ children: toRuns(p), alignment: JUST, spacing:{after:200} }));
      });
      if(i !== selected.length-1) children.push(new Paragraph({ text:"" })); // separador
    });

    const doc = new Document({
      styles:{ default:{ document:{ run:{ font:"Arial", size:24 }, paragraph:{ spacing:{ after:120 } } } } },
      sections:[{ children }]
    });

    const blob = await Packer.toBlob(doc);
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download=`Hechos_Relevantes_${new Date().toISOString().slice(0,10)}.docx`; a.click();
  });

  function loadSnapshot(s){
    $("#g_fecha").value = s.generales?.fecha_hora||"";
    $("#g_pu").value    = s.generales?.pu||"";
    $("#g_dep").value   = s.generales?.dependencia||"";
    $("#g_car").value   = s.generales?.caratula||"";
    $("#g_sub").value   = s.generales?.subtitulo||"";
    $("#g_ok").value    = s.generales?.esclarecido ? "si" : "no";
    CIV.store = (s.civiles||[]).slice(); CIV.render();
    FZA.store = (s.fuerzas||[]).slice(); FZA.render();
    OBJ.store = (s.objetos||[]).slice(); OBJ.render();
    $("#cuerpo").value  = s.cuerpo||"";
    renderTitlePreview();
    renderTagHelper();
  }

  // inicial
  renderCases();
  renderTitlePreview();
  renderTagHelper();
})();
