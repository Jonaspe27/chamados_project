const el = s => document.querySelector(s);
const toast = (m)=>{ const t=el('#toast'); t.textContent=m; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'), 2000); };
const params = new URLSearchParams(location.search);
const id = params.get('id');

async function me(){
  const r = await fetch('/api/auth/me', { credentials:'include' });
  if(!r.ok) return null; return r.json();
}

async function getTicket(){
  const r = await fetch('/api/tickets/'+id, { credentials:'include' });
  if(!r.ok) throw new Error('Erro ao carregar');
  return r.json();
}

async function save(update){
  const r = await fetch('/api/tickets/'+id, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(update), credentials:'include' });
  if(!r.ok) throw new Error((await r.json()).message || 'Erro ao salvar');
  return r.json();
}

async function comment(body){
  const r = await fetch('/api/tickets/'+id+'/comments', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ body }), credentials:'include' });
  if(!r.ok) throw new Error((await r.json()).message || 'Erro ao comentar');
  return r.json();
}

function render(t){
  el('#card').classList.remove('hidden');
  el('#subject').textContent = t.subject;
  el('#meta').textContent = `#${t._id} · ${new Date(t.createdAt).toLocaleString()} · ${t.requester?.name||''}`;
  el('#description').textContent = t.description;
  el('#status').value = t.status;
  el('#priority').value = t.priority;
  el('#assignee').value = t.assignee?._id || '';
  const c = el('#comments');
  c.innerHTML = '';
  for(const cm of (t.comments||[])){
    const div = document.createElement('div');
    div.className = 'ticket';
    div.innerHTML = `<div class="small">${cm.author?.name||'Usuário'} · ${new Date(cm.createdAt).toLocaleString()}</div><div>${escapeHtml(cm.body)}</div>`;
    c.appendChild(div);
  }
}

function escapeHtml(str){
  return String(str).replace(/[&<>\"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
}

el('#btnSave').addEventListener('click', async()=>{
  try{
    const payload = {
      status: el('#status').value,
      priority: el('#priority').value,
      assignee: el('#assignee').value || null,
    };
    const updated = await save(payload);
    render(updated); toast('Salvo!');
  }catch(err){ toast(err.message); }
});

el('#btnComment').addEventListener('click', async()=>{
  const body = el('#comment').value.trim();
  if(!body) return;
  try{
    const t = await comment(body); el('#comment').value=''; render(t); toast('Comentário adicionado');
  }catch(err){ toast(err.message); }
});

(async function init(){
  const u = await me();
  if(!u){ location.href = '/'; return; }
  document.querySelector('#userBox').textContent = `${u.name} (${u.role})`;
  const t = await getTicket();
  render(t);
})();
