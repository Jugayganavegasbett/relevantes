// assets/app.js
(function(){
  const $ = (q)=>document.querySelector(q);
  const el = (t,c)=>{const n=document.createElement(t); if(c) n.className=c; return n;};
  const showErr = (msg)=>{ const b=$("#errorBox"); if(b){ b.textContent="Error: "+msg; b.hidden=false; } };
  const hideErr = ()=>{ const b=$("#errorBox"); if(b) b.hidden=true; };

  const TitleCase = (s)=> (s||"").toLowerCase().split(/(\s|-)/).map(p=>{
    if(p.trim()===""||p==='-') return p; return p.charAt(0).toUpperCase()+p.slice(1);
  }).join("");

  window.addEventListener("DOMContentLoaded", ()=>{ try{init();hideErr();}catch(e){console.error(e);showErr(e.message);} });

  function init(){
    const C = window.CATALOG || {};
    const ROLES = Array.isArray(C.roles) && C.roles.length ? C.roles :
      ["Victima","Imputado","Denunciante","Testigo","PP"];

    const state = loadState();
    function loadState(){ try{ return Object.assign({personas:[]}, JSON.parse(localStorage.getItem("hr_simple")||"{}")); } catch{ return {personas:[]}; } }
    function save(){ localStorage.setItem("hr_simple", JSON.stringify(state)); }

    ["fecha","pu","comisaria","caratula","titulo","subtitulo","estado","ufi","juzgado","preventor","barrio","cuerpo","secuestroTexto"].forEach(id=>{
      const n=$("#"+id); if(!n) return;
      n.value = state[id] ?? ""; n.oninput = ()=>{ state[id]=n.value; save(); };
    });

    const rolesSel=$("#roles");
    if(rolesSel){ rolesSel.innerHTML=""; ROLES.forEach(r=>{ const o=el("option"); o.textContent=r; rolesSel.appendChild(o); }); }

    if($("#agregarPersona")) $("#agregarPersona").onclick = ()=>{ state.personas.push({rol:rolesSel?rolesSel.value:ROLES[0]}); save(); renderPersonas(); };
    renderPersonas();

    function renderPersonas(){
      const wrap=$("#personas"); if(!wrap) return; wrap.innerHTML="";
      const byRole={}; state.personas.forEach(p=>{ const k=(p.rol||"").toLowerCase(); (byRole[k]=byRole[k]||[]).push(p); });
      state.personas.forEach((p,idx)=>{
        const roleIdx = (byRole[(p.rol||"").toLowerCase()]||[]).indexOf(p);
        const item=el("div","item");
        item.innerHTML=`
          <div class="line">
            <select data-k="rol">${ROLES.map(r=>`<option ${p.rol===r?'selected':''}>${r}</option>`).join("")}</select>
            <input data-k="nombre" placeholder="Nombre" value="${p.nombre||''}"/>
            <input data-k="apellido" placeholder="Apellido" value="${p.apellido||''}"/>
            <input data-k="edad" placeholder="Edad" value="${p.edad||''}"/>
            <input data-k="domicilio" placeholder="Domicilio" value="${p.domicilio||''}"/>
            <input data-k="ciudad" placeholder="Ciudad" value="${p.ciudad||''}"/>
          </div>
          <div class="small">Usar en texto: #${(p.rol||'').toLowerCase()}:${roleIdx}</div>
          <div class="row" style="justify-content:flex-end"><button class="btn outline" data-del>Eliminar</button></div>`;
        item.querySelectorAll("input,select").forEach(inp=>{
          inp.oninput=(e)=>{ p[e.target.getAttribute("data-k")]=e.target.value; save(); };
        });
        item.querySelector("[data-del]").onclick=()=>{ state.personas.splice(idx,1); save(); renderPersonas(); };
        wrap.appendChild(item);
      });
    }

    function personaHTML(role, idx){
      const arr=state.personas.filter(p=>(p.rol||"").toLowerCase()===role);
      const p=arr[idx]; if(!p) return null;
      const base=`${TitleCase(p.nombre||"")} ${TitleCase(p.apellido||"")}${p.edad?` (${p.edad})`:""}${p.domicilio?` – ${TitleCase(p.domicilio)}`:""}${p.ciudad?`, ${TitleCase(p.ciudad)}`:""}`;
      return `<strong>${base.trim()}</strong>`;
    }
    const formatSecuestroHtml=(txt)=> (txt||"").trim()? `<em><u>${(txt||"").trim()}</u></em>`:"";

    function replacePlaceholders(text){
      const rolesLower=ROLES.map(r=>r.toLowerCase());
      rolesLower.forEach(role=>{
        text=text.replace(new RegExp(`#${role}:(\\d+)`,"gi"),(m,idx)=>{
          const html=personaHTML(role,parseInt(idx,10)); return html||m;
        });
      });
      const secHtml=formatSecuestroHtml(($("#secuestroTexto")?.value)||"");
      if(text.includes("#secuestro")) text=text.replace(/#secuestro/gi, secHtml);
      return text;
    }

    function htmlToWA(html){
      let s=html||"";
      s=s.replace(/<em><u>(.*?)<\/u><\/em>/gis,'_$1_');
      s=s.replace(/<u><em>(.*?)<\/em><\/u>/gis,'_$1_');
      s=s.replace(/<strong>(.*?)<\/strong>/gis,'*$1*');
      s=s.replace(/<em>(.*?)<\/em>/gis,'_$1_');
      s=s.replace(/<u>(.*?)<\/u>/gis,'$1');
      s=s.replace(/<[^>]+>/g,'');
      s=s.replace(/\r/g,'');
      s=s.replace(/\n{3,}/g,'\n\n');
      s=s.replace(/([^\n])\n([^\n])/g,'$1 $2');
      return s.trim();
    }

    function generar(){
      const fechaFull=($("#fecha")?.value||"").trim();
      const fechaSolo=fechaFull.split("–")[0].trim()||fechaFull;
      const pu=($("#pu")?.value||"").trim();
      const comisaria=($("#comisaria")?.value||"").trim();
      const caratula=($("#caratula")?.value||"").trim();
      const subtitulo=($("#subtitulo")?.value||"").trim();
      const estado=($("#estado")?.value||"no");
      const cuerpoHtml=replacePlaceholders(($("#cuerpo")?.value||"").trim());

      const linea1HTML=`<strong>${[fechaSolo,pu,comisaria.toUpperCase(),caratula.toUpperCase()].filter(Boolean).join(" – ")}</strong>`;
      const colorClase=(estado==='si')?'blue':'red';
      const linea2HTML=`<span class="badge ${colorClase}"><strong>${subtitulo}</strong></span>`;
      if($("#preview")) $("#preview").innerHTML=`${linea1HTML}\n${linea2HTML}\n\n${cuerpoHtml}`;

      const headerWA1=`*${[fechaSolo,pu,comisaria,caratula].filter(Boolean).join(" – ")}*`;
      const headerWA2=`*${subtitulo}*`;
      const cuerpoWA=htmlToWA(cuerpoHtml);

      const waShort=`${headerWA1}\n${headerWA2}`;
      const waLong =`${waShort}\n\n${cuerpoWA}`;
      if($("#previewWaShort")) $("#previewWaShort").textContent=waShort;
      if($("#previewWaLong"))  $("#previewWaLong").textContent=waLong;

      return {waShort,waLong,cuerpoHtml,subtitulo,estado,pu};
    }

    if($("#generar")) $("#generar").onclick=generar;
    if($("#copiarWACorto")) $("#copiarWACorto").onclick=()=>{ const d=generar(); navigator.clipboard.writeText(d.waShort).then(()=>alert("Copiado (corta)")); };
    if($("#copiarWALargo")) $("#copiarWALargo").onclick=()=>{ const d=generar(); navigator.clipboard.writeText(d.waLong).then(()=>alert("Copiado (larga)")); };

    if($("#descargarWord")) $("#descargarWord").onclick=async()=>{
      try{
        const d=generar(); const docx=window.docx; if(!docx||!docx.Document) throw new Error("docx no cargada");
        const JUST=docx.AlignmentType.JUSTIFIED;
        const toRuns=(html)=>{ const parts=(html||"").split(/(<\/?strong>|<\/?em>|<\/?u>)/g);
          let B=false,I=false,U=false; const runs=[];
          for(const part of parts){
            if(part==="<strong>"){B=true;continue;}
            if(part==="</strong>"){B=false;continue;}
            if(part==="<em>"){I=true;continue;}
            if(part==="</em>"){I=false;continue;}
            if(part==="<u>"){U=true;continue;}
            if(part==="</u>"){U=false;continue;}
            if(part) runs.push(new docx.TextRun({text:part,bold:B,italics:I,underline:U?{}:undefined}));
          }
          return runs; };
        const bodyParas=(d.cuerpoHtml||"").split(/\n\n+/).map(p=>new docx.Paragraph({children:toRuns(p),alignment:JUST,spacing:{after:200}}));
        const linea1=[($("#fecha")?.value||"").split("–")[0].trim(), d.pu||"", ($("#comisaria")?.value||"").toUpperCase(), ($("#caratula")?.value||"").toUpperCase()].filter(Boolean).join(" – ");
        const colorSub=(d.estado==="si")?"2e86ff":"ff4d4d";
        const doc=new docx.Document({sections:[{children:[
          new docx.Paragraph({children:[new docx.TextRun({text:linea1,bold:true})]}),
          new docx.Paragraph({children:[new docx.TextRun({text:d.subtitulo,bold:true,color:colorSub})]}),
          new docx.Paragraph({text:""}),
          ...bodyParas
        ]}]});
        const blob=await docx.Packer.toBlob(doc);
        const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
        a.download=`Hecho_Relevante_${(d.pu||'sinPU').replace(/\s+/g,'_')}.docx`; a.click();
      }catch(e){console.error(e);showErr(e.message||e);}
    };

    if(!state.personas.length){
      state.personas.push({rol:ROLES[0],nombre:"edgardo marcelo",apellido:"lemos",edad:"62",domicilio:"agapantus 1237",ciudad:"mar del plata"});
      state.cuerpo="Fecha... entrevistan con #victima:0 ... sustrayendo #secuestro ...";
      state.secuestroTexto="Celular iPhone 13, $ 2.000.000 y U$D 20.000."; save(); renderPersonas();
      if($("#cuerpo")) $("#cuerpo").value=state.cuerpo;
      if($("#secuestroTexto")) $("#secuestroTexto").value=state.secuestroTexto;
    }
  }
})();
