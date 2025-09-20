const docx = window.docx;
const $ = (q)=>document.querySelector(q);
const el = (t,c)=>{const n=document.createElement(t); if(c) n.className=c; return n;};

// Load catalogs
const C = window.CATALOG;

// Fill selects
const rolesSel = $("#roles");
C.roles.forEach(r=>{ const o=el("option"); o.textContent=r; rolesSel.appendChild(o); });
const barrioSel = $("#barrio");
C.barrios.forEach(b=>{ const o=el("option"); o.textContent=b; barrioSel.appendChild(o); });
const subTpl = $("#subTpl");
C.subtitulos.forEach(s=>{ const o=el("option"); o.textContent=s; subTpl.appendChild(o); });
const snipSel = $("#snippets");
C.snippets.forEach((s,i)=>{ const o=el("option"); o.value=i; o.textContent=`Snippet: ${s.name}`; snipSel.appendChild(o); });

// Insert snippet
$("#insertSnippet").onclick = ()=>{
  const idx = snipSel.value;
  if(idx==="") return;
  const txt = C.snippets[+idx].text;
  const t = $("#cuerpo");
  t.value = (t.value ? t.value+"\n" : "") + txt;
  t.dispatchEvent(new Event("input"));
};

// State
const state = JSON.parse(localStorage.getItem("hr_pro_state")||"{}");
state.personas = state.personas || [];
state.secuestros = state.secuestros || [];
state.checks = state.checks || {};
state.snapshots = state.snapshots || [];

// Checklist base
const CHECKS = [
  "UFI/Intervención informada","Juzgado de Garantías","Preventor/móvil consignado",
  "Policía Científica comisionada","Secuestros cargados","Testigos identificados",
  "Traslado/Atención médica","Derechos notificados","Georreferencia cargada"
];

// Render checklist
const checksWrap = $("#checklist");
CHECKS.forEach(k=>{
  const id = "chk_"+k.replace(/\W/g,"_");
  const lab = el("label");
  const inp = el("input"); inp.type="checkbox"; inp.id=id; inp.checked=!!state.checks[id];
  inp.onchange = ()=>{ state.checks[id]=inp.checked; save(); };
  const span = el("span"); span.textContent = k;
  lab.appendChild(inp); lab.appendChild(span);
  checksWrap.appendChild(lab);
});

// Personas
function personaToHTML(p){
  const base = `${p.nombre||""} ${p.apellido||""}${p.edad?` (${p.edad})`:""}${p.nacionalidad?` – ${p.nacionalidad}`:""}${p.domicilio?` – ${p.domicilio}`:""}${p.ciudad?`, ${p.ciudad}`:""}${p.fallecido==="si"?" – FALLECIDO":""}`.trim();
  return `<strong><em>${base}</em></strong>`;
}
function renderPersonas(){
  const wrap = $("#personas"); wrap.innerHTML="";
  const listByRole = {};
  state.personas.forEach(p=>{ const k=p.rol.toLowerCase(); listByRole[k]=(listByRole[k]||[]).concat([p]); });
  state.personas.forEach((p,idx)=>{
    const item = el("div","item");
    item.innerHTML = `
      <div class="line">
        <select data-k="rol">${C.roles.map(r=>`<option ${p.rol===r?'selected':''}>${r}</option>`).join("")}</select>
        <input data-k="nombre" placeholder="Nombre" value="${p.nombre||''}"/>
        <input data-k="apellido" placeholder="Apellido" value="${p.apellido||''}"/>
        <input data-k="edad" placeholder="Edad" value="${p.edad||''}"/>
        <input data-k="nacionalidad" placeholder="Nacionalidad" value="${p.nacionalidad||''}"/>
        <select data-k="fallecido">
          <option value="no" ${p.fallecido!=="si"?'selected':''}>Fallecido: No</option>
          <option value="si" ${p.fallecido==="si"?'selected':''}>Fallecido: Sí</option>
        </select>
      </div>
      <div class="line" style="margin-top:8px">
        <input data-k="domicilio" placeholder="Domicilio" value="${p.domicilio||''}"/>
        <input data-k="ciudad" placeholder="Ciudad" value="${p.ciudad||''}"/>
        <input data-k="dni" placeholder="Documento (opcional)" value="${p.dni||''}"/>
        <div class="small">Índice del rol: <strong class="idx">${(listByRole[p.rol.toLowerCase()]||[]).indexOf(p)}</strong></div>
        <div></div>
        <button class="btn outline" data-del>Eliminar</button>
      </div>
      <div class="small">Usar en texto: #${p.rol.toLowerCase()}:${(listByRole[p.rol.toLowerCase()]||[]).indexOf(p)}</div>
    `;
    item.querySelectorAll("input,select").forEach(inp=>{
      inp.oninput = (e)=>{ p[e.target.getAttribute("data-k")] = e.target.value; save(); };
    });
    item.querySelector("[data-del]").onclick=()=>{ state.personas.splice(idx,1); save(); renderPersonas(); };
    wrap.appendChild(item);
  });
}
$("#agregarPersona").onclick=()=>{
  state.personas.push({rol: rolesSel.value || C.roles[0], fallecido:"no"}); save(); renderPersonas();
};

