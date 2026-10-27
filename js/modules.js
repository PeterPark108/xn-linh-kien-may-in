/* Định nghĩa các module & tab */
const D=()=>DB.data;
const cust=id=>(D().customers.find(c=>c.id===id)||{}).name||id;
const prod=code=>(D().products.find(p=>p.code===code)||{}).name||code;
const mach=id=>(D().machines.find(m=>m.id===id)||{}).name||id||'—';
const today=()=>isoDate(new Date());
const daysTo=s=>Math.round((new Date(s)-new Date(today()))/864e5);
const custOpts=()=>D().customers.map(c=>[c.id,c.id+' – '+c.name]),prodOpts=()=>D().products.map(p=>[p.code,p.code+' – '+p.name]);
const lowStock=()=>D().stock.filter(s=>s.stock<s.min);
const lateOrders=()=>D().orders.filter(o=>o.status==='Trễ hạn'||(!['Đã giao','Hoàn thành'].includes(o.status)&&daysTo(o.due)<0));
const defectRate=()=>{const q=D().qc,s=q.reduce((a,b)=>a+b.sample,0),f=q.reduce((a,b)=>a+b.fail,0);return s?(f/s*100):0};
const maintDue=()=>D().machines.filter(m=>m.status==='Lỗi'||m.status==='Bảo trì'||daysTo(m.nextMaint)<=3);
function dailyOutput(n=30){const d=D(),all=d.woArchive.concat(d.wos),by={},ng={};d.logs.forEach(l=>{by[l.date]=(by[l.date]||0)+l.qty;ng[l.date]=(ng[l.date]||0)+l.ng});const out=[];
  for(let i=n-1;i>=0;i--){const dt=new Date();dt.setDate(dt.getDate()-i);const k=isoDate(dt);
    const target=dt.getDay()===0?0:Math.round(all.filter(w=>w.start<=k&&w.end>=k).reduce((s,w)=>s+w.qty/Math.max(1,daysTo(w.end)-daysTo(w.start)+1),0));
    out.push({l:dt.getDate()+'/'+(dt.getMonth()+1),date:k,v:by[k]||0,ng:ng[k]||0,target})}return out}
