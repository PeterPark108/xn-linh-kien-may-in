/* Thành phần giao diện dùng chung: bảng, modal, toast, biểu đồ */
const $=(s,el=document)=>el.querySelector(s),$$=(s,el=document)=>[...el.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n||0).toLocaleString('vi-VN'),money=n=>fmt(Math.round(n))+' ₫';
const fdate=s=>s?s.split('-').reverse().join('/'):'';
const BADGE={'Đang chạy':'gr','Hoàn thành':'gr','Đạt':'gr','Đã giao':'gr','Chốt':'gr','Đã thu':'gr','Đúng hạn':'gr','Đang làm':'bl','Đang SX':'bl','Đã gửi':'bl','Đang giao':'bl','VIP':'pu','Chờ QC':'ye','Tạm dừng':'ye','Chờ vật tư':'ye','Bảo trì':'ye','Kế hoạch':'ye','Thu một phần':'ye','Chờ xuất':'ye','Nghỉ phép':'ye','Khẩn':'rd','Lỗi':'rd','Trễ':'rd','Trễ hạn':'rd','Không đạt':'rd','Hủy':'rd','Chưa thu':'rd','Sự cố':'rd','Cao':'or','Mới':'or','Nhập':'gr','Xuất':'or','Chuyển':'bl','Kiểm kho':'pu','Thấp':'','Dừng':''};
const badge=v=>v?`<span class="badge b-${BADGE[v]||''}">${esc(v)}</span>`:'';
const prog=p=>`<div style="display:flex;gap:6px;align-items:center"><div class="prog"><i style="width:${p}%;background:${p>=100?'var(--gr)':p<30?'var(--or)':'var(--bl)'}"></i></div><small>${p}%</small></div>`;
function toast(msg,err){const ts=$$('#toasts .toast');if(ts.length>=3)ts[0].remove();const t=document.createElement('div');t.className='toast'+(err?' err':'');t.textContent=msg;$('#toasts').appendChild(t);setTimeout(()=>t.remove(),2800)}
function kpiRow(items){return`<div class="grid kpis" style="margin-bottom:14px">${items.map(k=>`<div class="card kpi" style="--c:var(--${k.c||'or'})"><div class="l">${k.l}</div><div class="v">${k.v}</div>${k.s?`<div class="s muted">${k.s}</div>`:''}</div>`).join('')}</div>`}
function emptyState(text,btn){return`<div class="card" style="text-align:center;padding:40px"><div style="font-size:36px">📭</div><p>${text}</p>${btn?`<button class="btn" data-empty-act>${btn}</button>`:''}</div>`}

/* Kiểm tra 1 trường; trả {v,msg} */
function checkField(x,raw,obj){let v=String(raw??'').trim(),msg='';
  if(x.req&&v==='')msg='Bắt buộc nhập';else if(x.type==='number'&&v!==''){v=Number(v);if(isNaN(v))msg='Phải là số';else if(x.min!=null&&v<x.min)msg='Tối thiểu '+x.min}
  if(!msg&&x.validate)msg=x.validate(v,obj)||'';return{v,msg}}
function fieldInput(x,v){const opts=typeof x.options==='function'?x.options():x.options;
  return x.type==='select'?`<select name="${x.k}"><option value="">-- Chọn --</option>${opts.map(o=>{const [val,lab]=Array.isArray(o)?o:[o,o];return`<option value="${esc(val)}" ${String(val)===String(v)?'selected':''}>${esc(lab)}</option>`}).join('')}</select>`
  :x.type==='textarea'?`<textarea name="${x.k}" rows="3">${esc(v)}</textarea>`:`<input name="${x.k}" type="${x.type||'text'}" value="${esc(v)}" ${x.type==='number'?'step="any"':''}>`}
