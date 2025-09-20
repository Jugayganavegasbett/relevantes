(function(){
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const showErr = m => { const b=$("#errorBox"); if(b){ b.textContent="Error: "+m; b.hidden=false; } };

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

  function collectData(){
    const generales = {
      fecha_hora: $("#g_fecha").value.trim(),
      pu: $("#g_pu").value.trim(),
      dependencia: $("#g_dep").value.trim(),
      caratula: $("#g_car").value.trim(),
      subtitulo: $("#g_sub").value.trim(),
      esclarecido: $("#g_ok").value==="si"
    };
    const civiles = CIV.store.slice();
    const fuerzas = FZA.store.slice();
    const objetos = OBJ.store.slice();
    const cuerpo = $("#cuerpo").value;
    return { generales, civiles, fuerzas, objetos, cuerpo };
  }

  // ===== CIVILES =====
  const CIV = {
    store: [],
    add(){
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
      if(!this.store.length){ box.innerHTML=""; return; }
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
    }
  };

  // ===== FUERZAS =====
  const FZA = {
    store: [],
    add(){
      const p = {
        nombre: $("#f_nombre").value, apellido: $("#f_apellido").value, edad: $("#f_edad").value,
        fuerza: $("#f_fuerza").value, jerarquia: $("#f_jerarquia").value, legajo: $("#f_legajo").value,
        destino: $("#f_destino").value,
        loc_domicilio: $("#f_loc").value, calle_domicilio: $("#f_calle").value,
        vinculo: $("#f_vinculo").value, obito: $("#f_obito").value==="true"
      };
      this.store.push(p); this.render();
    },
    render(){
      const box=$("#fuerzasList");
      if(!this.store.length){ box.innerHTML=""; return; }
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
    }
  };

  // ===== OBJETOS =====
  const OBJ = {
    store: [],
    add(){
      const o = { descripcion: $("#o_desc").value, vinculo: $("#o_vinc").value };
      if(!o.descripcion.trim()) return;
      this.store.push(o); this.render();
    },
    render(){
      const box=$("#objetosList");
      if(!this.store.length){ box.innerHTML=""; return; }
      box.innerHTML = `<div class="table"><table><thead><tr>
        <th>#</th><th>Descripción</th><th>Vínculo</th><th>Acción</th>
      </tr></thead><tbody>${
        this.store.map((o,i)=>`<tr>
          <td>${i}</td><td>${o.descripcion}</td><td>${o.vinculo}</td>
          <td><button class="btn ghost" data-delo="${i}">Quitar</button></td>
        </tr>`).join("")
      }</tbody></table></div>`;
      $$("#objetosList [data-delo]").forEach(b=> b.onclick = ()=>{ this.store.splice(parseInt(b.dataset.delo,10),1); this.render(); });
    }
  };

  // ===== Preview / WA / DOCX / CSV =====
  function buildDataFromForm(){ // crea objeto del motor
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

  function preview(){
    const data = buildDataFromForm();
    const out = HRFMT.buildAll(data);
    $("#previewHtml").innerHTML = out.html;
    return out;
  }

  // ===== Hooks UI =====
  $("#addCivil").onclick = ()=> CIV.add();
  $("#addFuerza").onclick = ()=> FZA.add();
  $("#addObjeto").onclick = ()=> OBJ.add();

  $("#generar").onclick = preview;
  document.addEventListener("keydown",(e)=>{ if(e.ctrlKey && e.key==="Enter"){ e.preventDefault(); preview(); } });

  $("#copiarWA").onclick = ()=>{ const out=preview(); navigator.clipboard.writeText(out.waLong).then(()=>alert("Copiado para WhatsApp")); };

  $("#descargarWord").onclick = async ()=>{
    try{ await HRFMT.downloadDocx(buildDataFromForm(), (window.docx||{})); }
    catch(e){ console.error(e); showErr(e.message||e); }
  };

  $("#exportCSV1").onclick = ()=>{ HRFMT.downloadCSV([buildDataFromForm()]); };

  // ===== Casos: guardar / actualizar / borrar / cargar / export múltiple =====
  const selectedRadio = ()=> { const r = document.querySelector('input[name="caseSel"]:checked'); return r ? r.getAttribute("data-id") : null; };
  const selectedChecks = ()=> $$(".caseCheck:checked").map(x=>x.getAttribute("data-id"));

  $("#saveCase").onclick = ()=>{
    const name = ($("#caseName").value||"").trim() || "Hecho sin nombre";
    const snap = buildDataFromForm(); snap.id = freshId(); snap.name=name;
    const cases = getCases(); cases.push(snap); setCases(cases); renderCases(); alert("Guardado.");
  };
  $("#updateCase").onclick = ()=>{
    const id = selectedRadio(); if(!id){ alert("Elegí un hecho (radio) para actualizar."); return; }
    const cases = getCases(); const idx = cases.findIndex(c=>c.id===id); if(idx<0){ alert("No encontrado"); return; }
    const snap = buildDataFromForm(); snap.id = id; snap.name = cases[idx].name;
    cases[idx] = snap; setCases(cases); renderCases(); alert("Actualizado.");
  };
  $("#deleteCase").onclick = ()=>{
    const id = selectedRadio(); if(!id){ alert("Elegí un hecho (radio) para borrar."); return; }
    const cases = getCases().filter(c=>c.id!==id); setCases(cases); renderCases();
  };
  $("#loadSelected").onclick = ()=>{
    const id = selectedRadio(); if(!id){ alert("Elegí un hecho (radio) para cargar."); return; }
    const c = getCases().find(x=>x.id===id); if(!c){ alert("No encontrado"); return; }
    loadSnapshot(c); renderCases(); preview(); alert("Cargado.");
  };

  $("#exportCSV").onclick = ()=>{
    const ids = selectedChecks(); if(!ids.length){ alert("Seleccioná al menos un hecho (checkbox)."); return; }
    const list = getCases().filter(c=>ids.includes(c.id));
    HRFMT.downloadCSV(list);
  };

  $("#downloadWordMulti").onclick = async ()=>{
    const ids = selectedChecks(); if(!ids.length){ alert("Seleccioná al menos un hecho (checkbox)."); return; }
    // Armamos un DOCX con varios hechos, usando el motor para cada uno
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
  };

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
  }

  function renderTitlePreview(){
    const t = [$("#g_fecha").value,$("#g_pu").value,$("#g_dep").value,$("#g_car").value].filter(Boolean).join(" – ");
    const sub = $("#g_sub").value; const ok = ($("#g_ok").value==="si");
    $("#tituloCompuesto").innerHTML = `<strong>${t.toUpperCase()}</strong>`;
    $("#subCompuesto").innerHTML = `<span class="badge ${ok?'blue':'red'}"><strong>${sub}</strong></span>`;
  }
  ["g_fecha","g_pu","g_dep","g_car","g_sub","g_ok"].forEach(id=>{
    const n=$("#"+id); if(n) n.addEventListener("input", renderTitlePreview);
  });

  // inicial
  renderCases();
})();