function addLog(w,qty){if(qty>0){D().logs.push({date:today(),wo:w.id,product:w.product,cat:catOf(w.product),machine:w.machine,qty,ng:0})}}
const I=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICONS={dash:I('<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>'),
order:I('<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>'),
prod:I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 15.4H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>'),
bom:I('<path d="M12 2l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5M3 17l9 5 9-5"/>'),
stock:I('<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>'),
qc:I('<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'),
machine:I('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>'),
truck:I('<rect x="1" y="6" width="14" height="11"/><path d="M15 10h4l3 3v4h-7"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>'),
cust:I('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>'),
hr:I('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
fin:I('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>'),
report:I('<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>')};

const MODULES=[
{id:'tong-quan',title:'Tổng quan',group:'Điều hành',icon:'dash',tabs:[{id:'dieu-hanh',label:'Điều hành sản xuất',render:renderDashboard}]},
{id:'don-hang',title:'Đơn hàng gia công',group:'Sản xuất',icon:'order',tabs:[{id:'danh-sach',label:'Danh sách đơn',render:el=>DataTable(el,ordersCfg())}]},
{id:'san-xuat',title:'Lệnh sản xuất',group:'Sản xuất',icon:'prod',tabs:[{id:'kanban',label:'Kanban công đoạn',render:renderKanban},{id:'bang',label:'Danh sách lệnh SX',render:el=>DataTable(el,woCfg())},{id:'gantt',label:'Tiến độ (Gantt)',render:renderGantt}]},
{id:'bom',title:'Định mức vật tư (BOM)',group:'Sản xuất',icon:'bom',tabs:[{id:'dinh-muc',label:'Định mức vật tư',render:el=>DataTable(el,bomCfg())},{id:'tinh-nhu-cau',label:'Tính nhu cầu vật tư',render:renderMRP}]},
{id:'qc',title:'Kiểm tra chất lượng (QC)',group:'Sản xuất',icon:'qc',tabs:[{id:'phieu',label:'Phiếu kiểm',render:el=>DataTable(el,qcCfg())},{id:'theo-lo',label:'Tỉ lệ đạt theo lô',render:renderQCLot}]},
{id:'may-moc',title:'Máy móc & bảo trì',group:'Sản xuất',icon:'machine',tabs:[{id:'may',label:'Danh sách máy',render:el=>DataTable(el,machineCfg())},{id:'bao-tri',label:'Lịch bảo trì & sự cố',render:el=>DataTable(el,maintCfg())}]},
{id:'kho',title:'Kho vật tư & thành phẩm',group:'Kho & giao nhận',icon:'stock',tabs:[{id:'ton',label:'Tồn kho',render:renderStockGrid},{id:'nhap',label:'Nhập kho',render:el=>DataTable(el,txCfg('Nhập'))},{id:'xuat',label:'Xuất kho',render:el=>DataTable(el,txCfg('Xuất'))},{id:'chuyen',label:'Chuyển kho',render:el=>DataTable(el,txCfg('Chuyển'))},{id:'kiem-kho',label:'Kiểm kho',render:el=>DataTable(el,txCfg('Kiểm kho'))},{id:'the-kho',label:'Thẻ kho',render:renderStockCard}]},
{id:'giao-hang',title:'Giao hàng',group:'Kho & giao nhận',icon:'truck',tabs:[{id:'phieu-giao',label:'Phiếu giao hàng',render:el=>DataTable(el,delivCfg())}]},
{id:'khach-hang',title:'Khách hàng & báo giá',group:'Kinh doanh',icon:'cust',tabs:[{id:'khach',label:'Khách hàng',render:el=>DataTable(el,custCfg())},{id:'bao-gia',label:'Báo giá',render:el=>DataTable(el,quoteCfg())}]},
{id:'tai-chinh',title:'Công nợ',group:'Kinh doanh',icon:'fin',tabs:[{id:'cong-no',label:'Công nợ phải thu',render:el=>DataTable(el,debtCfg())}]},
{id:'nhan-su',title:'Nhân sự & ca làm',group:'Nhân sự & báo cáo',icon:'hr',tabs:[{id:'nhan-vien',label:'Nhân viên',render:el=>DataTable(el,empCfg())},{id:'phan-ca',label:'Phân ca tuần',render:renderRoster}]},
{id:'bao-cao',title:'Báo cáo',group:'Nhân sự & báo cáo',icon:'report',tabs:[{id:'san-luong',label:'Sản lượng',render:el=>renderReport(el,'sl')},{id:'chat-luong',label:'Chất lượng',render:el=>renderReport(el,'cl')},{id:'giao-hang',label:'Giao hàng đúng hạn',render:el=>renderReport(el,'gh')},{id:'ton-kho',label:'Tồn kho',render:el=>renderReport(el,'tk')}]}
];

/* ---------- Tổng quan + Slicer ---------- */
const SKEY='xnlk_slicer';
const SL_DEF={period:'30',from:'',to:'',cats:[],status:[],stages:[],customer:''};
const PERIODS=[['1','Hôm nay'],['7','7 ngày'],['30','30 ngày'],['90','90 ngày'],['custom','Tùy chọn']];
const SL_STATUS=['Đang chạy','Chờ','Trễ hạn','Hoàn thành'];
const getSL=()=>{try{return{...SL_DEF,...JSON.parse(localStorage.getItem(SKEY)||'{}')}}catch(e){return{...SL_DEF}}};
const setSL=v=>localStorage.setItem(SKEY,JSON.stringify(v));
const orderGroup=o=>(o.status==='Trễ hạn'||(!['Đã giao','Hoàn thành'].includes(o.status)&&daysTo(o.due)<0))?'Trễ hạn':o.status==='Đang SX'?'Đang chạy':['Mới','Chờ QC'].includes(o.status)?'Chờ':'Hoàn thành';
const woGroup=w=>w.status==='Trễ'?'Trễ hạn':w.status==='Đang chạy'?'Đang chạy':w.status==='Hoàn thành'?'Hoàn thành':'Chờ';
function slRange(f){if(f.period==='custom'&&(f.from||f.to))return[f.from||'0000-00-00',f.to||'9999-12-31'];const n=f.period==='custom'?30:+f.period,dt=new Date();dt.setDate(dt.getDate()-n+1);return[isoDate(dt),today()]}
function applySlicer(f){const d=D(),[from,to]=slRange(f),inR=x=>x>=from&&x<=to;
  const ord={};d.orders.forEach(o=>ord[o.id]=o);const allWo={};d.woArchive.concat(d.wos).forEach(w=>allWo[w.id]=w);
  const woCust=w=>w.customer||(ord[w.order]||{}).customer;
  const okCat=code=>!f.cats.length||f.cats.includes(catOf(code));
  const woOk=w=>okCat(w.product)&&(!f.status.length||f.status.includes(woGroup(w)))&&(!f.stages.length||f.stages.includes(w.stage))&&(!f.customer||woCust(w)===f.customer);
  const wos=d.wos.filter(woOk);
  const orders=d.orders.filter(o=>okCat(o.product)&&(!f.status.length||f.status.includes(orderGroup(o)))&&(!f.customer||o.customer===f.customer)&&(!f.stages.length||d.wos.some(w=>w.order===o.id&&f.stages.includes(w.stage))));
  const mtype={};d.machines.forEach(m=>mtype[m.id]=m.type);
  const logs=d.logs.filter(l=>{const w=allWo[l.wo]||{};return inR(l.date)&&(!f.cats.length||f.cats.includes(l.cat))&&(!f.status.length||f.status.includes(woGroup(w)))&&(!f.stages.length||f.stages.includes(mtype[l.machine]))&&(!f.customer||woCust(w)===f.customer)});
  const qc=d.qc.filter(q=>{const w=allWo[q.wo]||{};return inR(q.date)&&okCat(q.product)&&(!f.customer||woCust(w)===f.customer)&&(!f.status.length||f.status.includes(woGroup(w)))});
  const machines=d.machines.filter(m=>!f.stages.length||f.stages.includes(m.type));
  const prods=new Set(d.products.filter(p=>okCat(p.code)).map(p=>p.code)),mats=new Set(d.bom.filter(b=>prods.has(b.product)).map(b=>b.material));
  const stock=d.stock.filter(s=>!f.cats.length||(s.kind==='TP'?prods.has(s.code.slice(3)):mats.has(s.code)));
  return{from,to,wos,orders,logs,qc,machines,stock}}
function chipGroup(key,opts,f,multi=true){return`<div class="sl-group" role="group" aria-label="${key}">${opts.map(o=>{const[v,l]=Array.isArray(o)?o:[o,o];const on=multi?f[key].includes(v):f[key]===v;return`<button class="sl-chip ${on?'on':''}" aria-pressed="${on}" data-sl="${key}" data-v="${esc(v)}">${on&&multi?'✓ ':''}${esc(l)}</button>`}).join('')}</div>`}
function renderDashboard(el){const d=D();
 const draw=()=>{const f=getSL(),r=applySlicer(f),act=[];
  if(f.period!=='30')act.push(['period',PERIODS.find(p=>p[0]===f.period)[1]+(f.period==='custom'?` (${fdate(r.from)}–${fdate(r.to)})`:'')]);
  f.cats.forEach(c=>act.push(['cats',c]));f.status.forEach(c=>act.push(['status',c]));f.stages.forEach(c=>act.push(['stages',c]));if(f.customer)act.push(['customer',cust(f.customer)]);
  const byDate={},ngDate={};r.logs.forEach(l=>{byDate[l.date]=(byDate[l.date]||0)+l.qty;ngDate[l.date]=(ngDate[l.date]||0)+l.ng});
  const days=[];for(let x=new Date(r.from);isoDate(x)<=r.to&&days.length<400;x.setDate(x.getDate()+1)){const k=isoDate(x);days.push({l:x.getDate()+'/'+(x.getMonth()+1),v:byDate[k]||0})}
  const total=r.logs.reduce((s,l)=>s+l.qty,0),todayOut=r.logs.filter(l=>l.date===today()).reduce((s,l)=>s+l.qty,0);
  const smp=r.qc.reduce((s,q)=>s+q.sample,0),fl=r.qc.reduce((s,q)=>s+q.fail,0),rate=smp?fl/smp*100:0;
  const late=r.orders.filter(o=>orderGroup(o)==='Trễ hạn'),low=r.stock.filter(s=>s.stock<s.min),mdue=r.machines.filter(m=>m.status==='Lỗi'||m.status==='Bảo trì'||daysTo(m.nextMaint)<=3);
  const run=r.machines.filter(m=>m.status==='Đang chạy'),oee=run.length?Math.round(run.reduce((s,m)=>s+m.oee,0)/run.length):0;
  const causes={};r.qc.forEach(q=>{if(q.cause)causes[q.cause]=(causes[q.cause]||0)+q.fail});
  const soon=r.orders.filter(o=>!['Đã giao','Hoàn thành'].includes(o.status)).sort((a,b)=>a.due<b.due?-1:1).slice(0,7);
  const byCat=CATS.map(c=>({l:c,v:r.logs.filter(l=>l.cat===c).reduce((s,l)=>s+l.qty,0),c:'var(--or)'}));
  const empty=!r.orders.length&&!r.logs.length&&!r.wos.length;
  const custList=[...new Set(d.orders.map(o=>o.customer))];
  el.innerHTML=`<section class="card slicer" aria-label="Bộ lọc tổng quan">
   <div class="sl-row"><span class="sl-lb">Thời gian</span>${chipGroup('period',PERIODS,f,false)}${f.period==='custom'?`<span class="sl-dates"><input type="date" id="slFrom" value="${f.from}" aria-label="Từ ngày"> – <input type="date" id="slTo" value="${f.to}" aria-label="Đến ngày"></span>`:''}</div>
   <div class="sl-row"><span class="sl-lb">Loại linh kiện</span>${chipGroup('cats',CATS,f)}</div>
   <div class="sl-row"><span class="sl-lb">Trạng thái</span>${chipGroup('status',SL_STATUS,f)}</div>
   <div class="sl-row"><span class="sl-lb">Công đoạn</span>${chipGroup('stages',d.stages,f)}</div>
   <div class="sl-row"><span class="sl-lb">Khách hàng</span><select id="slCust" aria-label="Khách hàng"><option value="">Tất cả khách hàng</option>${custList.map(c=>`<option value="${c}" ${c===f.customer?'selected':''}>${esc(cust(c))}</option>`).join('')}</select></div>
   <div class="sl-foot"><div class="sl-active">${act.length?'<b>Đang lọc:</b> '+act.map(([k,v])=>`<span class="sl-tag">${esc(v)}<button data-rm="${k}" data-v="${esc(k==='customer'?f.customer:v)}" aria-label="Bỏ ${esc(v)}">✕</button></span>`).join(''):'<span class="muted">Chưa áp dụng bộ lọc (mặc định 30 ngày)</span>'}</div>
   <div class="sl-count"><b>${r.orders.length}</b> đơn · <b>${r.wos.length}</b> lệnh SX · <b>${fmt(total)}</b> SP sản xuất · <b>${r.qc.length}</b> phiếu QC</div>
   <button class="btn ghost sm" id="slClear" ${act.length?'':'disabled'}>✕ Xóa lọc</button></div>
   <small class="muted">Thời gian áp dụng cho sản lượng, QC; đơn hàng, lệnh SX, kho, máy hiển thị trạng thái hiện tại theo loại linh kiện / trạng thái / công đoạn / khách hàng.</small></section>`+
  (empty?emptyState('Không có dữ liệu khớp bộ lọc. Hãy bỏ bớt loại linh kiện / trạng thái, hoặc mở rộng khoảng thời gian.','✕ Xóa lọc'):
  kpiRow([{l:'Sản lượng hôm nay',v:fmt(todayOut),c:'or'},{l:'Sản lượng kỳ lọc',v:fmt(total),s:fdate(r.from)+' – '+fdate(r.to),c:'bl'},{l:'Lệnh SX đang chạy',v:r.wos.filter(w=>w.status==='Đang chạy').length,s:r.wos.length+' lệnh khớp lọc',c:'gr'},{l:'Đơn trễ hạn',v:late.length,c:'rd'},{l:'Tỉ lệ lỗi',v:rate.toFixed(2)+'%',s:fl+' lỗi / '+fmt(smp)+' mẫu',c:'ye'},{l:'OEE trung bình',v:oee+'%',s:run.length+'/'+r.machines.length+' máy đang chạy',c:'pu'},{l:'Tồn kho thấp',v:low.length,c:'or'}])+
  `<div class="grid g2"><div class="card"><h3>Sản lượng theo ngày (từ nhật ký lệnh SX)</h3>${days.length>1?Chart.bars(days):total?Chart.hbars(byCat.filter(x=>x.v),' cái'):'<p class="muted">Chưa có sản lượng trong kỳ.</p>'}</div>
   <div class="card"><h3>Lỗi theo nguyên nhân</h3>${Object.keys(causes).length?Chart.donut(Object.entries(causes).map(([l,v])=>({l,v}))):'<p class="muted">Không có lỗi trong kỳ/bộ lọc 👍</p>'}</div></div>
   <div class="grid g2e" style="margin-top:14px"><div class="card"><h3>Sản lượng theo loại linh kiện</h3>${Chart.hbars(byCat,' cái')}</div>
   <div class="card"><h3>Tải công đoạn (số lệnh SX)</h3>${Chart.hbars(d.stages.map(s=>({l:s,v:r.wos.filter(w=>w.stage===s).length})))}</div></div>
   <div class="grid g2e" style="margin-top:14px"><div class="card"><h3>Đơn sắp đến hạn / trễ (${soon.length})</h3>${soon.length?soon.map(o=>{const n=daysTo(o.due);return`<div class="list-item"><span><a href="#/don-hang">${o.id}</a> · ${esc(prod(o.product))} <span class="badge">${catOf(o.product)}</span><br><small class="muted">${esc(cust(o.customer))}</small></span><span style="text-align:right">${prog(o.progress)}<small class="${n<0?'bad':n<=3?'':'muted'}">${n<0?'Trễ '+(-n)+' ngày':'Còn '+n+' ngày'}</small></span></div>`}).join(''):'<p class="muted">Không có đơn đang mở khớp bộ lọc.</p>'}</div>
   <div class="card"><h3>Cảnh báo (${low.length+mdue.length})</h3>${low.slice(0,5).map(s=>`<div class="list-item"><span>📦 ${esc(s.name)}</span><span class="bad">${fmt(s.stock)}/${fmt(s.min)} ${s.unit}</span></div>`).join('')}
   ${mdue.slice(0,5).map(m=>`<div class="list-item"><span>🔧 ${esc(m.name)} (${m.id})</span><span>${badge(m.status)} <small class="muted">BT: ${fdate(m.nextMaint)}</small></span></div>`).join('')||''}${low.length+mdue.length?'':'<p class="muted">Không có cảnh báo.</p>'}</div></div>`)};
 el.onclick=e=>{const f=getSL(),c=e.target.closest('[data-sl]'),rm=e.target.closest('[data-rm]');
  if(c){const k=c.dataset.sl,v=c.dataset.v;if(k==='period')f.period=v;else f[k]=f[k].includes(v)?f[k].filter(x=>x!==v):[...f[k],v];setSL(f);draw()}
  else if(rm){const k=rm.dataset.rm;if(k==='period')f.period='30';else if(k==='customer')f.customer='';else f[k]=f[k].filter(x=>x!==rm.dataset.v);setSL(f);draw()}
  else if(e.target.closest('#slClear,[data-empty-act]')){setSL({...SL_DEF});toast('Đã xóa bộ lọc tổng quan');draw()}};
 el.onchange=e=>{const f=getSL();if(e.target.id==='slCust')f.customer=e.target.value;else if(e.target.id==='slFrom')f.from=e.target.value;else if(e.target.id==='slTo')f.to=e.target.value;else return;
  if(f.from&&f.to&&f.from>f.to)return toast('Ngày bắt đầu phải trước ngày kết thúc',1);setSL(f);draw()};
 draw()}

/* ---------- Đơn hàng ---------- */
function ordersCfg(){return{name:'đơn hàng',id:'id',rows:()=>D().orders,statusKey:'status',statusOptions:['Mới','Đang SX','Chờ QC','Hoàn thành','Đã giao','Trễ hạn'],filter:{k:'priority',label:'Ưu tiên',options:['Thấp','Trung bình','Cao','Khẩn']},dateKey:'due',sort:'due',
 kpis:a=>[{l:'Đơn đang chạy',v:a.filter(o=>['Mới','Đang SX','Chờ QC'].includes(o.status)).length,c:'bl'},{l:'Đơn trễ hạn',v:lateOrders().length,c:'rd'},{l:'Tổng số lượng',v:fmt(a.reduce((s,o)=>s+o.qty,0)),c:'or'},{l:'Giá trị đơn',v:money(a.reduce((s,o)=>s+o.qty*o.price,0)),c:'gr'}],
 cols:[{k:'id',label:'Mã đơn'},{k:'customer',label:'Khách hàng',text:o=>cust(o.customer)},{k:'product',label:'Sản phẩm',text:o=>o.product+' – '+prod(o.product)},{k:'drawing',label:'Mã bản vẽ'},{k:'mat',label:'Vật liệu'},{k:'qty',label:'SL',text:o=>fmt(o.qty)},{k:'due',label:'Ngày giao',text:o=>fdate(o.due)},{k:'priority',label:'Ưu tiên',badge:1},{k:'status',label:'Trạng thái',badge:1},{k:'progress',label:'Tiến độ',html:o=>prog(o.progress)}],
 newItem:()=>({id:'DH'+(2610001+D().orders.length+Math.floor(Math.random()*900)),orderDate:today(),status:'Mới',progress:0,priority:'Trung bình',price:0}),
 form:[{k:'id',label:'Mã đơn',req:1},{k:'customer',label:'Khách hàng',type:'select',options:custOpts,req:1},{k:'product',label:'Sản phẩm',type:'select',options:prodOpts,req:1},{k:'drawing',label:'Mã bản vẽ',req:1},{k:'mat',label:'Vật liệu',req:1},{k:'qty',label:'Số lượng',type:'number',req:1,min:1},{k:'price',label:'Đơn giá (₫)',type:'number',min:0},{k:'due',label:'Ngày giao',type:'date',req:1},{k:'priority',label:'Ưu tiên',type:'select',options:['Thấp','Trung bình','Cao','Khẩn'],req:1},{k:'status',label:'Trạng thái',type:'select',options:['Mới','Đang SX','Chờ QC','Hoàn thành','Đã giao','Trễ hạn'],req:1},{k:'progress',label:'Tiến độ %',type:'number',min:0,validate:v=>v>100?'Tối đa 100':''}]}}

/* ---------- Lệnh SX ---------- */
const WOST=['Chờ vật tư','Đang chạy','Tạm dừng','Trễ','Hoàn thành'];
function woCfg(){return{name:'lệnh sản xuất',id:'id',rows:()=>D().wos,rowActions:w=>`<button class="btn ghost sm" onclick="printWO('${w.id}')">🖨 Phiếu</button>`,
 onChange:w=>{const logged=D().logs.filter(l=>l.wo===w.id).reduce((s,l)=>s+l.qty,0);addLog(w,w.done-logged)},statusKey:'status',statusOptions:WOST,filter:{k:'stage',label:'Công đoạn',options:['Chờ',...D().stages,'Hoàn thành']},dateKey:'start',
 kpis:a=>[{l:'Lệnh đang chạy',v:a.filter(w=>w.status==='Đang chạy').length,c:'gr'},{l:'Lệnh trễ',v:a.filter(w=>w.status==='Trễ').length,c:'rd'},{l:'Chờ vật tư',v:a.filter(w=>w.status==='Chờ vật tư').length,c:'ye'},{l:'Hoàn thành',v:a.filter(w=>w.status==='Hoàn thành').length,c:'bl'}],
 cols:[{k:'id',label:'Lệnh SX'},{k:'order',label:'Đơn hàng'},{k:'product',label:'Sản phẩm',text:w=>prod(w.product)},{k:'route',label:'Quy trình'},{k:'stage',label:'Công đoạn hiện tại'},{k:'machine',label:'Máy',text:w=>w.machine?w.machine+' – '+mach(w.machine):'—'},{k:'qty',label:'SL',html:w=>fmt(w.done)+'/'+fmt(w.qty)},{k:'end',label:'Hạn HT',text:w=>fdate(w.end)},{k:'status',label:'Trạng thái',badge:1}],
 newItem:()=>({id:'LSX'+(26600+D().wos.length),done:0,stage:'Chờ',status:'Chờ vật tư',start:today(),route:'CNC → Kiểm định'}),
 form:[{k:'id',label:'Mã lệnh',req:1},{k:'order',label:'Đơn hàng',type:'select',options:()=>D().orders.map(o=>[o.id,o.id+' – '+prod(o.product)]),req:1},{k:'product',label:'Sản phẩm',type:'select',options:prodOpts,req:1},{k:'qty',label:'Số lượng',type:'number',req:1,min:1},{k:'done',label:'Đã làm',type:'number',min:0,validate:(v,o)=>v>Number(o.qty)?'Không vượt số lượng':''},{k:'route',label:'Quy trình',req:1},{k:'stage',label:'Công đoạn hiện tại',type:'select',options:()=>['Chờ',...D().stages,'Hoàn thành'],req:1},{k:'machine',label:'Máy',type:'select',options:()=>D().machines.map(m=>[m.id,m.id+' – '+m.name])},{k:'leader',label:'Tổ trưởng'},{k:'start',label:'Bắt đầu',type:'date',req:1},{k:'end',label:'Hạn hoàn thành',type:'date',req:1,validate:(v,o)=>v<o.start?'Phải sau ngày bắt đầu':''},{k:'status',label:'Trạng thái',type:'select',options:WOST,req:1}]}}
function renderKanban(el){const d=D(),cols=['Chờ',...d.stages,'Hoàn thành'];
  const draw=()=>{el.innerHTML=kpiRow([{l:'Lệnh đang chạy',v:d.wos.filter(w=>w.status==='Đang chạy').length,c:'gr'},{l:'Đơn trễ',v:lateOrders().length,c:'rd'},{l:'Tỉ lệ lỗi',v:defectRate().toFixed(2)+'%',c:'ye'},{l:'Tồn kho thấp',v:lowStock().length,c:'or'}])+
   `<p class="muted">Kéo-thả thẻ sang cột công đoạn (trên điện thoại: giữ thẻ ~0,3 giây rồi kéo) hoặc dùng nút ◀ ▶. Chỉ thả được vào công đoạn có trong quy trình của lệnh.</p><div class="kanban">${cols.map(c=>{const it=d.wos.filter(w=>w.stage===c);return`<div class="col" data-stage="${c}"><h4>${c}<span class="badge">${it.length}</span></h4>${it.length?it.map(w=>`<div class="kc" draggable="${can('san-xuat','move')}" data-id="${w.id}"><b>${w.id}</b> ${badge(w.status)} <button class="btn ghost sm" style="float:right;padding:1px 6px" data-print="${w.id}" title="In phiếu">🖨</button><div>${esc(prod(w.product))}</div><div class="muted">${w.order} · ${w.machine||'chưa gán máy'}</div>${prog(Math.round(w.done/w.qty*100))}<div class="r"><button class="btn ghost sm" data-mv="${w.id}" data-d="-1" ${c==='Chờ'?'disabled':''}>◀</button><small class="muted">HT ${fdate(w.end)}</small><button class="btn ghost sm" data-mv="${w.id}" data-d="1" ${c==='Hoàn thành'?'disabled':''}>▶</button></div></div>`).join(''):'<p class="muted" style="font-size:12px;text-align:center">Trống</p>'}</div>`}).join('')}</div>`};
  const canMove=can('san-xuat','move');
  const move=(id,target,dir)=>{if(!canMove)return toast('Vai trò '+role()+' không được chuyển công đoạn',1);const w=d.wos.find(x=>x.id===id),route=['Chờ',...w.route.split(' → '),'Hoàn thành'];let i=route.indexOf(w.stage);if(i<0)i=0;
    if(target!=null){if(!route.includes(target))return toast(w.id+' không có công đoạn "'+target+'" trong quy trình ('+w.route+')',1);i=route.indexOf(target)}else i=Math.max(0,Math.min(route.length-1,i+dir));
    if(route[i]===w.stage)return;w.stage=route[i];
    if(w.stage==='Hoàn thành'){addLog(w,w.qty-w.done);w.status='Hoàn thành';w.done=w.qty}else if(w.status==='Hoàn thành'||w.status==='Chờ vật tư')w.status='Đang chạy';
    const o=d.orders.find(x=>x.id===w.order);if(o){o.progress=Math.round((i/(route.length-1))*100);if(o.progress>=100)o.status='Chờ QC';else if(['Mới','Chờ QC','Hoàn thành'].includes(o.status))o.status='Đang SX'}
    const m=d.machines.filter(x=>x.type===w.stage);if(m.length)w.machine=m[0].id;DB.save();toast(w.id+' → '+w.stage+(o?' · đơn '+o.id+' '+o.progress+'%':''));draw()};
  el.onclick=e=>{const b=e.target.closest('[data-mv]');if(b)move(b.dataset.mv,null,+b.dataset.d);const p=e.target.closest('[data-print]');if(p)printWO(p.dataset.print)};
  el.ondragstart=e=>{const c=e.target.closest('.kc');if(!c)return;e.dataTransfer.setData('text/plain',c.dataset.id);e.dataTransfer.effectAllowed='move';c.classList.add('dragging')};
  el.ondragend=e=>{$$('.dragging,.drop-on',el).forEach(x=>x.classList.remove('dragging','drop-on'))};
  el.ondragover=e=>{const c=e.target.closest('.col');if(c){e.preventDefault();$$('.drop-on',el).forEach(x=>x!==c&&x.classList.remove('drop-on'));c.classList.add('drop-on')}};
  el.ondrop=e=>{const c=e.target.closest('.col');if(!c)return;e.preventDefault();move(e.dataTransfer.getData('text/plain'),c.dataset.stage)};
  // Cảm ứng: giữ ~300ms rồi kéo
  let tc=null,timer=null,ghost=null;
  el.addEventListener('touchstart',e=>{const c=e.target.closest('.kc');if(!c||e.target.closest('button'))return;timer=setTimeout(()=>{tc=c;c.classList.add('dragging');ghost=c.cloneNode(true);ghost.className='kc ghost';document.body.appendChild(ghost);navigator.vibrate&&navigator.vibrate(20)},300)},{passive:true});
  el.addEventListener('touchmove',e=>{if(!tc){clearTimeout(timer);return}e.preventDefault();const t=e.touches[0];ghost.style.left=t.clientX-80+'px';ghost.style.top=t.clientY-20+'px';const col=document.elementFromPoint(t.clientX,t.clientY);$$('.drop-on',el).forEach(x=>x.classList.remove('drop-on'));col&&col.closest('.col')&&col.closest('.col').classList.add('drop-on')},{passive:false});
  el.addEventListener('touchend',e=>{clearTimeout(timer);if(!tc)return;const t=e.changedTouches[0];ghost.remove();const col=document.elementFromPoint(t.clientX,t.clientY);const id=tc.dataset.id;tc.classList.remove('dragging');tc=null;if(col&&col.closest('.col'))move(id,col.closest('.col').dataset.stage);else draw()});
  draw()}
function renderGantt(el){const d=D(),ws=[...d.wos].sort((a,b)=>a.start<b.start?-1:1),min=new Date(ws[0].start),max=new Date(ws.reduce((m,w)=>w.end>m?w.end:m,ws[0].end)),span=(max-min)/864e5+1,pos=s=>((new Date(s)-min)/864e5)/span*100;
  const col={'Đang chạy':'var(--bl)','Hoàn thành':'var(--gr)','Trễ':'var(--rd)','Tạm dừng':'var(--ye)','Chờ vật tư':'var(--mu)'};
  el.innerHTML=`<div class="card gantt"><div class="legend" style="margin-bottom:8px">${Object.entries(col).map(([k,v])=>`<span><i style="background:${v}"></i>${k}</span>`).join('')}<span>Đường cam: hôm nay</span></div>
  <div class="row"><div class="lb muted">${fdate(ws[0].start)}</div><div class="lb muted" style="text-align:right">${fdate(isoDate(max))}</div></div>
  ${ws.map(w=>`<div class="row"><div class="lb"><b>${w.id}</b> <small class="muted">${w.product}</small></div><div class="tr"><div style="position:absolute;left:${pos(today())}%;top:0;bottom:0;border-left:2px dashed var(--or)"></div><div class="bar" style="left:${pos(w.start)}%;width:${Math.max(2,pos(w.end)-pos(w.start))}%;background:${col[w.status]}" title="${w.start} → ${w.end}">${w.stage}</div></div></div>`).join('')}</div>`}

/* ---------- BOM ---------- */
function bomCfg(){return{name:'định mức',id:'id',rows:()=>D().bom,filter:{k:'stage',label:'Công đoạn'},
 kpis:a=>[{l:'Dòng định mức',v:a.length,c:'bl'},{l:'Sản phẩm có BOM',v:new Set(a.map(b=>b.product)).size+'/'+D().products.length,c:'gr'},{l:'Hao hụt TB',v:(a.reduce((s,b)=>s+b.scrap,0)/Math.max(1,a.length)).toFixed(1)+'%',c:'ye'}],
 cols:[{k:'id',label:'Mã BOM'},{k:'product',label:'Sản phẩm',text:b=>b.product+' – '+prod(b.product)},{k:'material',label:'Vật tư',text:b=>{const m=D().stock.find(s=>s.code===b.material);return b.material+(m?' – '+m.name:'')}},{k:'qtyPer',label:'Định mức/cái'},{k:'unit',label:'ĐVT'},{k:'scrap',label:'Hao hụt %'},{k:'stage',label:'Công đoạn'},{k:'version',label:'Phiên bản'}],
 newItem:()=>({id:'BOM-'+Date.now().toString().slice(-5),version:'v1',scrap:3}),
 form:[{k:'id',label:'Mã BOM',req:1},{k:'product',label:'Sản phẩm',type:'select',options:prodOpts,req:1},{k:'material',label:'Vật tư',type:'select',options:()=>D().stock.filter(s=>s.kind==='NVL').map(s=>[s.code,s.code+' – '+s.name]),req:1},{k:'qtyPer',label:'Định mức/cái',type:'number',req:1,min:0.0001},{k:'unit',label:'ĐVT',req:1},{k:'scrap',label:'Hao hụt %',type:'number',min:0},{k:'stage',label:'Công đoạn',type:'select',options:()=>D().stages,req:1},{k:'version',label:'Phiên bản'}]}}
function renderMRP(el){const d=D(),need={};d.wos.filter(w=>w.status!=='Hoàn thành').forEach(w=>d.bom.filter(b=>b.product===w.product).forEach(b=>{need[b.material]=(need[b.material]||0)+(w.qty-w.done)*b.qtyPer*(1+b.scrap/100)}));
  const rows=Object.entries(need).map(([k,v])=>{const s=d.stock.find(x=>x.code===k)||{};return{k,name:s.name,unit:s.unit,need:Math.ceil(v),stock:s.stock||0}});
  el.innerHTML=kpiRow([{l:'Vật tư cần cho lệnh mở',v:rows.length,c:'bl'},{l:'Vật tư thiếu',v:rows.filter(r=>r.need>r.stock).length,c:'rd'}])+`<div class="tbl-wrap"><table><thead><tr><th>Vật tư</th><th>Nhu cầu</th><th>Tồn</th><th>Chênh lệch</th><th>Đánh giá</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.k} – ${esc(r.name)}</td><td>${fmt(r.need)} ${r.unit}</td><td>${fmt(r.stock)}</td><td class="${r.stock-r.need<0?'bad':'ok'}">${fmt(r.stock-r.need)}</td><td>${r.need>r.stock?badge('Thiếu – cần mua'):'<span class="badge b-gr">Đủ</span>'}</td></tr>`).join('')}</tbody></table></div>`}

/* ---------- Kho ---------- */
function renderStockGrid(el){const d=D();let q='',kind='',onlyLow=false;
 const draw=()=>{const list=d.stock.filter(s=>(!kind||s.kind===kind)&&(!onlyLow||s.stock<s.min)&&(s.name+s.code+s.loc).toLowerCase().includes(q.toLowerCase()));
  el.innerHTML=kpiRow([{l:'Mặt hàng NVL',v:d.stock.filter(s=>s.kind==='NVL').length,c:'bl'},{l:'Mặt hàng thành phẩm',v:d.stock.filter(s=>s.kind==='TP').length,c:'gr'},{l:'Tồn kho thấp',v:lowStock().length,c:'rd'},{l:'Giá trị NVL',v:money(d.stock.reduce((s,x)=>s+x.stock*x.price,0)),c:'or'}])+
  `<div class="toolbar"><input id="sq" placeholder="Tìm mã, tên, vị trí..." value="${esc(q)}"><select id="sk"><option value="">Tất cả loại</option><option value="NVL" ${kind==='NVL'?'selected':''}>Nguyên vật liệu</option><option value="TP" ${kind==='TP'?'selected':''}>Thành phẩm</option></select><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="sl" ${onlyLow?'checked':''}> Chỉ tồn thấp</label><button class="btn ghost" id="toTable">☰ Dạng bảng (sửa tại ô)</button><button class="btn ghost" id="lblAll">🏷 In nhãn kho (${list.length})</button>${can('kho')?'<button class="btn" id="sAdd">＋ Thêm mặt hàng</button>':''}</div>
  ${list.length?`<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr))">${list.map(s=>{const p=Math.min(100,Math.round(s.stock/(s.min*2)*100)),low=s.stock<s.min;return`<div class="card" style="${low?'border-color:var(--rd)':''}"><div style="display:flex;justify-content:space-between"><small class="muted">${s.code}</small>${low?'<span class="badge b-rd">Tồn thấp</span>':`<span class="badge">${s.kind==='TP'?'Thành phẩm':esc(s.group)}</span>`}</div><div style="font-weight:600;margin:6px 0">${esc(s.name)}</div><div style="font-size:22px;font-weight:700">${fmt(s.stock)} <small class="muted" style="font-size:13px">${s.unit}</small></div><div class="prog" style="margin:6px 0"><i style="width:${p}%;background:${low?'var(--rd)':'var(--gr)'}"></i></div><div class="muted" style="font-size:12px">Tối thiểu ${fmt(s.min)} · ${esc(s.loc)}</div><div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">${can('kho')?`<button class="btn ghost sm" data-tx="Nhập" data-c="${s.code}">＋ Nhập</button><button class="btn ghost sm" data-tx="Xuất" data-c="${s.code}">－ Xuất</button>`:''}<button class="btn ghost sm" onclick="printLabels('kho',['${s.code}'])">🏷</button><a class="btn ghost sm" href="#/kho/the-kho?ma=${s.code}" style="text-decoration:none">Thẻ kho</a></div></div>`}).join('')}</div>`:emptyState('Không tìm thấy mặt hàng phù hợp.','Xóa bộ lọc')}`;
  $('#sq',el).oninput=e=>{q=e.target.value;draw();const n=$('#sq',el);n.focus();n.setSelectionRange(q.length,q.length)};$('#sk',el).onchange=e=>{kind=e.target.value;draw()};$('#sl',el).onchange=e=>{onlyLow=e.target.checked;draw()};
  $('#toTable',el).onclick=()=>{el.onclick=null;DataTable(el,stockCfg(()=>renderStockGrid(el)))};$('#lblAll',el).onclick=()=>printLabels('kho',list.slice(0,24).map(s=>s.code));const sa=$('#sAdd',el);if(sa)sa.onclick=()=>openForm('Thêm mặt hàng',[{k:'code',label:'Mã',req:1},{k:'name',label:'Tên',req:1},{k:'kind',label:'Loại',type:'select',options:[['NVL','Nguyên vật liệu'],['TP','Thành phẩm']],req:1},{k:'group',label:'Nhóm',req:1},{k:'unit',label:'ĐVT',req:1},{k:'stock',label:'Tồn đầu',type:'number',min:0,req:1},{k:'min',label:'Tồn tối thiểu',type:'number',min:0,req:1},{k:'loc',label:'Vị trí kho',req:1},{k:'price',label:'Đơn giá',type:'number',min:0}],{},v=>{if(d.stock.some(s=>s.code===v.code))return toast('Mã đã tồn tại',1);d.stock.unshift(v);DB.save();toast('Đã thêm '+v.code);draw()})};
 el.onclick=e=>{const b=e.target.closest('[data-tx]');if(b)quickTx(b.dataset.tx,b.dataset.c,draw);else if(e.target.closest('[data-empty-act]')){q='';kind='';onlyLow=false;draw()}};draw()}
