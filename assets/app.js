(function(){
  const safe = (fn)=>{ try{ fn(); }catch(e){ showErr(e); console.error(e); } };
  const $ = (q)=>document.querySelector(q);
  const el = (t,c)=>{const n=document.createElement(t); if(c) n.className=c; return n;};
  const showErr = (e)=>{
    const box = $("#errorBox");
    if(!box) return;
    box.textContent = "Error: " + (e && e.message ? e.message : e);
    box.hidden = false;
  };

  window.addEventListener("DOMContentLoaded", ()=>{
    safe(initApp);
  });

  function initApp(){
    const C = window.CATALOG || {roles:[], subtitulos:[], snippets:[]};

    // Selects
    const rolesSel = $("#roles");
    C.roles.forEach(r=>{ const o=el("option"); o.textContent=r; rolesSel.appendChild(o); });

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
    const state = loadState();
    function loadState(){
      try{
        const raw = localStorage.getItem("hr_pro_state");
        const obj = raw ? JSON.parse(raw) : {};
        obj.personas = obj.personas || [];
        obj.secuestros = obj.secuestros || [];
        obj.checks = obj.checks || {};
        obj.snapshots = obj.snapshots || [];
        return obj;
      }catch(e){ return {personas:[],secuestros:[],checks:{},snapshots:[]}; }
    }
    function save(){ localStorage.setItem("hr_pro_state", JSON.stringify(state)); }

    // Checklist
    const CHECKS = [
      "UFI/Intervención informada","Juzgado de Garantías","Preventor/móvil consignado",
      "Policía Científica comisionada","Secuestros cargados","Testigos identificados",
      "Traslado/Atención médica","Derechos notificados","Georreferencia cargada"
    ];
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

    // Bind basics (incluye barrio texto)
    ["fecha","pu","comisaria","caratula","titulo","subtitulo","estado","ufi","juzgado","preventor","lat","lng","barrio"].forEach(id=>{
      const n = $("#"+id); if(!n) return;
      n.value = state[id]||n.value||"";
      n.oninput = ()=>{ state[id]=n.value; save(); };
    });
    $("#confidencial").checked = !!state.confidencial;
    $("#confidencial").onchange = (e)=>{ state.confidencial = e.target.checked; save(); };
    subTpl.onchange = ()=>{ if(subTpl.value) { $("#subtitulo").value = subTpl.options[subTpl.selectedIndex].text; state["subtitulo"] = $("#subtitulo").value; save(); } };

    // Personas — AHORA EN HTML SOLO **NEGRITA** (para que en WA salga entre * *)
    function personaToHTML(p){
      const base = `${p.nombre||""} ${p.apellido||""}`.trim()
        + `${p.edad?` (${p.edad})`:""}`
        + `${p.domicilio?` – ${p.domicilio}`:""}`
        + `${p.ciudad?`, ${p.ciudad}`:""}`;
      // Solo <strong> (nada de <em>)
      return `<strong>${base}</strong>`;
    }
    function renderPersonas(){
      const wrap = $("#personas"); wrap.innerHTML="";
      const listByRole = {};
      state.personas.forEach(p=>{ const k=p.rol?.toLowerCase()||""; listByRole[k]=(listByRole[k]||[]).concat([p]); });
      state.personas.forEach((p,idx)=>{
        const item = el("div","item");
        const roleIndex = (listByRole[p.rol?.toLowerCase()]||[]).indexOf(p);
        item.innerHTML = `
          <div class="line">
            <select data-k="rol">${C.roles.map(r=>`<option ${p.rol===r?'selected':''}>${r}</option>`).join("")}</select>
            <input data-k="nombre" placeholder="Nombre" value="${p.nombre||''}"/>
            <input data-k="apellido" placeholder="Apellido" value="${p.apellido||''}"/>
            <input data-k="edad" placeholder="Edad" value="${p.edad||''}"/>
            <input data-k="nacionalidad" placeholder="Nacionalidad (no se usa en WA)" value="${p.nacionalidad||''}"/>
            <select data-k="fallecido">
              <option value="no" ${p.fallecido!=="si"?'selected':''}>Fallecido: No</option>
              <option value="si" ${p.fallecido==="si"?'selected':''}>Fallecido: Sí</option>
            </select>
          </div>
          <div class="line" style="margin-top:8px">
            <input data-k="domicilio" placeholder="Domicilio" value="${p.domicilio||''}"/>
            <input data-k="ciudad" placeholder="Ciudad" value="${p.ciudad||''}"/>
            <input data-k="dni" placeholder="Documento (opcional)" value="${p.dni||''}"/>
            <div class="small">Índice del rol: <strong class="idx">${roleIndex}</strong></div>
            <div></div>
            <button class="btn outline" data-del>Eliminar</button>
          </div>
          <div class="small">Usar en texto: #${(p.rol||'').toLowerCase()}:${roleIndex}</div>
        `;
        item.querySelectorAll("input,select").forEach(inp=>{
          inp.oninput = (e)=>{ p[e.target.getAttribute("data-k")] = e.target.value; save(); };
        });
        item.querySelector("[data-del]").onclick=()=>{ state.personas.splice(idx,1); save(); renderPersonas(); };
        wrap.appendChild(item);
      });
    }
    function addPersona(obj){
      state.personas.push({
        rol: obj.rol || (rolesSel.value || C.roles[0] || "Victima"),
        nombre: obj.nombre||"", apellido: obj.apellido||"", edad: obj.edad||"",
        nacionalidad: obj.nacionalidad||"", fallecido: obj.fallecido||"no",
        domicilio: obj.domicilio||"", ciudad: obj.ciudad||"", dni: obj.dni||""
      });
      save(); renderPersonas();
    }
    $("#agregarPersona").onclick = ()=> addPersona({});

    // Modal Persona
    const dlgP = $("#dlgPersona");
    $("#abrirDlgPersona").onclick = ()=> {
      const fRol = $("#fRol"); fRol.innerHTML=""; C.roles.forEach(r=>{ const o=el("option"); o.textContent=r; fRol.appendChild(o); });
      dlgP.showModal();
    };
    $("#fAddPersona").onclick = (e)=>{
      e.preventDefault();
      addPersona({
        rol: $("#fRol").value, nombre: $("#fNom").value, apellido: $("#fApe").value,
        edad: $("#fEdad").value, nacionalidad: $("#fNac").value, fallecido: $("#fFal").value,
        domicilio: $("#fDom").value, ciudad: $("#fCiu").value, dni: $("#fDni").value
      });
      dlgP.close();
    };

    // Secuestros — AHORA SOLO <em> (para que en WA salga _cursiva_)
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
            <div class="small">Índice: ${idx} (#${s.tipo||'sustraccion'}:${idx})</div><div></div><div></div>
          </div>
        `;
        item.querySelectorAll("input,select").forEach(inp=>{
          inp.oninput=(e)=>{ s[e.target.getAttribute("data-k")] = e.target.value; save(); updateTotals(); };
        });
        item.querySelector("[data-del]").onclick=()=>{ state.secuestros.splice(idx,1); save(); renderSecuestros(); updateTotals(); };
        wrap.appendChild(item);
      });
    }
    function addObjeto(o){
      state.secuestros.push({
        tipo:o.tipo||"sustraccion", detalle:o.detalle||"", marca:o.marca||"",
        serie:o.serie||"", cant:o.cant||"1", mon:o.mon||"", valor:o.valor||""
      });
      save(); renderSecuestros(); updateTotals();
    }
    $("#agregarSecuestro").onclick = ()=> addObjeto({});

    // Modal Objeto
    const dlgO = $("#dlgObjeto");
    $("#abrirDlgObjeto").onclick = ()=> dlgO.showModal();
    $("#fAddObjeto").onclick = (e)=>{
      e.preventDefault();
      addObjeto({
        tipo: $("#oTipo").value, detalle: $("#oDet").value, marca: $("#oMarca").value,
        serie: $("#oSerie").value, cant: $("#oCant").value, mon: $("#oMon").value, valor: $("#oVal").value
      });
      dlgO.close();
    };

    function updateTotals(){
      let ars=0, usd=0;
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

    // Versionado
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

    // Placeholders
    function personaByRoleIndex(role, idx){
      const arr = state.personas.filter(p=>(p.rol||"").toLowerCase()===role);
      return arr[idx];
    }
    function personaHTML(role, idx){
      const p = personaByRoleIndex(role, idx);
      if(!p) return null;
      const tmp = {...p};
      if(state.confidencial){ tmp.domicilio = tmp.dni = ""; }
      return personaToHTML(tmp);
    }
    function itemDisplay(s){
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
      // Solo cursiva (sin subrayado)
      return `<em>${desc}</em>`;
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
        text = text.replace(new RegExp(`#${tipo}:todos`,"gi"), ()=>{
          const arr = state.secuestros.filter(s=>s.tipo===tipo);
          if(!arr.length){ missing.add(`#${tipo}:todos`); return ""; }
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

    // Conversión a WhatsApp
    function htmlToWA(html){
      return html
        .replace(/<strong>(.*?)<\/strong>/g, (m,p1)=>`*${p1}*`) // negrita
        .replace(/<em>(.*?)<\/em>/g, (m,p1)=>`_${p1}_`)        // cursiva
        .replace(/<u>(.*?)<\/u>/g, (m,p1)=>`_${p1}_`)          // (si quedara algún subrayado, también cursiva)
        .replace(/<[^>]+>/g,"");
    }

    // Generar + copiar + hotkeys
    function generar(){
      const titulo = $("#titulo").value.trim();
      const subtitulo = $("#subtitulo").value.trim();
      const estado = $("#estado").value; // solo para color del DOCX
      const cuerpo = replacePlaceholders($("#cuerpo").value.trim());

      const subtBadge = `<span class="badge ${estado==='si'?'blue':'red'}">${subtitulo}</span>`;
      const encabezado = `<strong>${titulo}</strong> ${subtBadge}`;

      // Ubicación
      let loc = "";
      const lat = $("#lat").value.trim(), lng = $("#lng").value.trim();
      const barrio = $("#barrio").value.trim();
      if(lat && lng){
        const url = `https://maps.google.com/?q=${encodeURIComponent(lat+","+lng)}`;
        loc = `\nUbicación: ${lat}, ${lng} (${barrio||"—"}) — ${url}`;
      } else if (barrio){
        loc = `\nUbicación: ${barrio}`;
      }

      $("#preview").innerHTML = encabezado + "\n\n" + cuerpo + loc;

      // WhatsApp — SIN “Esclarecido/No esclarecido”
      const short = `*${titulo}*\n*${subtitulo}*`;
      $("#previewWaShort").textContent = short;
      const long = short + "\n\n" + htmlToWA(cuerpo) + (loc?"\n\n"+loc:"");
      $("#previewWaLong").textContent = long;

      return {titulo, subtitulo, estado, cuerpoHtml: cuerpo, short, long};
    }
    $("#generar").onclick = ()=> safe(generar);
    $("#copiarWACorto").onclick = ()=> safe(()=>{ const d=generar(); navigator.clipboard.writeText(d.short).then(()=>alert("Copiado (corta)")); });
    $("#copiarWALargo").onclick = ()=> safe(()=>{ const d=generar(); navigator.clipboard.writeText(d.long).then(()=>alert("Copiado (larga)")); });

    document.addEventListener("keydown", (e)=>{
      if(e.ctrlKey && e.key==="Enter"){ e.preventDefault(); safe(generar); }
      if(e.ctrlKey && e.key.toLowerCase()==="s"){ e.preventDefault(); $("#guardarSnap").click(); }
      if(e.ctrlKey && e.shiftKey && e.key.toLowerCase()==="c"){ e.preventDefault(); $("#copiarWACorto").click(); }
    });

    // DOCX — FIX: usar addSection({children}) en vez de new Section(...)
    $("#descargarWord").onclick = async ()=>{
      safe(async ()=>{
        const d = generar();
        const docxLib = window.docx;
        const fecha = $("#fecha").value.trim();
        const pu = $("#pu").value.trim();
        const comisaria = $("#comisaria").value.trim();
        const caratula = $("#caratula").value.trim();
        const ufi = $("#ufi").value.trim();
        const juz = $("#juzgado").value.trim();
        const prev = $("#preventor").value.trim();
        const lat = $("#lat").value.trim(), lng = $("#lng").value.trim(), barrio = $("#barrio").value.trim();

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
            if(part){ runs.push(new docxLib.TextRun({text:part, bold:b, italics:i, underline: u?{}:undefined})); }
          }
          return new docxLib.Paragraph({children:runs, spacing:{after:120}});
        }

        const bodyParas = d.cuerpoHtml.split(/\n\n+/).map(p=>htmlFragToDocx(p));
        const doc = new docxLib.Document({
          styles:{ paragraphStyles:[
            {id:"H",name:"Heading",basedOn:"Normal",run:{bold:true,size:28},paragraph:{spacing:{after:200}}},
            {id:"S",name:"Sub",basedOn:"Normal",run:{bold:false,size:24,color: d.estado==='si'?'2e86ff':'ff4d4d'},paragraph:{spacing:{after:200}}},
            {id:"Meta",name:"Meta",basedOn:"Normal",run:{italic:true,color:"6b7cff"}}
          ]}
        });

        const children = [
          new docxLib.Paragraph({text:d.titulo, style:"H"}),
          new docxLib.Paragraph({text:`${d.subtitulo}`, style:"S"}), // sin “Esclarecido/No esclarecido”
          new docxLib.Paragraph({text:`Fecha/Hora: ${fecha}`, style:"Meta"}),
          new docxLib.Paragraph({text:`PU/IPP: ${pu}`, style:"Meta"}),
          new docxLib.Paragraph({text:`Dependencia: ${comisaria}`, style:"Meta"}),
          new docxLib.Paragraph({text:`Carátula: ${caratula}`, style:"Meta"}),
        ];
        if(ufi) children.push(new docxLib.Paragraph({text:`UFI/Intervención: ${ufi}`, style:"Meta"}));
        if(juz) children.push(new docxLib.Paragraph({text:`Juzgado: ${juz}`, style:"Meta"}));
        if(prev) children.push(new docxLib.Paragraph({text:`Preventor/Móvil: ${prev}`, style:"Meta"}));
        if(lat && lng) children.push(new docxLib.Paragraph({text:`Ubicación: ${lat}, ${lng} (${barrio||'—'})`, style:"Meta"}));
        else if (barrio) children.push(new docxLib.Paragraph({text:`Ubicación: ${barrio}`, style:"Meta"}));
        children.push(new docxLib.Paragraph({text:""}));
        bodyParas.forEach(p=>children.push(p));

        // ✅ FIX aquí:
        doc.addSection({children});
        const blob = await docxLib.Packer.toBlob(doc);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Hecho_Relevante_${(pu||'sinPU').replace(/\s+/g,'_')}.docx`;
        a.click();
      });
    };

    // Seed mínimo (podés borrar)
    if(!state.personas.length){ state.personas.push({rol:"Victima", nombre:"Edgardo Marcelo", apellido:"Lemos", edad:"62", domicilio:"Agapantus 1237", ciudad:"Mar del Plata", fallecido:"no"}); }
    renderPersonas();
    if(!state.secuestros.length){ state.secuestros.push({tipo:"sustraccion", detalle:"celular IPHONE 13, color blanco", marca:"Apple iPhone 13", serie:"IMEI xxxxx", cant:"1", mon:"", valor:""}); }
    renderSecuestros();
  }
})();

