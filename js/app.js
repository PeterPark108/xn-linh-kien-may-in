/* Khởi động, hash-router, topbar */
DB.load();
const app=$('#app');
function nav(){const [m]=parse();let g='';$('#nav').innerHTML=MODULES.filter(x=>canSee(x.id)).map(x=>{const h=x.group!==g?`<div class="nav-group">${g=x.group}</div>`:'';return h+`<a href="#/${x.id}" class="${x.id===m.id?'on':''}" ${x.id===m.id?'aria-current="page"':''} title="${x.title}" data-tip="${x.title}">${ICONS[x.icon]}<span>${x.title}</span></a>`}).join('')}
function parse(){const p=location.hash.replace(/^#\/?/,'').split('?')[0].split('/');const m=MODULES.find(x=>x.id===p[0])||MODULES[0];const t=m.tabs.find(x=>x.id===p[1])||m.tabs[0];return[m,t]}
function route(){let [m,t]=parse();if(!canSee(m.id)){toast('Vai trò '+role()+' không có quyền xem '+m.title,1);location.hash='#/tong-quan';return}window.CUR_MOD=m.id;closeModal();nav();app.classList.remove('drawer');
  const v=$('#view');v.innerHTML=`<div class="page-head"><h1>${m.title}</h1><span class="sp"></span><span class="muted">${new Date().toLocaleDateString('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'})}</span></div>`+(m.tabs.length>1?`<div class="tabs">${m.tabs.map(x=>`<button class="${x.id===t.id?'on':''}" onclick="location.hash='#/${m.id}/${x.id}'">${x.label}</button>`).join('')}</div>`:'')+'<div id="tabBody"></div>';
  t.render($('#tabBody'));document.title=m.title+' – XN Linh Kiện Máy In';notif()}
function notif(){const d=DB.data,items=[...lateOrders().map(o=>`⏰ Đơn <b>${o.id}</b> trễ hạn (${fdate(o.due)})`),...lowStock().map(s=>`📦 Tồn thấp: ${esc(s.name)} (${fmt(s.stock)}/${fmt(s.min)})`),...d.machines.filter(m=>m.status==='Lỗi').map(m=>`⚠️ Máy <b>${m.id}</b> báo lỗi`)];
  $('#notifCount').textContent=items.length;$('#notifList').innerHTML=items.map(i=>`<div>${i}</div>`).join('')||'<div>Không có thông báo</div>'}
$('#btnMenu').onclick=()=>innerWidth<=900?app.classList.toggle('drawer'):(app.classList.toggle('collapsed'),localStorage.setItem('xnlk_col',app.classList.contains('collapsed')));
$('#backdrop').onclick=()=>app.classList.remove('drawer');
if(localStorage.getItem('xnlk_col')==='true')app.classList.add('collapsed');
const th=localStorage.getItem('xnlk_theme');if(th)document.documentElement.dataset.theme=th;
$('#btnTheme').onclick=()=>{const n=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=n;localStorage.setItem('xnlk_theme',n)};
$('#btnNotif').onclick=e=>{e.stopPropagation();$('#notifList').classList.toggle('show')};
document.addEventListener('click',e=>{if(!e.target.closest('.notif'))$('#notifList').classList.remove('show');if(!e.target.closest('.search'))$('#gRes').style.display='none';if(e.target.closest('[data-close]')||e.target.id==='modal')closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();$('#cModal').classList.remove('show')}});
$('#btnReset').onclick=()=>{if(role()!=='Quản lý')return toast('Chỉ vai trò Quản lý được khôi phục dữ liệu',1);confirmBox('Khôi phục toàn bộ <b>dữ liệu mẫu</b>? Mọi thay đổi sẽ mất.',()=>{DB.reset();toast('Đã khôi phục dữ liệu mẫu');route()})};
const rs=$('#roleSel');rs.innerHTML=Object.keys(ROLES).map(r=>`<option ${r===role()?'selected':''}>${r}</option>`).join('');const setRole=()=>{$('.uname b').textContent=role()+' (mẫu)';$('.avatar').textContent=role().split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()};setRole();
rs.onchange=()=>{localStorage.setItem('xnlk_role',rs.value);setRole();toast('Đã chuyển vai trò: '+rs.value+' (demo)');route()};
$('#gSearch').oninput=e=>{const q=e.target.value.trim().toLowerCase(),r=$('#gRes');if(q.length<2){r.style.display='none';return}const d=DB.data,res=[];
  const add=(arr,f,lab,href)=>arr.forEach(o=>{if(res.length<15&&f(o).toLowerCase().includes(q))res.push(`<a href="${href(o)}">${esc(lab(o))}<br><small>${esc(f(o))}</small></a>`)});
  add(d.orders,o=>o.id+' '+cust(o.customer)+' '+prod(o.product),o=>'📋 Đơn '+o.id,()=>'#/don-hang');add(d.wos,w=>w.id+' '+w.order+' '+prod(w.product),w=>'⚙ Lệnh '+w.id,()=>'#/san-xuat/bang');
  add(d.customers,c=>c.id+' '+c.name+' '+c.contact,c=>'👥 '+c.name,()=>'#/khach-hang');add(d.machines,m=>m.id+' '+m.name,m=>'🔧 '+m.id,()=>'#/may-moc');add(d.stock,s=>s.code+' '+s.name,s=>'📦 '+s.code,s=>'#/kho/the-kho?ma='+s.code);
  r.innerHTML=res.join('')||'<a>Không tìm thấy kết quả</a>';r.style.display='block'};
$('#gRes').onclick=()=>{$('#gRes').style.display='none';$('#gSearch').value=''};
window.addEventListener('hashchange',route);route();