function applyTx(t){const s=DB.data.stock.find(x=>x.code===t.item);if(!s)return;if(t.type==='Nhập')s.stock+=t.qty;else if(t.type==='Xuất')s.stock-=t.qty;else if(t.type==='Kiểm kho')s.stock=t.qty}
function quickTx(type,code,cb){const s=D().stock.find(x=>x.code===code);openForm(type+' kho: '+s.name,[{k:'qty',label:'Số lượng ('+s.unit+')',type:'number',req:1,min:0.01,validate:v=>type==='Xuất'&&v>s.stock?'Vượt tồn hiện có ('+s.stock+')':''},{k:'ref',label:type==='Xuất'?'Lệnh SX':'Nhà cung cấp / chứng từ'},{k:'by',label:'Người thực hiện',req:1}],{by:'Thủ kho (mẫu)'},v=>{const t={id:(type==='Nhập'?'PN':'PX')+Date.now().toString().slice(-6),type,item:code,date:today(),note:'',...v};D().txs.unshift(t);applyTx(t);DB.save();toast('Đã lập phiếu '+t.id);cb()})}
function txCfg(type){return{name:'phiếu '+type.toLowerCase(),id:'id',inline:false,import:false,rows:()=>{const a=D().txs;a.forEach(t=>{if(t._applied==null)t._applied=1});return a.filter(t=>t.type===type)},dateKey:'date',sort:'date',dir:-1,
 kpis:a=>[{l:'Số phiếu',v:a.length,c:'bl'},{l:'Tổng số lượng',v:fmt(a.reduce((s,t)=>s+t.qty,0)),c:'or'},{l:'Tồn kho thấp',v:lowStock().length,c:'rd'}],
 cols:[{k:'id',label:'Số phiếu'},{k:'date',label:'Ngày',text:t=>fdate(t.date)},{k:'type',label:'Loại',badge:1},{k:'item',label:'Mặt hàng',text:t=>t.item+' – '+((D().stock.find(s=>s.code===t.item)||{}).name||'')},{k:'qty',label:type==='Kiểm kho'?'SL thực tế':'Số lượng',text:t=>fmt(t.qty)},{k:'ref',label:'Chứng từ/Lệnh SX'},{k:'note',label:'Ghi chú'},{k:'by',label:'Người lập'}],
 newItem:()=>({id:({Nhập:'PN',Xuất:'PX',Chuyển:'PC','Kiểm kho':'KK'})[type]+Date.now().toString().slice(-6),type,date:today()}),
 onChange:t=>{t.type=type;if(!t._applied){applyTx(t);t._applied=1}},
 form:[{k:'id',label:'Số phiếu',req:1},{k:'date',label:'Ngày',type:'date',req:1},{k:'item',label:'Mặt hàng',type:'select',options:()=>D().stock.map(s=>[s.code,s.code+' – '+s.name]),req:1},{k:'qty',label:'Số lượng',type:'number',req:1,min:0.01},{k:'ref',label:'Chứng từ/Lệnh SX'},{k:'by',label:'Người lập',req:1},{k:'note',label:'Ghi chú',full:1}]}}