// Secuestros
function renderSecuestros(){
  const wrap = $("#secuestros"); wrap.innerHTML="";
  state.secuestros.forEach((s,idx)=>{
    const item = el("div","item");
    item.innerHTML = `
      <div class="line">
        <select data-k="tipo">
          ${["sustraccion","secuestro","recupero"].map(x=>`<option value="${x}" ${s.tipo===x?'selected':''}>${x.toUpperCase()}</option>`).join("")}
        </select>
        <input data-k="detalle" placeholder="Detalle/Descripción" value="${s.detalle||''}"/>
        <input data-k="marca" placeholder="Marca/Modelo" value="${s.marca||''}"/>
        <input data-k="serie" placeholder="Serie/IMEI/Patente" value="${s.serie||''}"/>
        <input data-k="cant" placeholder="Cant." value="${s.cant||''}"/>
        <button class="btn outline" data-del>Eliminar</button>
      </div>
      <div class="line" style="margin-top:8px">
        <select data-k="mon">
          ${["ARS","USD",""].map(x=>`<option value="${x}" ${s.mon===x?'selected':''}>${x||'Sin valor'}</option>`).join("")}
        </select>
        <input data-k="valor" placeholder="Valor unitario" value="${s.valor||''}"/>
        <div class="small">Índice: ${idx} (#${s.tipo}:${idx})</div><div></div><div></div>
      </div>
    `;
    item.querySelectorAll("input,select").forEach(inp=>{
      inp.oninput=(e)=>{ s[e.target.getAttribute("data-k")] = e.target.value; save(); updateTotals(); };
    });
    item.querySelector("[data-del]").onclick=()=>{ state.secuestros.splice(idx,1); save(); renderSecuestros(); updateTotals(); };
    wrap.appendChild(item);
  });
}
$("#agregarSecuestro").onclick=()=>{ state.secuestros.push({tipo:"sustraccion"}); save(); renderSecuestros(); };

function updateTotals(){
  let ars = 0, usd = 0;
  state.secuestros.forEach(s=>{
    const cant = parseFloat(s.cant||"1")||1;
    const val = parseFloat((s.valor||"0").toString().replace(/\./g,"").replace(",",'.'))||0;
    if(s.mon==="ARS") ars += cant*val;
    if(s.mon==="USD") usd += cant*val;
  });
  $("#totARS").textContent = ars ? "$"+ars.toLocaleString('es-AR') : "$0";
  $("#totUSD").textContent = usd ? "USD "+usd.toLocaleString('es-AR') : "USD 0";
}
updateTotals();

// Subtítulo plantilla click
subTpl.onchange = ()=>{ if(subTpl.value) $("#subtitulo").value = subTpl.options[subTpl.selectedIndex].text; save(); };

// Roles selector default
rolesSel.value = C.roles[0];

// Autoguardado
function save(){
  localStorage.setItem("hr_pro_state", JSON.stringify(state));
}

// Basic fields save on input
["fecha","pu","comisaria","caratula","titulo","subtitulo","estado","ufi","juzgado","preventor","lat","lng","barrio"].forEach(id=>{
  const n = $("#"+id); if(!n) return;
  n.value = state[id]||n.value||"";
  n.oninput = ()=>{ state[id]=n.value; save(); };
});
document.querySelector("#confidencial").checked = !!state.confidencial;
document.querySelector("#confidencial").onchange = (e)=>{ state.confidencial = e.target.checked; save(); };

// Restore persons and seizures
renderPersonas();
renderSecuestros();

// Snapshots (versionado)
function refreshSnapshots(){
  const sel = $("#snapshots"); sel.innerHTML="";
  const opt = el("option"); opt.value=""; opt.textContent="Versiones…"; sel.appendChild(opt);
  (state.snapshots||[]).forEach((s,i)=>{
    const o=el("option"); o.value=i; o.textContent = s.name; sel.appendChild(o);
  });
}
refreshSnapshots();
$("#guardarSnap").onclick = ()=>{
  const name = prompt("Nombre de versión:", new Date().toLocaleString());
  if(!name) return;
  const copy = JSON.parse(JSON.stringify(state));
  state.snapshots = state.snapshots || [];
  state.snapshots.push({name, data: copy});
  save(); refreshSnapshots(); alert("Versión guardada.");
};
$("#restaurarSnap").onclick = ()=>{
  const i = $("#snapshots").value;
  if(i==="") return;
  const snap = state.snapshots[+i]; if(!snap) return;
  const data = snap.data;
  Object.keys(data).forEach(k=> state[k]=data[k]);
  save(); location.reload();
};

