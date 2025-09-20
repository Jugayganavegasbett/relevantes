(function(){
  const $ = (q)=>document.querySelector(q);
  const el = (t,c)=>{const n=document.createElement(t); if(c) n.className=c; return n;};
  const showErr = (m)=>{const b=$("#errorBox"); if(b){b.textContent="Error: "+m; b.hidden=false;}};
  const hideErr = ()=>{const b=$("#errorBox"); if(b) b.hidden=true;};

  const TitleCase = (s)=> (s||"").toLowerCase().split(/(\s|-)/).map(p=>{
    if(p.trim()===""||p==='-') return p; return p.charAt(0).toUpperCase()+p.slice(1);
  }).join("");

  window.addEventListener("DOMContentLoaded", ()=>{ try{ init(); hideErr(); }catch(e){ console.error(e); showErr(e.message||e); } });

  function init(){
    // Roles
    const ROLES = (window.CATALOG && Array.isArray(window.CATALOG.roles) && window.CATALOG.roles.length)
      ? window.CATALOG.roles
      : ["Victima","Imputado","Denunciante","Testigo","PP"];

    // Estado
    const state = loadState(); function loadState(){ try{ return Object.assign({personas:[]}, JSON.parse(localStorage.getItem("hr_state")||"{}")); }catch{ return {personas:[]}; } }
    function save(){ localStorage.setItem("hr_state", JSON.stringify(state)); }

    // Bind
    ["fecha","pu","comisaria","caratula","subtitulo","estado","cuerpo","secuestroTexto"].forEach(id=>{
      const n=$("#"+id); if(!n) return; n.value = state[id] ?? ""; n.oninput=()=>{ state[id]=n.value; save(); renderTitlePreview(); };
    });

    // Personas
    const rolesSel = $("#roles"); if(rolesSel){ ROLES.forEach(r=>{ const o=el("option"); o.textContent=r; rolesSel.appendChild(o); }); }
    if($("#agregarPersona")) $("#agregarPersona").onclick=()=>{ state.personas.push({rol: rolesSel ? rolesSel.value : ROLES[0]}); save(); renderPersonas(); };
    renderPersonas();
    function renderPersonas(){
      const wrap=$("#personas"); if(!wrap) return; wrap.innerHTML="";
      const byRole={}; state.personas.forEach(p=>{ const k=(p.rol||"").toLowerCase(); (byRole[k]=byRole[k]||[]).push(p); });
      state.personas.forEach((p,idx)=>{
        const roleIdx=(byRole[(p.rol||"").toLowerCase()]||[]).indexOf(p);
        const item=el("div","item");
        item.innerHTML = `
          <div class="line">
            <select data-k="rol">${ROLES.map(r=>`<option ${p.rol===r?'selected':''}>${r}</option>`).join("")}</select>
            <input data-k="nombre" placeholder="Nombre" value="${p.nombre||''}"/>
            <input data-k="apellido" placeholder="Apellido" value="${p.apellido||''}"/>
            <input data-k="edad" placeholder="Edad" value="${p.edad||''}"/>
            <input data-k="domicilio" placeholder="Domicilio" value="${p.domicilio||''}"/>
            <input data-k="ciudad" placeholder="Ciudad" value="${p.ciudad||''}"/>
          </div>
          <div class="small">Placeholder: #${(p.rol||'').toLowerCase()}:${roleIdx} (capitaliza nombre/apellido/domicilio/ciudad)</div>
          <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-del>Eliminar</button></div>`;
        item.querySelectorAll("input,select").forEach(inp=>{
          inp.oninput=(e)=>{ p[e.target.getAttribute("data-k")] = e.target.value; save(); };
        });
        item.querySelector("[data-del]").onclick=()=>{ state.personas.splice(idx,1); save(); renderPersonas(); };
        wrap.appendChild(item);
      });
    }

    // Título compuesto (para preview)
    function tituloCompuesto(){
      const fechaFull = ($("#fecha")?.value||"").trim();
      const fechaSolo = fechaFull.split("–")[0].trim() || fechaFull;
      const pu = ($("#pu")?.value||"").trim();
      const comisaria = ($("#comisaria")?.value||"").trim();
      const caratula = ($("#caratula")?.value||"").trim();
      return [fechaSolo, pu, comisaria, caratula].filter(Boolean).join(" – ");
    }
    function renderTitlePreview(){
      const t = tituloCompuesto();
      const sub = ($("#subtitulo")?.value||"").trim();
      const estado = ($("#estado")?.value||"no");
      $("#tituloCompuesto").innerHTML = `<strong>${t}</strong>`;
      $("#subCompuesto").innerHTML = `<span class="badge ${estado==='si'?'blue':'red'}"><strong>${sub}</strong></span>`;
    }
    renderTitlePreview();

    // Helpers de formato
    function personaHTML(role, idx){
      const arr = state.personas.filter(p=>(p.rol||"").toLowerCase()===role);
      const p = arr[idx]; if(!p) return null;
      const base = `${TitleCase(p.nombre||"")} ${TitleCase(p.apellido||"")}${p.edad?` (${p.edad})`:""}${p.domicilio?` – ${TitleCase(p.domicilio)}`:""}${p.ciudad?`, ${TitleCase(p.ciudad)}`:""}`;
      return `<strong>${base.trim()}</strong>`;
    }
    const formatSecuestroHtml = (txt)=> (txt||"").trim()? `<em><u>${(txt||"").trim()}</u></em>`:"";

    function replacePlaceholders(text){
      // personas
      const rolesLower = (window.CATALOG?.roles || ROLES).map(r=>r.toLowerCase());
      rolesLower.forEach(role=>{
        text = text.replace(new RegExp(`#${role}:(\\d+)`,"gi"), (m,idx)=>{
          const html = personaHTML(role, parseInt(idx,10)); return html || m;
        });
      });
      // secuestro: solo se inserta donde pones #secuestro
      const secHtml = formatSecuestroHtml(($("#secuestroTexto")?.value)||"");
      if(text.includes("#secuestro")) text = text.replace(/#secuestro/gi, secHtml);
      return text;
    }

    function htmlToWA(html){
      let s = html || "";
      // em+u combinados -> _..._
      s = s.replace(/<em><u>(.*?)<\/u><\/em>/gis, '_$1_');
      s = s.replace(/<u><em>(.*?)<\/em><\/u>/gis, '_$1_');
      // negrita y cursiva simples
      s = s.replace(/<strong>(.*?)<\/strong>/gis, '*$1*');
      s = s.replace(/<em>(.*?)<\/em>/gis, '_$1_');
      // subrayado restante se elimina (ya lo cubre cursiva)
      s = s.replace(/<u>(.*?)<\/u>/gis, '$1');
      // quitar cualquier etiqueta
      s = s.replace(/<[^>]+>/g, '');
      // compactar saltos: 1 salto => espacio, 2 o más => 2
      s = s.replace(/\r/g,'').replace(/\n{3,}/g,'\n\n').replace(/([^\n])\n([^\n])/g,'$1 $2');
      return s.trim();
    }

    // Generar vistas
    function generar(){
      const estado = ($("#estado")?.value||"no");
      const compuesto = tituloCompuesto();
      const compuestoWord = compuesto.split(" – ").map((x,i)=> i<2? x : x.toUpperCase()).join(" – "); // COMISARÍA + CARÁTULA en mayúscula
      const subtitulo = ($("#subtitulo")?.value||"").trim();

      const cuerpoHtml = replacePlaceholders(($("#cuerpo")?.value||"").trim());

      // Preview HTML
      const colorClase = (estado==='si')?'blue':'red';
      $("#preview").innerHTML = `<strong>${compuestoWord}</strong>\n<span class="badge ${colorClase}"><strong>${subtitulo}</strong></span>\n\n${cuerpoHtml}`;

      // WhatsApp (como tu ejemplo)
      const waHeader1 = `*${compuesto}*`;
      const waHeader2 = `*${subtitulo}*`;
      const waBody = htmlToWA(cuerpoHtml);
      const waShort = `${waHeader1}\n${waHeader2}`;
      const waLong  = `${waShort}\n\n${waBody}`;
      $("#previewWaShort").textContent = waShort;
      $("#previewWaLong").textContent  = waLong;

      return {estado, subtitulo, waShort, waLong, cuerpoHtml, compuesto, compuestoWord};
    }
    $("#generar").onclick = generar;
    document.addEventListener("keydown",(e)=>{ if(e.ctrlKey && e.key==="Enter"){ e.preventDefault(); generar(); } });

    $("#copiarWACorto").onclick = ()=>{ const d=generar(); navigator.clipboard.writeText(d.waShort).then(()=>alert("Copiado (corta)")); };
    $("#copiarWALargo").onclick = ()=>{ const d=generar(); navigator.clipboard.writeText(d.waLong).then(()=>alert("Copiado (larga)")); };

    // Word (docx v8): 1) línea compuesta en negrita (MAYÚS en Dep/Carátula), 2) subtítulo color, 3) cuerpo justificado
    $("#descargarWord").onclick = async ()=>{
      try{
        const d = generar();
        const docx = window.docx; if(!docx || !docx.Document) throw new Error("Librería docx no cargada");

        const JUST = docx.AlignmentType.JUSTIFIED;
        const toRuns = (html)=>{
          const parts = (html||"").split(/(<\/?strong>|<\/?em>|<\/?u>)/g);
          let B=false,I=false,U=false; const runs=[];
          for(const part of parts){
            if(part==="<strong>"){B=true;continue;}
            if(part==="</strong>"){B=false;continue;}
            if(part==="<em>"){I=true;continue;}
            if(part==="</em>"){I=false;continue;}
            if(part==="<u>"){U=true;continue;}
            if(part==="</u>"){U=false;continue;}
            if(part){ runs.push(new docx.TextRun({text:part,bold:B,italics:I,underline:U?{}:undefined})); }
          }
          return runs;
        };
        const bodyParas = (d.cuerpoHtml||"").split(/\n\n+/).map(p=> new docx.Paragraph({children:toRuns(p), alignment:JUST, spacing:{after:200}}));
        const colorSub = (d.estado==='si') ? "2e86ff" : "ff4d4d";

        const doc = new docx.Document({
          sections: [{
            children: [
              new docx.Paragraph({children:[new docx.TextRun({text:d.compoundWord || d.compuestoWord, bold:true})]}),
              new docx.Paragraph({children:[new docx.TextRun({text:d.subtitulo, bold:true, color:colorSub})]}),
              new docx.Paragraph({text:""}),
              ...bodyParas
            ]
          }]
        });

        const pu = ($("#pu")?.value||"sinPU").replace(/\s+/g,'_');
        const blob = await docx.Packer.toBlob(doc);
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `Hecho_Relevante_${pu}.docx`; a.click();
      }catch(e){ console.error(e); showErr(e.message||e); }
    };

    // Semilla mínima (podés borrar)
    if(!state.personas.length){
      state.personas.push({rol:ROLES[0], nombre:"edgardo marcelo", apellido:"lemos", edad:"62", domicilio:"agapantus 1237", ciudad:"mar del plata"});
      state.cuerpo = "Fecha, siendo las 17:15 hs., entrevistan con #victima:0, sustrayendo #secuestro .";
      state.secuestroTexto = "Celular iPhone 13, $ 2.000.000 y USD 20.000.";
      $("#cuerpo").value = state.cuerpo; $("#secuestroTexto").value = state.secuestroTexto; save(); renderPersonas(); renderTitlePreview();
    }
  }
})();