function renderStockCard(el){const d=D(),m=location.hash.match(/ma=([^&]+)/),code=m?decodeURIComponent(m[1]):d.stock[0].code,s=d.stock.find(x=>x.code===code)||d.stock[0];
  const tx=d.txs.filter(t=>t.item===s.code).sort((a,b)=>a.date<b.date?-1:1);
  el.innerHTML=`<div class="toolbar"><select id="pick">${d.stock.map(x=>`<option value="${x.code}" ${x.code===s.code?'selected':''}>${x.code} – ${esc(x.name)}</option>`).join('')}</select></div>`+kpiRow([{l:'Tồn hiện tại',v:fmt(s.stock)+' '+s.unit,c:s.stock<s.min?'rd':'gr'},{l:'Tồn tối thiểu',v:fmt(s.min),c:'ye'},{l:'Vị trí',v:esc(s.loc),c:'bl'}])+
  (tx.length?`<div class="tbl-wrap"><table><thead><tr><th>Ngày</th><th>Số phiếu</th><th>Loại</th><th>Số lượng</th><th>Chứng từ</th><th>Người lập</th></tr></thead><tbody>${tx.map(t=>`<tr><td>${fdate(t.date)}</td><td>${t.id}</td><td>${badge(t.type)}</td><td>${t.type==='Xuất'?'-':t.type==='Nhập'?'+':'='}${fmt(t.qty)}</td><td>${esc(t.ref)}</td><td>${esc(t.by)}</td></tr>`).join('')}</tbody></table></div>`:emptyState('Mặt hàng này chưa có phát sinh nhập/xuất. Lập phiếu nhập đầu tiên từ tab Tồn kho.'));
  $('#pick',el).onchange=e=>{location.hash='#/kho/the-kho?ma='+e.target.value}}