/* Modal form có validate. fields:[{k,label,type,options,req,min,full,validate}] */
function openForm(title,fields,obj,onSave){
  $('#mTitle').textContent=title;const f=$('#mForm');clearForm();
  f.innerHTML=fields.map(x=>`<label class="${x.full?'full':''}" data-f="${x.k}">${esc(x.label)}${x.req?' *':''}${fieldInput(x,obj[x.k]??'')}<span class="em"></span></label>`).join('')+`<div class="f-act"><button type="button" class="btn ghost" data-close>Hủy</button><button class="btn">Lưu</button></div>`;
  f.onsubmit=e=>{e.preventDefault();let ok=true;const out={...obj};
    fields.forEach(x=>{const lb=$(`[data-f="${x.k}"]`,f),r=checkField(x,f.elements[x.k].value,out);
      lb.classList.toggle('err',!!r.msg);$('.em',lb).textContent=r.msg;if(r.msg)ok=false;else out[x.k]=r.v});
    if(!ok){toast('Vui lòng kiểm tra lại các trường bị lỗi',1);return}
    if(onSave(out)!==false)closeModal()};
  showModal();setTimeout(()=>f.elements[0]&&f.elements[0].focus(),50)}
function showModal(wide){$('#modal .modal-box').style.width=wide?'900px':'';$('#modal').classList.add('show')}
function closeModal(){$('#modal').classList.remove('show');clearForm()}
function clearForm(){const f=$('#mForm');f.oninput=f.onchange=f.onclick=null}
/* Modal xác nhận (thay confirm) */
function confirmBox(msg,ok,danger=true){const c=$('#cModal');$('#cMsg').innerHTML=msg;c.classList.add('show');const yes=$('#cYes');yes.className='btn '+(danger?'danger':'');
  const done=r=>{c.classList.remove('show');yes.onclick=no.onclick=null;if(r)ok()};const no=$('#cNo');yes.onclick=()=>done(1);no.onclick=()=>done(0);setTimeout(()=>yes.focus(),30)}
/* Vai trò demo */
const ROLES={'Quản lý':'*','Kế hoạch':['don-hang','san-xuat','bom','khach-hang','giao-hang'],'Kho':['kho','giao-hang','bom'],'QC':['qc','san-xuat'],'Thợ':['san-xuat:move']};
const HIDDEN={'Thợ':['tai-chinh','khach-hang','bao-cao'],'Kho':['tai-chinh'],'QC':['tai-chinh']};
const role=()=>localStorage.getItem('xnlk_role')||'Quản lý';
function can(mod,act='edit'){const r=ROLES[role()];return r==='*'||r.includes(mod)||(act==='move'&&r.includes(mod+':move'))}
const canSee=mod=>!(HIDDEN[role()]||[]).includes(mod);
/* CSV */
function parseCSV(t){t=t.replace(/^\ufeff/,'');const rows=[];let row=[],f='',q=false;for(let i=0;i<t.length;i++){const c=t[i];
  if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++}else q=false}else f+=c}else if(c==='"')q=true;else if(c===','||c===';'){row.push(f);f=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&t[i+1]==='\n')i++;row.push(f);rows.push(row);row=[];f=''}else f+=c}
  if(f||row.length){row.push(f);rows.push(row)}return rows.filter(r=>r.some(x=>x.trim()))}

/* Bảng dữ liệu: KPI, chip đếm, tìm, lọc, khoảng ngày, sắp xếp, phân trang, chọn hàng loạt, CRUD,
   tùy chỉnh cột, bộ lọc đã lưu, sửa tại ô, nhập/xuất CSV, phân quyền */