// Placeholder replacement
function personaByRoleIndex(role, idx){
  const arr = state.personas.filter(p=>p.rol.toLowerCase()===role);
  return arr[idx];
}
function personaHTML(role, idx){
  const p = personaByRoleIndex(role, idx);
  if(!p) return null;
  // Confidencial: ocultar domicilio y dni
  const tmp = {...p};
  if(state.confidencial){
    tmp.domicilio = tmp.dni = "";
  }
  return personaToHTML(tmp);
}
function itemDisplay(s){
  // Compose description
  const parts = [];
  if(s.cant) parts.push(`${s.cant}x`);
  if(s.detalle) parts.push(s.detalle);
  if(s.marca) parts.push(s.marca);
  if(s.serie) parts.push(`#${s.serie}`);
  let desc = parts.join(" ");
  if(s.mon && s.valor){
    const n = parseFloat((s.valor||"0").toString().replace(/\./g,"").replace(",",'.'))||0;
    const str = s.mon==="ARS" ? `$${n.toLocaleString('es-AR')}` : `USD ${n.toLocaleString('es-AR')}`;
    desc += ` (${str}${s.cant?` c/u`:``})`;
  }
  return `<em><u>${desc}</u></em>`;
}
function replacePlaceholders(text){
  const missing = new Set();
  const roles = C.roles.map(r=>r.toLowerCase());
  roles.forEach(role=>{
    text = text.replace(new RegExp(`#${role}:(\\d+)`,"gi"), (m,idx)=>{
      const html = personaHTML(role, parseInt(idx,10));
      if(!html){ missing.add(m); return m; }
      return html;
    });
  });
  ["secuestro","sustraccion","recupero"].forEach(tipo=>{
    text = text.replace(new RegExp(`#${tipo}:(\\d+)`,"gi"), (m,idx)=>{
      const arr = state.secuestros.filter(s=>s.tipo===tipo);
      const i = parseInt(idx,10);
      if(!arr[i]){ missing.add(m); return m; }
      return itemDisplay(arr[i]);
    });
    text = text.replace(new RegExp(`#${tipo}:todos`,"gi"), (m)=>{
      const arr = state.secuestros.filter(s=>s.tipo===tipo);
      if(!arr.length){ missing.add(m); return m; }
      return arr.map(itemDisplay).join(", ");
    });
  });
  const warn = $("#placeholdersWarn");
  if(missing.size){
    $("#warnList").textContent = Array.from(missing).join(", ");
    warn.hidden = false;
  } else warn.hidden = true;
  return text;
}
function htmlToWA(html){
  return html
    .replace(/<strong>(.*?)<\/strong>/g, (m,p1)=>`*${p1}*`)
    .replace(/<em>(.*?)<\/em>/g, (m,p1)=>`_${p1}_`)
    .replace(/<u>(.*?)<\/u>/g, (m,p1)=>`_${p1}_`)
    .replace(/<[^>]+>/g,"");
}

// Generate
function generar(){
  const titulo = $("#titulo").value.trim();
  const subtitulo = $("#subtitulo").value.trim();
  const estado = $("#estado").value;
  const cuerpo = replacePlaceholders($("#cuerpo").value.trim());

  const subtBadge = `<span class="badge ${estado==='si'?'blue':'red'}">${subtitulo} — ${estado==='si'?'Esclarecido':'No esclarecido'}</span>`;
  const encabezado = `<strong>${titulo}</strong> ${subtBadge}`;

  // Link Maps
  let loc = "";
  const lat = $("#lat").value.trim(), lng = $("#lng").value.trim();
  const barrio = $("#barrio").value;
  if(lat && lng){
    const url = `https://maps.google.com/?q=${encodeURIComponent(lat+","+lng)}`;
    loc = `\\nUbicación: ${lat}, ${lng} (${barrio||"—"}) — ${url}`;
  }

  $("#preview").innerHTML = encabezado + "\\n\\n" + cuerpo + loc;

  // WA short (encabezado solo + líneas clave)
  const short = `*${titulo}*\\n_${subtitulo} — ${estado==='si'?'Esclarecido':'No esclarecido'}_`;
  $("#previewWaShort").textContent = short;

  // WA long (todo el cuerpo convertido)
  const long = short + "\\n\\n" + htmlToWA(cuerpo) + (loc?"\\n\\n"+loc:"");
  $("#previewWaLong").textContent = long;

  return {titulo, subtitulo, estado, cuerpoHtml: cuerpo, short, long};
}
$("#generar").onclick = generar;