/* ---------- QC ---------- */
function qcCfg(){return{name:'phiếu kiểm',id:'id',rows:()=>D().qc,rowActions:q=>`<button class="btn ghost sm" onclick="printLabels('qc',['${q.id}'])">🏷 Nhãn</button>`,extraTools:()=>`<button class="btn ghost" onclick="printLabels('qc',D().qc.slice(0,8).map(q=>q.id))">🏷 In nhãn 8 phiếu mới</button>`,statusKey:'result',statusOptions:['Đạt','Không đạt'],filter:{k:'cause',label:'Nguyên nhân lỗi',options:D().causes},dateKey:'date',sort:'date',dir:-1,
 kpis:a=>[{l:'Phiếu kiểm',v:a.length,c:'bl'},{l:'Tỉ lệ đạt',v:Math.round(a.filter(q=>q.result==='Đạt').length/Math.max(1,a.length)*100)+'%',c:'gr'},{l:'Tỉ lệ lỗi (mẫu)',v:defectRate().toFixed(2)+'%',c:'rd'},{l:'Lệnh đang chạy',v:D().wos.filter(w=>w.status==='Đang chạy').length,c:'or'}],
 cols:[{k:'id',label:'Phiếu'},{k:'date',label:'Ngày',text:q=>fdate(q.date)},{k:'wo',label:'Lệnh SX'},{k:'lot',label:'Lô'},{k:'product',label:'Sản phẩm',text:q=>prod(q.product)},{k:'param',label:'Thông số',html:q=>`${esc(q.param)}: ${q.nominal} ±${q.tol} mm`},{k:'measured',label:'Đo thực tế',html:q=>`<b class="${Math.abs(q.measured-q.nominal)<=q.tol?'ok':'bad'}">${q.measured}</b>`},{k:'fail',label:'Lỗi/Mẫu',html:q=>q.fail+'/'+q.sample},{k:'cause',label:'Nguyên nhân'},{k:'result',label:'Kết quả',badge:1}],
 newItem:()=>({id:'QC'+(26900+D().qc.length),date:today(),inspector:'KCS (mẫu)',fail:0,sample:50}),
 onChange:q=>{q.result=Math.abs(q.measured-q.nominal)<=q.tol&&q.fail<=3?'Đạt':'Không đạt'},
 form:[{k:'id',label:'Số phiếu',req:1},{k:'date',label:'Ngày',type:'date',req:1},{k:'wo',label:'Lệnh SX',type:'select',options:()=>D().wos.map(w=>[w.id,w.id+' – '+w.product]),req:1},{k:'product',label:'Sản phẩm',type:'select',options:prodOpts,req:1},{k:'lot',label:'Số lô',req:1},{k:'param',label:'Thông số kiểm',req:1},{k:'nominal',label:'Danh nghĩa (mm)',type:'number',req:1},{k:'tol',label:'Dung sai ± (mm)',type:'number',req:1,min:0},{k:'measured',label:'Đo thực tế (mm)',type:'number',req:1},{k:'sample',label:'Số mẫu',type:'number',req:1,min:1},{k:'fail',label:'Số lỗi',type:'number',min:0,req:1},{k:'cause',label:'Nguyên nhân',type:'select',options:()=>D().causes},{k:'inspector',label:'Người kiểm',req:1}]}}
function renderQCLot(el){const d=D(),lots=d.qc.map(q=>({l:q.lot+' · '+q.product,v:Math.round((1-q.fail/q.sample)*1000)/10,c:q.result==='Đạt'?'var(--gr)':'var(--rd)'})).sort((a,b)=>a.v-b.v);
  el.innerHTML=kpiRow([{l:'Số lô đã kiểm',v:lots.length,c:'bl'},{l:'Lô không đạt',v:d.qc.filter(q=>q.result!=='Đạt').length,c:'rd'},{l:'Tỉ lệ đạt TB',v:(lots.reduce((s,l)=>s+l.v,0)/lots.length).toFixed(1)+'%',c:'gr'}])+`<div class="grid g2e"><div class="card"><h3>Tỉ lệ đạt theo lô (%) – thấp nhất trước</h3>${Chart.hbars(lots.slice(0,14),'%')}</div><div class="card"><h3>Pareto nguyên nhân lỗi</h3>${Chart.hbars(d.causes.map(c=>({l:c,v:d.qc.filter(q=>q.cause===c).reduce((s,q)=>s+q.fail,0),c:'var(--or)'})).sort((a,b)=>b.v-a.v))}</div></div>`}

/* ---------- Máy & bảo trì ---------- */
function machineCfg(){return{name:'máy',id:'id',rows:()=>D().machines,statusKey:'status',statusOptions:['Đang chạy','Dừng','Bảo trì','Lỗi'],filter:{k:'type',label:'Loại máy'},
 kpis:a=>[{l:'Đang chạy',v:a.filter(m=>m.status==='Đang chạy').length+'/'+a.length,c:'gr'},{l:'Lỗi / bảo trì',v:a.filter(m=>['Lỗi','Bảo trì'].includes(m.status)).length,c:'rd'},{l:'OEE TB',v:Math.round(a.reduce((s,m)=>s+m.oee,0)/Math.max(1,a.length))+'%',c:'bl'},{l:'Đến hạn BT ≤ 3 ngày',v:a.filter(m=>daysTo(m.nextMaint)<=3).length,c:'ye'}],
 cols:[{k:'id',label:'Mã'},{k:'name',label:'Tên máy'},{k:'type',label:'Loại'},{k:'brand',label:'Hãng'},{k:'location',label:'Vị trí'},{k:'hours',label:'Giờ chạy',text:m=>fmt(m.hours)},{k:'oee',label:'OEE',html:m=>prog(m.oee)},{k:'nextMaint',label:'BT kế tiếp',html:m=>`<span class="${daysTo(m.nextMaint)<=3?'bad':''}">${fdate(m.nextMaint)}</span>`},{k:'status',label:'Trạng thái',badge:1}],
 newItem:()=>({id:'M'+String(D().machines.length+1).padStart(2,'0'),status:'Dừng',hours:0,oee:0}),
 form:[{k:'id',label:'Mã máy',req:1},{k:'name',label:'Tên máy',req:1},{k:'type',label:'Loại',type:'select',options:()=>D().stages,req:1},{k:'brand',label:'Hãng'},{k:'location',label:'Vị trí'},{k:'hours',label:'Giờ chạy',type:'number',min:0},{k:'oee',label:'OEE %',type:'number',min:0,validate:v=>v>100?'Tối đa 100':''},{k:'nextMaint',label:'Bảo trì kế tiếp',type:'date',req:1},{k:'status',label:'Trạng thái',type:'select',options:['Đang chạy','Dừng','Bảo trì','Lỗi'],req:1}]}}
