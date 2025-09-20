// assets/app.js
(function(){
  const $ = (q)=>document.querySelector(q);
  const el = (t,c)=>{const n=document.createElement(t); if(c) n.className=c; return n;};
  const showErr = (msg)=>{ const b=$("#errorBox"); if(!b) return; b.textContent="Error: "+msg; b.hidden=false; };
  const hideErr = ()=>{ const b=$("#errorBox"); if(b) b.hidden=true; };

  const TitleCase = (s)=> (s||"").toLowerCase().split(/(\s|-)/).map(p=>{
    if(p.trim()===""||p==='-') return p; return p.charAt(0).toUpperCase()+p.slice(1);
  }).join("");

  window.addEventListener("DOMContentLoaded", ()=> {
    try { init(); hideErr(); } 
    catch(e){ console.error(e); showErr(e?.message||String(e)); }
  });

  function init(){
    // ===== Catálogo robusto =====
    const C = window.CATALOG || {};
    const ROLES = Array.isArray(C.roles) && C.roles.length ? C.roles :
      ["Victima","Imputado","Denunciante","Testigo","PP"];

    // ===== Autosave =====
    const state = loadState();
    function loadState(){
      try{ return Object.assign({personas:[]}, JSON.parse(localStorage.getItem("hr_simple")||"{}")); }
      catch{ return {personas:[]}; }
    }
    function save(){ localStorage.setItem("hr_simple", JSON.stringify(state)); }

    // ===== Bind básicos (si falta un id, se ignora sin romper) =====
    ["fecha","pu","comisaria","caratula","titulo","subtitulo","estado","ufi","juzgado","preventor","barrio","cuerpo","secuestroTexto"].forEach(id=>{
      const n=$("#"+id); if(!n) return;
      n.value = state[id] ?? "";
      n.oninput = ()=>{ state[id]=n.value; save(); };
    });

    // ===== Roles =====
    const rolesSel = $("#roles");
    if(rolesSel){
      rolesSel.innerHTML = "";
      ROLES.forEach(r=>{ const o=el("option"); o.textContent=r; rolesSel.appendChild(o); });
    }

    // ===== Personas =====
    if($("#agregarPersona")) $("#agregarPersona").onclick = ()=>{ 
      state.personas.push({rol: rolesSel ? (rolesSel.value||ROLES[0]) : ROLES[0]}); 
      save(); renderPersonas(); 
    };
    renderPersonas();

    function renderPersonas(){
      const wrap=$("#personas"); if(!wrap) return;
      wrap.innerHTML="";
      const byRole = {};
      state.personas.forEach(p=>{ const k=(p.rol||"").toLowerCase(); (byRole[k]=byRole[k]||[]).push(p); });
      state.personas.forEach((p,idx)=>{
        const roleIdx = (byRole[(p.rol||"").toLowerCase()]||[]).indexOf(p);
        const item = el("div","item");
        item.innerHTML = `
          <div class="line">
            <select data-k="rol">${ROLES.map(r=>`<option ${p.rol===r?'selected':''}>${r}</option>`).join("")}</select>
            <input data-k="nombre" placeholder="Nombre" value="${p.nombre||''}"/>
            <input data-k="apellido" placeholder="Apellido" value="${p.apellido||''}"/>
            <input data-k="edad" placeholder="Edad" value="${p.edad||''}"/>
            <input data-k="domicilio" placeholder="Domicilio" value="${p.domicilio||''}"/>
            <input data-k="ciudad" placeholder="Ciudad" value="${p.ciudad||''}"/>
          </div>
          <div class="small">Usar en texto: #${(p.rol||'').toLowerCase()}:${roleIdx} (se capitaliza Nombre/Apellido/Domicilio/Ciudad)</div>
          <div class="row" style="justify-content:flex-end;margin-top:6px">
            <button class="btn outline" data-del>Eliminar</button>
          </div>`;
        item.querySelectorAll("input,select").forEach(inp=>{
          inp.oninput = (e)=>{ p[e.target.getAttribute("data-k")] = e.target.value; save(); };
        });
        item.querySelector("[data-del]").onclick = ()=>{ state.personas.splice(idx,1); save(); renderPersonas(); };
        wrap.appendChild(item);
      });
    }

    // ===== Generación (placeholders + secuestro libre) =====
    function personaHTML(role, idx){
      const arr = state.personas.filter(p=>(p.rol||"").toLowerCase()===role);
      const p = arr[idx]; if(!p) return null;
      const base = `${TitleCase(p.nombre||"")} ${TitleCase(p.apellido||"")}${p.edad?` (${p.edad})`:""}${p.domicilio?` – ${TitleCase(p.domicilio)}`:""}${p.ciudad?`, ${TitleCase(p.ciudad)}`:""}`;
      return `<strong>${base.trim()}</strong>`;
    }
    const formatSecuestroHtml = (txt)=> (txt||"").trim() ? `<em><u>${(txt||"").trim()}</u></em>` : "";

    function replacePlaceholders(text){
      const warn = $("#placeholdersWarn");
      const missing = new Set();
      const rolesLower = ROLES.map(r=>r.toLowerCase());

      rolesLower.forEach(role=>{
        text = text.replace(new RegExp(`#${role}:(\\d+)`,"gi"), (m,idx)=>{
          const html = personaHTML(role, parseInt(idx,10));
          if(!html){ missing.add(m); return m; }
          return html;
        });
      });

      const secHtml = formatSecuestroHtml(($("#secuestroTexto")?.value)||"");
      if(text.includes("#secuestro")){
        text = text.replace(/#secuestro/gi, secHtml);
      } else if (secHtml){
        text = text + (text.endsWith("\n")?"":"\n") + secHtml;
      }

      if(warn){
        if(missing.size){ $("#warnList").textContent = Array.from(missing).join(", "); warn.hidden=false; }
        else warn.hidden=true;
      }
      return text;
    }

    const htmlToWA = (html)=> html
      .replace(/<strong>(.*?)<\/strong>/g, (m,p1)=>`*${p1}*`)
      .replace(/<em>(.*?)<\/em>/g, (m,p1)=>`_${p1}_`)
      .replace(/<u>(.*?)<\/u>/g,   (m,p1)=>`_${p1}_`)
      .replace(/<[^>]+>/g,"");

    function generar(){
      const titulo = ($("#titulo")?.value||"").trim();
      const subtitulo = ($("#subtitulo")?.value||"").trim();
      const estado = ($("#estado")?.value||"no");
      const cuerpo = replacePlaceholders(($("#cuerpo")?.value||"").trim());
      const barrio = ($("#barrio")?.value||"").trim();

      const subtBadge = `<span class="badge ${estado==='si'?'blue':'red'}"><strong>${subtitulo}</strong></span>`;
      const encabezado = `<strong>${titulo}</strong> ${subtBadge}`;
      const loc = barrio ? `\nUbicación: ${TitleCase(barrio)}` : "";

      if($("#preview")) $("#preview").innerHTML = encabezado + "\n\n" + cuerpo + loc;

      const waShort = `*${titulo}*\n*${subtitulo}*`;
      const waLong  = waShort + "\n\n" + htmlToWA(cuerpo) + (loc? "\n\n"+loc : "");
      if($("#previewWaShort")) $("#previewWaShort").textContent = waShort;
      if($("#previewWaLong"))  $("#previewWaLong").textContent  = waLong;

      return {titulo, subtitulo, estado, cuerpoHtml: cuerpo, waShort, waLong};
    }

    if($("#generar")) $("#generar").onclick = generar;
    document.addEventListener("keydown",(e)=>{ if(e.ctrlKey && e.key==="Enter"){ e.preventDefault(); generar(); } });

    if($("#copiarWACorto")) $("#copiarWACorto").onclick = ()=>{ const d=generar(); navigator.clipboard.writeText(d.waShort).then(()=>alert("Copiado (corta)")); };
    if($("#copiarWALargo")) $("#copiarWALargo").onclick = ()=>{ const d=generar(); navigator.clipboard.writeText(d.waLong).then(()=>alert("Copiado (larga)")); };

    // ===== DOCX (v8.x) =====
    if($("#descargarWord")) $("#descargarWord").onclick = async ()=>{
      try{
        const d = generar();
        const docx = window.docx;
        if(!docx || !docx.Document) throw new Error("Librería docx no cargada");

        function htmlFragToDocx(html){
          const parts = html.split(/(<\/?strong>|<\/?em>|<\/?u>)/g);
          let b=false,i=false,u=false; const runs=[];
          for(const part of parts){
            if(part==="<strong>"){b=true;continue;}
            if(part==="</strong>"){b=false;continue;}
            if(part==="<em>"){i=true;continue;}
            if(part==="</em>"){i=false;continue;}
            if(part==="<u>"){u=true;continue;}
            if(part==="</u>"){u=false;continue;}
            if(part){ runs.push(new docx.TextRun({text:part, bold:b, italics:i, underline: u?{}:undefined})); }
          }
          return new docx.Paragraph({children:runs, alignment: docx.AlignmentType.JUSTIFIED, spacing:{after:200}});
        }

        const fecha = $("#fecha")?.value||"";
        const pu = $("#pu")?.value||"";
        const comisaria = $("#comisaria")?.value||"";
        const caratula = $("#caratula")?.value||"";
        const ufi = $("#ufi")?.value||"";
        const juz = $("#juzgado")?.value||"";
        const prev = $("#preventor")?.value||"";
        const barrio = $("#barrio")?.value||"";

        const bodyParas = (d.cuerpoHtml||"").split(/\n\n+/).map(p=>htmlFragToDocx(p));
        const meta = [
          new docx.Paragraph({text:`Fecha/Hora: ${fecha}`, style:"Meta"}),
          new docx.Paragraph({text:`PU/IPP: ${pu}`, style:"Meta"}),
          new docx.Paragraph({text:`Dependencia: ${comisaria}`, style:"Meta"}),
          new docx.Paragraph({text:`Carátula: ${caratula}`, style:"Meta"}),
          ...(ufi?[new docx.Paragraph({text:`UFI/Intervención: ${ufi}`, style:"Meta"})]:[]),
          ...(juz?[new docx.Paragraph({text:`Juzgado: ${juz}`, style:"Meta"})]:[]),
          ...(prev?[new docx.Paragraph({text:`Preventor/Móvil: ${prev}`, style:"Meta"})]:[]),
          ...(barrio?[new docx.Paragraph({text:`Ubicación: ${TitleCase(barrio)}`, style:"Meta"})]:[]),
          new docx.Paragraph({text:""})
        ];

        const doc = new docx.Document({
          styles:{ paragraphStyles:[
            {id:"H",name:"Heading",basedOn:"Normal",run:{bold:true,size:28},paragraph:{spacing:{after:200}}},
            {id:"S",name:"Sub",basedOn:"Normal",run:{bold:true,size:24,color: d.estado==='si'?'2e86ff':'ff4d4d'},paragraph:{spacing:{after:200}}},
            {id:"Meta",name:"Meta",basedOn:"Normal",run:{italic:true,color:"6b7cff"}}
          ]},
          sections: [{
            children: [
              new docx.Paragraph({text:d.titulo, style:"H"}),
              new docx.Paragraph({text:d.subtitulo, style:"S"}),
              ...meta,
              ...bodyParas
            ]
          }]
        });

        const blob = await docx.Packer.toBlob(doc);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Hecho_Relevante_${(pu||'sinPU').replace(/\s+/g,'_')}.docx`;
        a.click();
      }catch(e){ console.error(e); showErr(e.message||e); }
    };

    // ===== Semilla opcional (borrar si querés vacío) =====
    if(!state.personas.length){
      state.personas.push({rol:ROLES[0], nombre:"edgardo marcelo", apellido:"lemos", edad:"62", domicilio:"agapantus 1237", ciudad:"mar del plata"});
      state.cuerpo = state.cuerpo || "Fecha... entrevistan con #victima:0 ... sustrayendo #secuestro ...";
      state.secuestroTexto = state.secuestroTexto || "Celular iPhone 13, $ 2.000.000 y U$D 20.000.";
      ["cuerpo","secuestroTexto"].forEach(id=>{ if($("#"+id)) $("#"+id).value=state[id]; });
      save();
      renderPersonas();
    }
  }
})();