function DataTable(el,cfg){
  const mod=window.CUR_MOD||'',edit_ok=can(mod)&&cfg.form!==false,KEY=s=>'xnlk_'+s+'_'+cfg.name;
  const st={q:'',chip:'',filter:'',from:'',to:'',sort:cfg.sort||null,dir:cfg.dir||1,page:1,size:10,sel:new Set()};
  let hidden=new Set(JSON.parse(localStorage.getItem(KEY('cols'))||'[]'));
  const saved=()=>JSON.parse(localStorage.getItem(KEY('flt'))||'[]');
  const rows=()=>cfg.rows(),cols=()=>cfg.cols.filter(c=>!hidden.has(c.k));
  const fieldOf=k=>Array.isArray(cfg.form)&&cfg.form.find(f=>f.k===k);
  const inlineOK=c=>edit_ok&&cfg.inline!==false&&c.k!==cfg.id&&!c.noEdit&&fieldOf(c.k);
  function filtered(){let r=rows();const q=st.q.toLowerCase();
    if(q)r=r.filter(o=>cfg.cols.some(c=>String(c.text?c.text(o):o[c.k]??'').toLowerCase().includes(q)));
    if(st.chip)r=r.filter(o=>o[cfg.statusKey]===st.chip);
    if(cfg.filter&&st.filter)r=r.filter(o=>o[cfg.filter.k]===st.filter);
    if(cfg.dateKey){if(st.from)r=r.filter(o=>o[cfg.dateKey]>=st.from);if(st.to)r=r.filter(o=>o[cfg.dateKey]<=st.to)}
    if(st.sort){const c=cfg.cols.find(c=>c.k===st.sort);r=[...r].sort((a,b)=>{const x=c&&c.sortv?c.sortv(a):a[st.sort],y=c&&c.sortv?c.sortv(b):b[st.sort];return(x>y?1:x<y?-1:0)*st.dir})}
    return r}
  const cellTxt=(c,o)=>c.text?c.text(o):o[c.k];
  function render(){const all=rows(),r=filtered(),pages=Math.max(1,Math.ceil(r.length/st.size));if(st.page>pages)st.page=pages;
    const pr=r.slice((st.page-1)*st.size,st.page*st.size),sopts=cfg.statusOptions||[...new Set(all.map(o=>o[cfg.statusKey]))];
    const fopts=cfg.filter?(cfg.filter.options||[...new Set(all.map(o=>o[cfg.filter.k]))]):[],sv=saved(),cs=cols();
    el.innerHTML=(cfg.kpis?kpiRow(cfg.kpis(all)):'')+
    (cfg.statusKey?`<div class="tabs chips">${['',...sopts].map(s=>`<button data-chip="${esc(s)}" class="${st.chip===s?'on':''}">${s||'Tất cả'} <span class="badge">${s?all.filter(o=>o[cfg.statusKey]===s).length:all.length}</span></button>`).join('')}</div>`:'')+
    `<div class="toolbar"><input data-q placeholder="Tìm trong ${esc(cfg.name)}..." value="${esc(st.q)}">
     ${cfg.filter?`<select data-filter><option value="">${esc(cfg.filter.label)}: tất cả</option>${fopts.map(o=>`<option ${o===st.filter?'selected':''}>${esc(o)}</option>`).join('')}</select>`:''}
     ${cfg.dateKey?`<input type="date" data-from value="${st.from}" title="Từ ngày"><input type="date" data-to value="${st.to}" title="Đến ngày">`:''}
     ${st.sel.size&&edit_ok?`<button class="btn danger" data-bulk>Xóa ${st.sel.size} dòng đã chọn</button>`:''}
     ${cfg.extraTools?cfg.extraTools(st):''}${edit_ok?`<button class="btn" data-add>＋ Thêm mới</button>`:''}</div>
     <div class="toolbar sub"><select data-saved title="Bộ lọc đã lưu"><option value="">★ Bộ lọc đã lưu (${sv.length})</option>${sv.map((f,i)=>`<option value="${i}">${esc(f.name)}</option>`).join('')}</select>
     <button class="btn ghost sm" data-savef>💾 Lưu bộ lọc</button>${sv.length?`<button class="btn ghost sm" data-delf>🗑 Xóa bộ lọc…</button>`:''}
     <button class="btn ghost sm" data-colcfg>☷ Tùy chỉnh cột${hidden.size?' ('+hidden.size+' ẩn)':''}</button>
     <button class="btn ghost sm" data-csv>⬇ Xuất CSV</button>${edit_ok&&cfg.import!==false?`<label class="btn ghost sm" style="cursor:pointer">⬆ Nhập CSV<input type="file" accept=".csv,text/csv" data-imp hidden></label>`:''}
     ${!edit_ok&&cfg.form!==false?`<span class="badge b-ye">🔒 Chỉ xem (vai trò ${esc(role())})</span>`:edit_ok&&cfg.inline!==false?'<span class="muted" style="font-size:12px;align-self:center">Mẹo: nhấp đúp vào ô để sửa nhanh</span>':''}</div>`+
    (r.length?`<div class="tbl-wrap"><table><thead><tr><th style="width:30px"><input type="checkbox" data-all ${pr.length&&pr.every(o=>st.sel.has(o[cfg.id]))?'checked':''}></th>${cs.map(c=>`<th data-sort="${c.k}" class="${st.sort===c.k?(st.dir>0?'asc':'desc'):''}">${esc(c.label)}</th>`).join('')}<th></th></tr></thead><tbody>
    ${pr.map(o=>`<tr data-id="${esc(o[cfg.id])}"><td><input type="checkbox" data-sel="${esc(o[cfg.id])}" ${st.sel.has(o[cfg.id])?'checked':''}></td>${cs.map(c=>`<td ${inlineOK(c)?`data-ie="${c.k}" class="ie"`:''}>${c.html?c.html(o):c.badge?badge(o[c.k]):esc(cellTxt(c,o))}</td>`).join('')}
    <td class="act">${cfg.rowActions?cfg.rowActions(o):''}${edit_ok?`<button class="btn ghost sm" data-edit="${esc(o[cfg.id])}">Sửa</button><button class="btn ghost sm" data-del="${esc(o[cfg.id])}">Xóa</button>`:''}</td></tr>`).join('')}</tbody></table></div>
    <div class="pager">Hiển thị ${(st.page-1)*st.size+1}–${Math.min(st.page*st.size,r.length)} / ${r.length}
    <select data-size>${[10,20,50].map(n=>`<option ${n===st.size?'selected':''}>${n}</option>`).join('')}</select>
    <button class="btn ghost sm" data-pg="-1" ${st.page<=1?'disabled':''}>‹</button> ${st.page}/${pages} <button class="btn ghost sm" data-pg="1" ${st.page>=pages?'disabled':''}>›</button></div>`
    :emptyState(all.length?'Không có dòng nào khớp bộ lọc. Hãy xóa từ khóa hoặc chọn "Tất cả".':`Chưa có dữ liệu ${cfg.name}. Bắt đầu bằng cách thêm bản ghi đầu tiên hoặc nhập CSV.`,all.length?'Xóa bộ lọc':(edit_ok?'＋ Thêm mới':'')));
    bind()}
  const persist=v=>{cfg.onChange&&cfg.onChange(v);DB.save()};
  function edit(o){const isNew=!o;o=o||(cfg.newItem?cfg.newItem():{});
    if(cfg.customEdit)return cfg.customEdit(o,isNew,v=>{const arr=cfg.rows();if(isNew)arr.unshift(v);else Object.assign(arr.find(x=>x[cfg.id]===o[cfg.id]),v);persist(v);toast((isNew?'Đã thêm ':'Đã cập nhật ')+v[cfg.id]);render()});
    openForm((isNew?'Thêm ':'Sửa ')+cfg.name,cfg.form,o,v=>{const arr=cfg.rows();
      if(isNew){if(arr.some(x=>x[cfg.id]===v[cfg.id])){toast('Mã đã tồn tại',1);return false}arr.unshift(v)}else Object.assign(arr.find(x=>x[cfg.id]===o[cfg.id]),v);
      persist(v);toast(isNew?'Đã thêm '+v[cfg.id]:'Đã cập nhật '+v[cfg.id]);render()})}
  function remove(ids){const arr=cfg.rows();ids.forEach(id=>{const i=arr.findIndex(x=>x[cfg.id]===id);if(i>=0)arr.splice(i,1)});st.sel.clear();DB.save();toast('Đã xóa '+ids.length+' dòng');render()}
  function inlineEdit(td){if(td.querySelector('input,select'))return;const k=td.dataset.ie,id=td.parentNode.dataset.id,o=rows().find(x=>String(x[cfg.id])===id),f=fieldOf(k);
    td.innerHTML=fieldInput(f,o[k]??'');const inp=td.firstChild;inp.classList.add('ie-input');inp.focus();inp.select&&inp.select();let done=false;
    const save=()=>{if(done)return;const r=checkField(f,inp.value,o);if(r.msg){toast(f.label+': '+r.msg,1);inp.focus();return}done=true;if(r.v!==o[k]){o[k]=r.v;persist(o);toast('Đã lưu '+f.label+' – '+id)}render()};
    inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();save()}else if(e.key==='Escape'){e.stopPropagation();done=true;render()}};
    inp.onblur=()=>{if(!done){done=true;render()}};if(inp.tagName==='SELECT')inp.onchange=save}
  function colCfg(){clearForm();$('#mTitle').textContent='Tùy chỉnh cột – '+cfg.name;$('#mForm').innerHTML=cfg.cols.map(c=>`<label style="flex-direction:row;gap:8px;align-items:center;font-size:14px;color:var(--tx)"><input type="checkbox" name="${c.k}" ${hidden.has(c.k)?'':'checked'} ${c.k===cfg.id?'disabled':''}> ${esc(c.label)}</label>`).join('')+`<div class="f-act"><button type="button" class="btn ghost" data-colreset>Hiện tất cả</button><button class="btn">Áp dụng</button></div>`;
    $('#mForm').onsubmit=e=>{e.preventDefault();hidden=new Set(cfg.cols.filter(c=>c.k!==cfg.id&&!$('#mForm').elements[c.k].checked).map(c=>c.k));localStorage.setItem(KEY('cols'),JSON.stringify([...hidden]));closeModal();toast('Đã lưu tùy chỉnh cột');render()};
    $('[data-colreset]').onclick=()=>$$('#mForm input').forEach(i=>i.checked=true);showModal()}
  const strip=h=>String(h).replace(/<[^>]+>/g,'').trim();
  function exportCSV(){const cs=cols();downloadCSV(cfg.name.replace(/\s+/g,'-')+'-'+isoDate(new Date())+'.csv',[cs.map(c=>c.label),...filtered().map(o=>cs.map(c=>c.text||c.badge||!c.html?cellTxt(c,o):(typeof o[c.k]==='number'||typeof o[c.k]==='string'?o[c.k]:strip(c.html(o)))))])}
  const selVal=(f,v)=>{const opts=(typeof f.options==='function'?f.options():f.options).map(o=>Array.isArray(o)?o:[o,o]);const m=opts.find(([a,b])=>String(a)===v||b===v||String(b).endsWith(' – '+v)||String(b).startsWith(v+' – '));return m?m[0]:v};
  function importCSV(file){const rd=new FileReader();rd.onload=()=>{const t=parseCSV(rd.result);if(t.length<2)return toast('File CSV trống',1);
    const head=t[0].map(h=>h.trim()),map=head.map(h=>{const c=cfg.cols.find(c=>c.label===h||c.k===h);return c?c.k:(cfg.form||[]).some(f=>f.k===h||f.label===h)?(cfg.form.find(f=>f.k===h||f.label===h).k):null});
    if(!map.includes(cfg.id))return toast('CSV thiếu cột mã ('+cfg.cols.find(c=>c.k===cfg.id).label+')',1);
    let add=0,upd=0,bad=0;const arr=rows();t.slice(1).forEach(r=>{const o={};map.forEach((k,i)=>{if(k&&r[i]!=null){const f=fieldOf(k);let raw=r[i].trim();if(f&&f.type==='number')raw=raw.replace(/[^0-9,.\-]/g,'').replace(/\.(?=\d{3}(\D|$))/g,'').replace(',','.');if(f&&f.type==='date'){const m=raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);if(m)raw=m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0')}o[k]=f&&f.type==='select'?selVal(f,raw):raw}});
      if(!o[cfg.id]){bad++;return}let okRow=true;Object.keys(o).forEach(k=>{const f=fieldOf(k);if(f){const c=checkField({...f,req:f.req},o[k],o);if(c.msg)okRow=false;else o[k]=c.v}});if(!okRow){bad++;return}const ex=arr.find(x=>String(x[cfg.id])===String(o[cfg.id]));
      if(ex){Object.assign(ex,o);persist(ex);upd++}else{const n={...(cfg.newItem?cfg.newItem():{}),...o};const miss=(cfg.form||[]).filter(f=>f.req&&(n[f.k]==null||n[f.k]===''));if(miss.length){bad++;return}arr.unshift(n);persist(n);add++}});
    DB.save();toast(`Nhập CSV: thêm ${add}, cập nhật ${upd}${bad?', bỏ qua '+bad+' dòng lỗi':''}`,!!bad&&!add&&!upd);render()};rd.readAsText(file,'utf-8')}
  function bind(){const q=$('[data-q]',el);q&&(q.oninput=()=>{st.q=q.value;st.page=1;render();const n=$('[data-q]',el);n.focus();n.setSelectionRange(n.value.length,n.value.length)});
    el.ondblclick=e=>{const td=e.target.closest('td[data-ie]');if(td)inlineEdit(td)};
    el.onclick=e=>{const t=e.target.closest('[data-chip],[data-sort],[data-add],[data-edit],[data-del],[data-pg],[data-bulk],[data-empty-act],[data-savef],[data-delf],[data-colcfg],[data-csv]');if(!t)return;
      if(t.dataset.chip!=null){st.chip=t.dataset.chip;st.page=1;render()}
      else if(t.dataset.sort){st.dir=st.sort===t.dataset.sort?-st.dir:1;st.sort=t.dataset.sort;render()}
      else if(t.hasAttribute('data-add'))edit();
      else if(t.dataset.edit)edit(rows().find(x=>String(x[cfg.id])===t.dataset.edit));
      else if(t.dataset.del)confirmBox('Xóa <b>'+esc(t.dataset.del)+'</b>? Thao tác không hoàn tác được.',()=>remove([t.dataset.del]));
      else if(t.dataset.pg){st.page+=+t.dataset.pg;render()}
      else if(t.hasAttribute('data-bulk'))confirmBox('Xóa <b>'+st.sel.size+'</b> dòng đã chọn?',()=>remove([...st.sel]));
      else if(t.hasAttribute('data-savef'))openForm('Lưu bộ lọc hiện tại',[{k:'name',label:'Tên bộ lọc',req:1,validate:v=>saved().some(f=>f.name===v)?'Tên đã tồn tại':''}],{},v=>{const s=saved();s.push({name:v.name,st:{q:st.q,chip:st.chip,filter:st.filter,from:st.from,to:st.to,sort:st.sort,dir:st.dir}});localStorage.setItem(KEY('flt'),JSON.stringify(s));toast('Đã lưu bộ lọc "'+v.name+'"');render()});
      else if(t.hasAttribute('data-delf'))openForm('Xóa bộ lọc đã lưu',[{k:'i',label:'Chọn bộ lọc',type:'select',req:1,options:saved().map((f,i)=>[i,f.name])}],{},v=>{const s=saved();const n=s.splice(v.i,1)[0];localStorage.setItem(KEY('flt'),JSON.stringify(s));toast('Đã xóa bộ lọc "'+n.name+'"');render()});
      else if(t.hasAttribute('data-colcfg'))colCfg();
      else if(t.hasAttribute('data-csv'))exportCSV();
      else if(t.hasAttribute('data-empty-act')){if(rows().length){Object.assign(st,{q:'',chip:'',filter:'',from:'',to:''});render()}else edit()}};
    el.onchange=e=>{const t=e.target;
      if(t.matches('[data-saved]')){const f=saved()[t.value];if(f){Object.assign(st,f.st,{page:1});toast('Áp dụng bộ lọc "'+f.name+'"');render()}return}
      if(t.matches('[data-imp]')){t.files[0]&&importCSV(t.files[0]);return}
      if(t.closest('td[data-ie]'))return;
      if(t.matches('[data-filter]'))st.filter=t.value;else if(t.matches('[data-from]'))st.from=t.value;else if(t.matches('[data-to]'))st.to=t.value;else if(t.matches('[data-size]'))st.size=+t.value;
      else if(t.matches('[data-sel]')){t.checked?st.sel.add(t.dataset.sel):st.sel.delete(t.dataset.sel)}
      else if(t.matches('[data-all]')){const ids=filtered().slice((st.page-1)*st.size,st.page*st.size).map(o=>o[cfg.id]);ids.forEach(i=>t.checked?st.sel.add(i):st.sel.delete(i))}else return;
      st.page=t.matches('[data-sel],[data-all]')?st.page:1;render()};
    cfg.onRender&&cfg.onRender(el)}
  render();return{render,edit}}

/* Mã vạch Code 128-B dạng SVG */
const C128=['212222','222122','222221','121223','121322','131222','122213','122312','132212','221213','221312','231212','112232','122132','122231','113222','123122','123221','223211','221132','221231','213212','223112','312131','311222','321122','321221','312212','322112','322211','212123','212321','232121','111323','131123','131321','112313','132113','132311','211313','231113','231311','112133','112331','132131','113123','113321','133121','313121','211331','231131','213113','213311','213131','311123','311321','331121','312113','312311','332111','314111','221411','431111','111224','111422','121124','121421','141122','141221','112214','112412','122114','122411','142112','142211','241211','221114','413111','241112','134111','111242','121142','121241','114212','124112','124211','411212','421112','421211','212141','214121','412121','111143','111341','131141','114113','114311','411113','411311','113141','114131','311141','411131','211412','211214','211232','2331112'];
function barcode(txt,{h=50,w=1.6}={}){const codes=[104];let sum=104;[...txt].forEach((ch,i)=>{const v=ch.charCodeAt(0)-32;codes.push(v);sum+=v*(i+1)});codes.push(sum%103,106);
  let x=10,bars='';codes.forEach(c=>{[...C128[c]].forEach((n,i)=>{const bw=n*w;if(i%2===0)bars+=`<rect x="${x}" y="0" width="${bw}" height="${h}"/>`;x+=bw})});
  return`<svg class="barcode" viewBox="0 0 ${x+10} ${h+16}" width="${(x+10)}" height="${h+16}"><rect width="100%" height="100%" fill="#fff"/><g fill="#000">${bars}</g><text x="${(x+10)/2}" y="${h+13}" text-anchor="middle" style="fill:#000;font:12px monospace">${esc(txt)}</text></svg>`}
/* Xem trước & in */
function printPreview(title,html){clearForm();$('#mTitle').textContent=title;$('#mForm').innerHTML=`<div class="full print-sheet" id="printSheet">${html}</div><div class="f-act"><button type="button" class="btn ghost" data-close>Đóng</button><button type="button" class="btn" id="doPrint">🖨 In</button></div>`;
  $('#mForm').onsubmit=e=>e.preventDefault();$('#doPrint').onclick=()=>{document.body.classList.add('printing');window.print();setTimeout(()=>document.body.classList.remove('printing'),500)};showModal(true)}

/* Biểu đồ SVG tự vẽ */
const Chart={
  bars(data,{h=200,color='var(--or)',line=null}={}){const w=Math.max(360,data.length*22),max=Math.max(...data.map(d=>d.v),...(line||[]).map(Number),1)*1.1,bw=(w-40)/data.length;
    const y=v=>h-24-(v/max)*(h-34);
    let s=`<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none">`;
    for(let i=0;i<=4;i++){const v=max*i/4;s+=`<line x1="34" x2="${w}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="0" y="${y(v)+3}">${v>=1000?Math.round(v/1000)+'k':Math.round(v)}</text>`}
    data.forEach((d,i)=>{const x=38+i*bw;s+=`<rect x="${x}" y="${y(d.v)}" width="${bw*.7}" height="${h-24-y(d.v)}" rx="2" fill="${color}"><title>${d.l}: ${fmt(d.v)}</title></rect>`;if(i%Math.ceil(data.length/10)===0)s+=`<text x="${x}" y="${h-8}">${d.l}</text>`});
    if(line)s+=`<polyline fill="none" stroke="var(--bl)" stroke-width="2" points="${line.map((v,i)=>`${38+i*bw+bw*.35},${y(v)}`).join(' ')}"/>`;
    return s+'</svg>'},
  donut(data,{size=170}={}){const tot=data.reduce((s,d)=>s+d.v,0)||1,R=size/2-12,C=2*Math.PI*R;let off=0;
    const cols=['var(--or)','var(--bl)','var(--rd)','var(--ye)','var(--pu)','var(--gr)'];
    let s=`<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><g transform="rotate(-90 ${size/2} ${size/2})">`;
    data.forEach((d,i)=>{const len=d.v/tot*C;s+=`<circle cx="${size/2}" cy="${size/2}" r="${R}" fill="none" stroke="${cols[i%6]}" stroke-width="20" stroke-dasharray="${len} ${C-len}" stroke-dashoffset="${-off}"><title>${d.l}: ${d.v}</title></circle>`;off+=len});
    s+=`</g><text x="50%" y="50%" text-anchor="middle" dy="4" style="font-size:18px;fill:var(--tx);font-weight:700">${fmt(tot)}</text></svg><div class="legend" style="flex-direction:column">${data.map((d,i)=>`<span><i style="background:${cols[i%6]}"></i>${esc(d.l)}: <b>${fmt(d.v)}</b> (${Math.round(d.v/tot*100)}%)</span>`).join('')}</div></div>`;return s},
  hbars(data,unit=''){const max=Math.max(...data.map(d=>d.v),1);return data.map(d=>`<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>${esc(d.l)}</span><b>${fmt(d.v)}${unit}</b></div><div class="prog" style="height:9px"><i style="width:${d.v/max*100}%;background:${d.c||'var(--bl)'}"></i></div></div>`).join('')}
};
function downloadCSV(name,rows){const csv='\ufeff'+rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\r\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=name;document.body.appendChild(a);a.click();a.remove();toast('Đã xuất '+name)}