function maintCfg(){return{name:'lịch bảo trì',id:'id',rows:()=>D().maint,statusKey:'status',statusOptions:['Kế hoạch','Đang làm','Hoàn thành'],filter:{k:'type',label:'Loại',options:['Định kỳ','Sự cố','Hiệu chuẩn']},dateKey:'date',sort:'date',
 kpis:a=>[{l:'Kế hoạch',v:a.filter(m=>m.status==='Kế hoạch').length,c:'ye'},{l:'Sự cố',v:a.filter(m=>m.type==='Sự cố').length,c:'rd'},{l:'Tổng giờ dừng',v:a.reduce((s,m)=>s+m.downtime,0)+' h',c:'or'}],
 cols:[{k:'id',label:'Mã'},{k:'date',label:'Ngày',text:m=>fdate(m.date)},{k:'machine',label:'Máy',text:m=>m.machine+' – '+mach(m.machine)},{k:'type',label:'Loại',badge:1},{k:'desc',label:'Nội dung'},{k:'tech',label:'Kỹ thuật viên'},{k:'downtime',label:'Dừng máy (h)'},{k:'status',label:'Trạng thái',badge:1}],
 newItem:()=>({id:'BT'+(2700+D().maint.length),date:today(),status:'Kế hoạch',downtime:0,type:'Định kỳ'}),
 form:[{k:'id',label:'Mã',req:1},{k:'date',label:'Ngày',type:'date',req:1},{k:'machine',label:'Máy',type:'select',options:()=>D().machines.map(m=>[m.id,m.id+' – '+m.name]),req:1},{k:'type',label:'Loại',type:'select',options:['Định kỳ','Sự cố','Hiệu chuẩn'],req:1},{k:'tech',label:'Kỹ thuật viên',req:1},{k:'downtime',label:'Dừng máy (h)',type:'number',min:0},{k:'status',label:'Trạng thái',type:'select',options:['Kế hoạch','Đang làm','Hoàn thành'],req:1},{k:'desc',label:'Nội dung',type:'textarea',full:1,req:1}]}}

/* ---------- Giao hàng ---------- */
function delivCfg(){return{name:'phiếu giao',id:'id',rows:()=>D().deliveries,statusKey:'status',statusOptions:['Chờ xuất','Đang giao','Đã giao'],dateKey:'planDate',
 kpis:a=>{const g=a.filter(x=>x.status==='Đã giao');return[{l:'Chờ xuất',v:a.filter(x=>x.status==='Chờ xuất').length,c:'ye'},{l:'Đang giao',v:a.filter(x=>x.status==='Đang giao').length,c:'bl'},{l:'Đúng hạn (OTD)',v:Math.round(g.filter(x=>x.onTime==='Đúng hạn').length/Math.max(1,g.length)*100)+'%',c:'gr'},{l:'Đơn trễ',v:lateOrders().length,c:'rd'}]},
 cols:[{k:'id',label:'Phiếu'},{k:'order',label:'Đơn hàng'},{k:'customer',label:'Khách hàng',text:x=>cust(x.customer)},{k:'qty',label:'SL',text:x=>fmt(x.qty)},{k:'planDate',label:'Ngày hẹn',text:x=>fdate(x.planDate)},{k:'actualDate',label:'Ngày giao',text:x=>fdate(x.actualDate)},{k:'vehicle',label:'Xe'},{k:'driver',label:'Tài xế'},{k:'onTime',label:'Đúng hạn',badge:1},{k:'status',label:'Trạng thái',badge:1}],
 newItem:()=>({id:'GH'+(27000+D().deliveries.length),status:'Chờ xuất',planDate:today()}),
 onChange:x=>{const o=D().orders.find(o=>o.id===x.order);if(o)x.customer=o.customer;if(x.status==='Đã giao'){if(!x.actualDate)x.actualDate=today();x.onTime=x.actualDate<=x.planDate?'Đúng hạn':'Trễ';if(o){o.status='Đã giao';o.progress=100}}},
 form:[{k:'id',label:'Số phiếu',req:1},{k:'order',label:'Đơn hàng',type:'select',options:()=>D().orders.map(o=>[o.id,o.id+' – '+cust(o.customer)]),req:1},{k:'qty',label:'Số lượng',type:'number',req:1,min:1},{k:'planDate',label:'Ngày hẹn',type:'date',req:1},{k:'actualDate',label:'Ngày giao thực tế',type:'date'},{k:'vehicle',label:'Biển số xe (giả)'},{k:'driver',label:'Tài xế'},{k:'status',label:'Trạng thái',type:'select',options:['Chờ xuất','Đang giao','Đã giao'],req:1}]}}

/* ---------- Khách hàng & báo giá ---------- */
function custCfg(){return{name:'khách hàng',id:'id',rows:()=>D().customers,statusKey:'type',statusOptions:['VIP','Thường xuyên','Mới','Tiềm năng'],filter:{k:'city',label:'Tỉnh/TP'},
 kpis:a=>[{l:'Khách hàng',v:a.length,c:'bl'},{l:'VIP',v:a.filter(c=>c.type==='VIP').length,c:'pu'},{l:'Báo giá chờ chốt',v:D().quotes.filter(q=>q.status==='Đã gửi').length,c:'ye'}],
 cols:[{k:'id',label:'Mã KH'},{k:'name',label:'Tên công ty'},{k:'contact',label:'Người liên hệ'},{k:'phone',label:'Điện thoại'},{k:'email',label:'Email'},{k:'city',label:'Tỉnh/TP'},{k:'type',label:'Phân loại',badge:1},{k:'orders',label:'Số đơn',text:c=>D().orders.filter(o=>o.customer===c.id).length,sortv:c=>D().orders.filter(o=>o.customer===c.id).length}],
 newItem:()=>({id:'KH'+String(D().customers.length+1).padStart(3,'0'),type:'Mới'}),
 form:[{k:'id',label:'Mã KH',req:1},{k:'name',label:'Tên công ty',req:1,full:1},{k:'contact',label:'Người liên hệ',req:1},{k:'phone',label:'Điện thoại',req:1,validate:v=>/^[0-9 .+]{8,15}$/.test(v)?'':'Số điện thoại không hợp lệ'},{k:'email',label:'Email',type:'email',validate:v=>!v||/^\S+@\S+\.\S+$/.test(v)?'':'Email không hợp lệ'},{k:'city',label:'Tỉnh/TP'},{k:'type',label:'Phân loại',type:'select',options:['VIP','Thường xuyên','Mới','Tiềm năng'],req:1}]}}
function quoteCfg(){return{name:'báo giá',id:'id',rows:()=>D().quotes,statusKey:'status',statusOptions:['Nháp','Đã gửi','Chốt','Hủy'],dateKey:'date',sort:'date',dir:-1,
 kpis:a=>[{l:'Tổng giá trị',v:money(a.reduce((s,q)=>s+q.total,0)),c:'bl'},{l:'Đã chốt',v:money(a.filter(q=>q.status==='Chốt').reduce((s,q)=>s+q.total,0)),c:'gr'},{l:'Tỉ lệ chốt',v:Math.round(a.filter(q=>q.status==='Chốt').length/Math.max(1,a.length)*100)+'%',c:'or'}],
 cols:[{k:'id',label:'Số BG'},{k:'date',label:'Ngày',text:q=>fdate(q.date)},{k:'customer',label:'Khách hàng',text:q=>cust(q.customer)},{k:'lines',label:'Dòng hàng',text:q=>q.lines.length+' dòng',sortv:q=>q.lines.length},{k:'total',label:'Trước thuế',text:q=>money(q.total)},{k:'vat',label:'VAT',text:q=>(q.vat||0)+'%'},{k:'grand',label:'Tổng cộng',text:q=>money(q.total*(1+(q.vat||0)/100)),sortv:q=>q.total*(1+(q.vat||0)/100)},{k:'valid',label:'Hiệu lực đến',text:q=>fdate(q.valid)},{k:'status',label:'Trạng thái',badge:1}],
 rowActions:q=>`<button class="btn ghost sm" onclick="showQuote('${q.id}')">Chi tiết</button>`,customEdit:quoteEditor,inline:true,
 newItem:()=>({id:'BG'+(26200+D().quotes.length),date:today(),status:'Nháp',lines:[]}),
 onChange:q=>{q.total=(q.lines||[]).reduce((s,l)=>s+l.qty*l.price,0)},
 form:[{k:'id',label:'Số báo giá',req:1},{k:'customer',label:'Khách hàng',type:'select',options:custOpts,req:1},{k:'date',label:'Ngày',type:'date',req:1},{k:'valid',label:'Hiệu lực đến',type:'date',req:1},{k:'vat',label:'VAT %',type:'select',options:[0,8,10],req:1},{k:'status',label:'Trạng thái',type:'select',options:['Nháp','Đã gửi','Chốt','Hủy'],req:1}]}}
function showQuote(id){clearForm();const q=D().quotes.find(x=>x.id===id);$('#mTitle').textContent='Báo giá '+q.id+' – '+cust(q.customer);
  $('#mForm').innerHTML=`<div class="full tbl-wrap"><table><thead><tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>${q.lines.map(l=>`<tr><td>${l.product} – ${esc(prod(l.product))}</td><td>${fmt(l.qty)}</td><td>${money(l.price)}</td><td>${money(l.qty*l.price)}</td></tr>`).join('')}<tr><td colspan="3">Cộng tiền hàng</td><td>${money(q.total)}</td></tr><tr><td colspan="3">VAT ${q.vat||0}%</td><td>${money(q.total*(q.vat||0)/100)}</td></tr><tr><td colspan="3"><b>Tổng cộng</b></td><td><b>${money(q.total*(1+(q.vat||0)/100))}</b></td></tr></tbody></table></div><div class="f-act">${badge(q.status)}<button type="button" class="btn ghost" data-close>Đóng</button></div>`;
  $('#mForm').onsubmit=e=>e.preventDefault();showModal()}