// Copy buttons
$("#copiarWACorto").onclick = ()=>{ const d=generar(); navigator.clipboard.writeText(d.short).then(()=>alert("Copiado (corta)")); };
$("#copiarWALargo").onclick = ()=>{ const d=generar(); navigator.clipboard.writeText(d.long).then(()=>alert("Copiado (larga)")); };

// Hotkeys
document.addEventListener("keydown", (e)=>{
  if(e.ctrlKey && e.key==="Enter"){ e.preventDefault(); generar(); }
  if(e.ctrlKey && e.key.toLowerCase()==="s"){ e.preventDefault(); $("#guardarSnap").click(); }
  if(e.ctrlKey && e.shiftKey && e.key.toLowerCase()==="c"){ e.preventDefault(); $("#copiarWACorto").click(); }
});

// DOCX generation
$("#descargarWord").onclick = async ()=>{
  const d = generar();
  const fecha = $("#fecha").value.trim();
  const pu = $("#pu").value.trim();
  const comisaria = $("#comisaria").value.trim();
  const caratula = $("#caratula").value.trim();
  const ufi = $("#ufi").value.trim();
  const juz = $("#juzgado").value.trim();
  const prev = $("#preventor").value.trim();
  const lat = $("#lat").value.trim(), lng = $("#lng").value.trim(), barrio = $("#barrio").value;

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
    return new docx.Paragraph({children:runs, spacing:{after:120}});
  }

  const bodyParas = d.cuerpoHtml.split(/\n\n+/).map(p=>htmlFragToDocx(p));

  const doc = new docx.Document({
    styles:{ paragraphStyles:[
      {id:"H",name:"Heading",basedOn:"Normal",run:{bold:true,size:28},paragraph:{spacing:{after:200}}},
      {id:"S",name:"Sub",basedOn:"Normal",run:{bold:false,size:24,color: d.estado==='si'?'2e86ff':'ff4d4d'},paragraph:{spacing:{after:200}}},
      {id:"Meta",name:"Meta",basedOn:"Normal",run:{italic:true,color:"6b7cff"}}
    ]}
  });

  const children = [
    new docx.Paragraph({text:d.titulo, style:"H"}),
    new docx.Paragraph({text:`${d.subtitulo} — ${d.estado==='si'?'Esclarecido':'No esclarecido'}`, style:"S"}),
    new docx.Paragraph({text:`Fecha/Hora: ${fecha}`, style:"Meta"}),
    new docx.Paragraph({text:`PU/IPP: ${pu}`, style:"Meta"}),
    new docx.Paragraph({text:`Dependencia: ${comisaria}`, style:"Meta"}),
    new docx.Paragraph({text:`Carátula: ${caratula}`, style:"Meta"}),
  ];
  if(ufi) children.push(new docx.Paragraph({text:`UFI/Intervención: ${ufi}`, style:"Meta"}));
  if(juz) children.push(new docx.Paragraph({text:`Juzgado: ${juz}`, style:"Meta"}));
  if(prev) children.push(new docx.Paragraph({text:`Preventor/Móvil: ${prev}`, style:"Meta"}));
  if(lat && lng) children.push(new docx.Paragraph({text:`Ubicación: ${lat}, ${lng} (${barrio||'—'})`, style:"Meta"}));
  children.push(new docx.Paragraph({text:""}));
  bodyParas.forEach(p=>children.push(p));

  doc.addSection(new docx.Section({children}));
  const blob = await docx.Packer.toBlob(doc);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Hecho_Relevante_${(pu||'sinPU').replace(/\s+/g,'_')}.docx`;
  a.click();
};

// Seed example for test
if(!state.personas.length){
  state.personas.push({rol:"Victima", nombre:"Edgardo Marcelo", apellido:"Lemos", edad:"62", nacionalidad:"argentino", domicilio:"Agapantus 1237", ciudad:"Mar del Plata", fallecido:"no"});
}
if(!state.secuestros.length){
  state.secuestros.push({tipo:"sustraccion", detalle:"celular IPHONE 13, color blanco", marca:"Apple iPhone 13", serie:"IMEI xxxxx", cant:"1", mon:"ARS", valor:"0"});
  state.secuestros.push({tipo:"sustraccion", detalle:"dinero en efectivo", cant:"1", mon:"ARS", valor:"2000000"});
  state.secuestros.push({tipo:"sustraccion", detalle:"dinero", cant:"1", mon:"USD", valor:"20000"});
}
save();