/* ---------- Nhân sự ---------- */
function empCfg(){return{name:'nhân viên',id:'id',rows:()=>D().employees,statusKey:'shift',statusOptions:['Sáng','Chiều','Đêm'],filter:{k:'team',label:'Tổ',options:D().teams},
 kpis:a=>[{l:'Nhân viên',v:a.length,c:'bl'},{l:'Đang làm',v:a.filter(e=>e.status==='Đang làm').length,c:'gr'},{l:'Nghỉ phép',v:a.filter(e=>e.status==='Nghỉ phép').length,c:'ye'},{l:'Tổng giờ tăng ca',v:a.reduce((s,e)=>s+e.otHours,0)+' h',c:'or'}],
 cols:[{k:'id',label:'Mã NV'},{k:'name',label:'Họ tên'},{k:'team',label:'Tổ/Bộ phận'},{k:'role',label:'Chức danh'},{k:'phone',label:'Điện thoại'},{k:'shift',label:'Ca chính'},{k:'workDays',label:'Công tháng'},{k:'otHours',label:'Tăng ca (h)'},{k:'status',label:'Trạng thái',badge:1}],
 newItem:()=>({id:'NV'+String(D().employees.length+1).padStart(3,'0'),status:'Đang làm',workDays:0,otHours:0,shift:'Sáng'}),
 onChange:e=>{if(!D().roster[e.id])D().roster[e.id]=Array(7).fill(e.shift)},
 form:[{k:'id',label:'Mã NV',req:1},{k:'name',label:'Họ tên',req:1},{k:'team',label:'Tổ',type:'select',options:()=>D().teams,req:1},{k:'role',label:'Chức danh',req:1},{k:'phone',label:'Điện thoại'},{k:'shift',label:'Ca chính',type:'select',options:['Sáng','Chiều','Đêm'],req:1},{k:'workDays',label:'Công tháng',type:'number',min:0,validate:v=>v>31?'Tối đa 31':''},{k:'otHours',label:'Tăng ca (h)',type:'number',min:0},{k:'status',label:'Trạng thái',type:'select',options:['Đang làm','Nghỉ phép'],req:1}]}}
function renderRoster(el){const d=D(),days=['T2','T3','T4','T5','T6','T7','CN'],cyc=['Sáng','Chiều','Đêm','Nghỉ'],cc={Sáng:'b-or',Chiều:'b-bl',Đêm:'b-pu',Nghỉ:''};let team='';
 const draw=()=>{const emps=d.employees.filter(e=>!team||e.team===team);const cnt=s=>days.map((_,i)=>emps.filter(e=>d.roster[e.id]&&d.roster[e.id][i]===s).length);
  el.innerHTML=kpiRow([{l:'Ca sáng (06–14h) TB/ngày',v:Math.round(cnt('Sáng').reduce((a,b)=>a+b)/7),c:'or'},{l:'Ca chiều (14–22h)',v:Math.round(cnt('Chiều').reduce((a,b)=>a+b)/7),c:'bl'},{l:'Ca đêm (22–06h)',v:Math.round(cnt('Đêm').reduce((a,b)=>a+b)/7),c:'pu'}])+
  `<div class="toolbar"><select id="rt"><option value="">Tất cả tổ</option>${d.teams.map(t=>`<option ${t===team?'selected':''}>${t}</option>`).join('')}</select><span class="muted" style="align-self:center">Bấm vào ô để đổi ca: Sáng → Chiều → Đêm → Nghỉ</span></div>
  <div class="tbl-wrap shift"><table><thead><tr><th>Nhân viên</th><th>Tổ</th>${days.map(x=>`<th>${x}</th>`).join('')}<th>Số ca</th></tr></thead><tbody>${emps.map(e=>{const r=d.roster[e.id]||Array(7).fill('Nghỉ');return`<tr><td>${esc(e.name)}</td><td class="muted">${e.team}</td>${r.map((s,i)=>`<td class="c"><span class="badge ${cc[s]}" style="cursor:pointer" data-r="${e.id}" data-i="${i}">${s}</span></td>`).join('')}<td>${r.filter(s=>s!=='Nghỉ').length}</td></tr>`}).join('')}</tbody></table></div>`;
  $('#rt',el).onchange=e=>{team=e.target.value;draw()}};
 el.onclick=e=>{const b=e.target.closest('[data-r]');if(!b)return;const r=d.roster[b.dataset.r]=d.roster[b.dataset.r]||Array(7).fill('Nghỉ');r[b.dataset.i]=cyc[(cyc.indexOf(r[b.dataset.i])+1)%4];DB.save();draw()};draw()}

/* ---------- Tài chính ---------- */
function debtCfg(){return{name:'công nợ',id:'id',rows:()=>D().debts,statusKey:'status',statusOptions:['Chưa thu','Thu một phần','Đã thu'],dateKey:'dueDate',sort:'dueDate',
 kpis:a=>[{l:'Tổng phải thu',v:money(a.reduce((s,x)=>s+x.amount,0)),c:'bl'},{l:'Đã thu',v:money(a.reduce((s,x)=>s+x.paid,0)),c:'gr'},{l:'Còn nợ',v:money(a.reduce((s,x)=>s+x.amount-x.paid,0)),c:'or'},{l:'Quá hạn',v:a.filter(x=>x.status!=='Đã thu'&&daysTo(x.dueDate)<0).length+' hóa đơn',c:'rd'}],
 cols:[{k:'id',label:'Hóa đơn'},{k:'order',label:'Đơn hàng'},{k:'customer',label:'Khách hàng',text:x=>cust(x.customer)},{k:'amount',label:'Giá trị',text:x=>money(x.amount)},{k:'paid',label:'Đã thu',text:x=>money(x.paid)},{k:'remain',label:'Còn lại',html:x=>`<b class="${x.amount-x.paid>0?'bad':'ok'}">${money(x.amount-x.paid)}</b>`,sortv:x=>x.amount-x.paid},{k:'dueDate',label:'Hạn TT',html:x=>`<span class="${x.status!=='Đã thu'&&daysTo(x.dueDate)<0?'bad':''}">${fdate(x.dueDate)}</span>`},{k:'status',label:'Trạng thái',badge:1}],
 newItem:()=>({id:'HD'+(26800+D().debts.length),paid:0}),
 onChange:x=>{const o=D().orders.find(o=>o.id===x.order);if(o)x.customer=o.customer;x.status=x.paid>=x.amount?'Đã thu':x.paid>0?'Thu một phần':'Chưa thu'},
 form:[{k:'id',label:'Số hóa đơn',req:1},{k:'order',label:'Đơn hàng',type:'select',options:()=>D().orders.map(o=>[o.id,o.id+' – '+cust(o.customer)]),req:1},{k:'amount',label:'Giá trị (₫)',type:'number',req:1,min:0},{k:'paid',label:'Đã thu (₫)',type:'number',min:0,validate:(v,o)=>v>Number(o.amount)?'Không vượt giá trị':''},{k:'dueDate',label:'Hạn thanh toán',type:'date',req:1}]}}

/* ---------- Báo cáo ---------- */
function renderReport(el,kind){const d=D();let days=30;
 const draw=()=>{const from=new Date();from.setDate(from.getDate()-days);const fs=isoDate(from);let body='',csv=[];
  if(kind==='sl'){const out=dailyOutput(days);csv=[['Ngày','Sản lượng','Kế hoạch'],...out.map(o=>[o.l,o.v,o.target])];const s=out.reduce((a,b)=>a+b.v,0),t=out.reduce((a,b)=>a+b.target,0);
   body=kpiRow([{l:'Tổng sản lượng',v:fmt(s)},{l:'Kế hoạch',v:fmt(t),c:'bl'},{l:'Đạt kế hoạch',v:Math.round(s/t*100)+'%',c:'gr'}])+`<div class="card"><h3>Sản lượng theo ngày</h3>${Chart.bars(out,{line:out.map(x=>x.target)})}</div>`}
  if(kind==='cl'){const q=d.qc.filter(x=>x.date>=fs);csv=[['Phiếu','Ngày','Lô','Sản phẩm','Mẫu','Lỗi','Kết quả','Nguyên nhân'],...q.map(x=>[x.id,x.date,x.lot,x.product,x.sample,x.fail,x.result,x.cause])];
   body=kpiRow([{l:'Phiếu kiểm',v:q.length},{l:'Đạt',v:q.filter(x=>x.result==='Đạt').length,c:'gr'},{l:'Không đạt',v:q.filter(x=>x.result!=='Đạt').length,c:'rd'}])+`<div class="grid g2e"><div class="card"><h3>Kết quả</h3>${Chart.donut([{l:'Đạt',v:q.filter(x=>x.result==='Đạt').length},{l:'Không đạt',v:q.filter(x=>x.result!=='Đạt').length}])}</div><div class="card"><h3>Lỗi theo nguyên nhân</h3>${Chart.hbars(d.causes.map(c=>({l:c,v:q.filter(x=>x.cause===c).reduce((s,x)=>s+x.fail,0),c:'var(--or)'})))}</div></div>`}
  if(kind==='gh'){const g=d.deliveries.filter(x=>x.planDate>=fs);const done=g.filter(x=>x.status==='Đã giao');csv=[['Phiếu','Đơn','Khách hàng','Ngày hẹn','Ngày giao','Đúng hạn','Trạng thái'],...g.map(x=>[x.id,x.order,cust(x.customer),x.planDate,x.actualDate,x.onTime,x.status])];
   body=kpiRow([{l:'Phiếu giao',v:g.length},{l:'Đã giao',v:done.length,c:'gr'},{l:'OTD',v:Math.round(done.filter(x=>x.onTime==='Đúng hạn').length/Math.max(1,done.length)*100)+'%',c:'bl'},{l:'Đơn trễ',v:lateOrders().length,c:'rd'}])+`<div class="card"><h3>Giao hàng theo khách</h3>${Chart.hbars(d.customers.map(c=>({l:c.name,v:g.filter(x=>x.customer===c.id).length})).filter(x=>x.v))}</div>`}
  if(kind==='tk'){csv=[['Mã','Tên','Loại','Tồn','Tối thiểu','ĐVT','Vị trí'],...d.stock.map(s=>[s.code,s.name,s.kind,s.stock,s.min,s.unit,s.loc])];
   body=kpiRow([{l:'Mặt hàng',v:d.stock.length},{l:'Tồn thấp',v:lowStock().length,c:'rd'},{l:'Giá trị NVL',v:money(d.stock.reduce((s,x)=>s+x.stock*x.price,0)),c:'gr'}])+`<div class="card"><h3>Tỉ lệ tồn / tối thiểu (%)</h3>${Chart.hbars(d.stock.map(s=>({l:s.code+' '+s.name,v:Math.round(s.stock/s.min*100),c:s.stock<s.min?'var(--rd)':'var(--gr)'})).sort((a,b)=>a.v-b.v).slice(0,15),'%')}</div>`}
  el.innerHTML=`<div class="toolbar"><select id="rp">${[7,30,90].map(n=>`<option value="${n}" ${n===days?'selected':''}>${n} ngày gần nhất</option>`).join('')}</select><button class="btn sec" id="csv">⬇ Xuất CSV</button><button class="btn ghost" onclick="window.print()">🖨 In</button></div>`+body;
  $('#rp',el).onchange=e=>{days=+e.target.value;draw()};$('#csv',el).onclick=()=>downloadCSV('bao-cao-'+kind+'-'+today()+'.csv',csv)};draw()}

/* ---------- Form báo giá nhiều dòng ---------- */
function quoteEditor(o,isNew,save){const q=JSON.parse(JSON.stringify(o));q.lines=q.lines&&q.lines.length?q.lines:[{product:'',qty:100,price:0}];if(q.vat==null)q.vat=10;
  const f=$('#mForm');$('#mTitle').textContent=(isNew?'Thêm':'Sửa')+' báo giá '+q.id;
  const head=[{k:'id',label:'Số báo giá',req:1,validate:v=>isNew&&D().quotes.some(x=>x.id===v)?'Mã đã tồn tại':''},{k:'customer',label:'Khách hàng',type:'select',options:custOpts,req:1},{k:'date',label:'Ngày',type:'date',req:1},{k:'valid',label:'Hiệu lực đến',type:'date',req:1,validate:(v,x)=>v<x.date?'Phải sau ngày báo giá':''},{k:'status',label:'Trạng thái',type:'select',options:['Nháp','Đã gửi','Chốt','Hủy'],req:1},{k:'vat',label:'VAT',type:'select',options:[[0,'0%'],[8,'8%'],[10,'10%']],req:1}];
  const lineRow=(l,i)=>`<tr data-ln="${i}"><td>${fieldInput({k:'p'+i,type:'select',options:prodOpts},l.product)}</td><td><input name="q${i}" type="number" min="1" value="${l.qty}" style="width:90px"></td><td><input name="g${i}" type="number" min="0" value="${l.price}" style="width:110px"></td><td class="lt" style="text-align:right"></td><td><button type="button" class="btn ghost sm" data-rmln="${i}" title="Xóa dòng">✕</button></td></tr>`;
  const draw=()=>{f.innerHTML=head.map(x=>`<label data-f="${x.k}">${x.label} *${fieldInput(x,q[x.k]??'')}<span class="em"></span></label>`).join('')+
   `<div class="full"><div class="tbl-wrap"><table class="lines"><thead><tr><th>Sản phẩm</th><th>Số lượng</th><th>Đơn giá (₫)</th><th style="text-align:right">Thành tiền</th><th></th></tr></thead><tbody>${q.lines.map(lineRow).join('')}</tbody></table></div>
   <button type="button" class="btn ghost sm" id="addLn" style="margin-top:8px">＋ Thêm dòng</button>
   <div class="totals" id="tots"></div></div><div class="f-act"><button type="button" class="btn ghost" data-close>Hủy</button><button class="btn">Lưu báo giá</button></div>`;calc()};
  const read=()=>{head.forEach(x=>{if(f.elements[x.k])q[x.k]=f.elements[x.k].value});q.vat=Number(q.vat);q.lines=$$('[data-ln]',f).map(tr=>{const i=tr.dataset.ln;return{product:f.elements['p'+i].value,qty:Number(f.elements['q'+i].value),price:Number(f.elements['g'+i].value)}})};
  const calc=()=>{read();let sub=0;$$('[data-ln]',f).forEach((tr,j)=>{const l=q.lines[j],t=(l.qty||0)*(l.price||0);sub+=t;$('.lt',tr).textContent=money(t)});
    $('#tots').innerHTML=`<div>Cộng tiền hàng <b>${money(sub)}</b></div><div>VAT ${q.vat}% <b>${money(sub*q.vat/100)}</b></div><div class="grand">Tổng cộng <b>${money(sub*(1+q.vat/100))}</b></div>`};
  f.oninput=calc;f.onchange=calc;
  f.onclick=e=>{if(e.target.id==='addLn'){read();q.lines.push({product:'',qty:100,price:0});draw()}const r=e.target.closest('[data-rmln]');if(r){read();if(q.lines.length<=1)return toast('Báo giá phải có ít nhất 1 dòng',1);q.lines.splice(+r.dataset.rmln,1);draw()}};
  f.onsubmit=e=>{e.preventDefault();read();let ok=true;head.forEach(x=>{const lb=$(`[data-f="${x.k}"]`,f),r=checkField(x,q[x.k],q);lb.classList.toggle('err',!!r.msg);$('.em',lb).textContent=r.msg;if(r.msg)ok=false});
    $$('[data-ln]',f).forEach((tr,j)=>{const l=q.lines[j],bad=!l.product||!(l.qty>0)||!(l.price>=0);tr.classList.toggle('err',bad);if(bad)ok=false});
    if(!ok)return toast('Kiểm tra lại thông tin báo giá và các dòng hàng (sản phẩm, SL > 0, đơn giá ≥ 0)',1);
    q.total=q.lines.reduce((s,l)=>s+l.qty*l.price,0);closeModal();save(q)};
  draw();showModal(true)}

/* ---------- In phiếu lệnh SX & nhãn ---------- */
function printWO(id){const d=D(),w=d.wos.find(x=>x.id===id),o=d.orders.find(x=>x.id===w.order)||{},bom=d.bom.filter(b=>b.product===w.product);
  printPreview('Phiếu lệnh sản xuất '+w.id,`<div class="ps-head"><div><h2>PHIẾU LỆNH SẢN XUẤT</h2><div>XN Gia Công Linh Kiện Máy In (dữ liệu mẫu)</div></div>${barcode(w.id)}</div>
  <table class="ps-tbl"><tr><th>Lệnh SX</th><td>${w.id}</td><th>Đơn hàng</th><td>${w.order}</td></tr><tr><th>Khách hàng</th><td>${esc(cust(o.customer))}</td><th>Mã bản vẽ</th><td>${esc(o.drawing||'')}</td></tr>
  <tr><th>Sản phẩm</th><td>${w.product} – ${esc(prod(w.product))}</td><th>Vật liệu</th><td>${esc(o.mat||'')}</td></tr><tr><th>Số lượng</th><td>${fmt(w.qty)} cái</td><th>Đã làm</th><td>${fmt(w.done)}</td></tr>
  <tr><th>Bắt đầu</th><td>${fdate(w.start)}</td><th>Hạn hoàn thành</th><td>${fdate(w.end)}</td></tr><tr><th>Máy</th><td>${w.machine||'—'} ${esc(mach(w.machine))}</td><th>Tổ trưởng</th><td>${esc(w.leader)}</td></tr></table>
  <h3>Quy trình công đoạn</h3><table class="ps-tbl"><tr><th>#</th><th>Công đoạn</th><th>Máy</th><th>SL đạt</th><th>SL lỗi</th><th>Người làm / ký</th></tr>${w.route.split(' → ').map((s,i)=>`<tr><td>${i+1}</td><td>${s}</td><td></td><td></td><td></td><td style="height:28px"></td></tr>`).join('')}</table>
  <h3>Định mức vật tư</h3><table class="ps-tbl"><tr><th>Vật tư</th><th>Định mức/cái</th><th>Hao hụt</th><th>Cần cấp</th></tr>${bom.map(b=>`<tr><td>${b.material} – ${esc((d.stock.find(s=>s.code===b.material)||{}).name)}</td><td>${b.qtyPer} ${b.unit}</td><td>${b.scrap}%</td><td>${fmt(Math.ceil(w.qty*b.qtyPer*(1+b.scrap/100)))} ${b.unit}</td></tr>`).join('')||'<tr><td colspan="4">Chưa có BOM</td></tr>'}</table>
  <div class="ps-sign"><div>Kế hoạch</div><div>Quản đốc</div><div>QC</div></div>`)}
function printLabels(kind,ids){const d=D();const items=ids.map(id=>{if(kind==='qc'){const q=d.qc.find(x=>x.id===id);return`<div class="lbl">${barcode(q.id,{h:36,w:1.3})}<b>${esc(prod(q.product))}</b><div>Lô ${q.lot} · ${q.wo}</div><div>${esc(q.param)} ${q.nominal}±${q.tol} → ${q.measured}</div><div class="lbl-r ${q.result==='Đạt'?'pass':'fail'}">${q.result.toUpperCase()}</div><small>${fdate(q.date)} · KCS: ${esc(q.inspector)}</small></div>`}
  const s=d.stock.find(x=>x.code===id);return`<div class="lbl">${barcode(s.code,{h:36,w:1.3})}<b>${esc(s.name)}</b><div>Vị trí: ${esc(s.loc)}</div><div>ĐVT: ${s.unit} · Tối thiểu: ${fmt(s.min)}</div><small>In ngày ${fdate(today())}</small></div>`}).join('');
  printPreview('In nhãn '+(kind==='qc'?'QC':'kho')+' ('+ids.length+')',`<div class="labels">${items}</div>`)}

/* ---------- Kho dạng bảng (sửa tại ô) ---------- */
function stockCfg(back){return{name:'mặt hàng kho',id:'code',rows:()=>D().stock,statusKey:'kind',statusOptions:['NVL','TP'],filter:{k:'group',label:'Nhóm'},
 extraTools:()=>`<button class="btn ghost" id="toGrid">▦ Dạng lưới</button>`,onRender:el=>{$('#toGrid',el).onclick=back},
 rowActions:s=>`<button class="btn ghost sm" onclick="printLabels('kho',['${s.code}'])">🏷</button>`,
 kpis:a=>[{l:'Mặt hàng',v:a.length,c:'bl'},{l:'Tồn kho thấp',v:lowStock().length,c:'rd'},{l:'Lệnh đang chạy',v:D().wos.filter(w=>w.status==='Đang chạy').length,c:'gr'}],
 cols:[{k:'code',label:'Mã'},{k:'name',label:'Tên'},{k:'kind',label:'Loại'},{k:'group',label:'Nhóm'},{k:'stock',label:'Tồn',html:s=>`<b class="${s.stock<s.min?'bad':''}">${fmt(s.stock)}</b>`,sortv:s=>s.stock},{k:'min',label:'Tối thiểu'},{k:'unit',label:'ĐVT'},{k:'loc',label:'Vị trí'},{k:'price',label:'Đơn giá',text:s=>money(s.price),sortv:s=>s.price}],
 form:[{k:'code',label:'Mã',req:1},{k:'name',label:'Tên',req:1},{k:'kind',label:'Loại',type:'select',options:['NVL','TP'],req:1},{k:'group',label:'Nhóm',req:1},{k:'stock',label:'Tồn',type:'number',min:0,req:1},{k:'min',label:'Tồn tối thiểu',type:'number',min:0,req:1},{k:'unit',label:'ĐVT',req:1},{k:'loc',label:'Vị trí kho',req:1},{k:'price',label:'Đơn giá',type:'number',min:0}]}}
