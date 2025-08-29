const api = {
  async login(email, password){
    const r = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email,password}), credentials:'include' });
    if(!r.ok) throw new Error((await r.json()).message || 'Falha no login');
    return r.json();
  },
  async me(){
    const r = await fetch('/api/auth/me', { credentials:'include' });
    if(!r.ok) throw new Error('');
    return r.json();
  },
  async logout(){
    await fetch('/api/auth/logout', { method:'POST', credentials:'include' });
  },
  async createTicket(payload){
    const r = await fetch('/api/tickets', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload), credentials:'include' });
    if(!r.ok) throw new Error((await r.json()).message || 'Erro ao criar');
    return r.json();
  },
  async listTickets(params={}){
    const qs = new URLSearchParams(params).toString();
    const r = await fetch('/api/tickets?'+qs, { credentials:'include' });
    if(!r.ok) throw new Error('Erro ao listar');
    return r.json();
  }
};

const el = s => document.querySelector(s);
const toast = (m)=>{ const t=el('#toast'); t.textContent=m; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'), 2000); };

async function boot(){
  try{
    const me = await api.me();
    state.user = me; uiOnLogin(me);
    await loadList();
  }catch{ /* not logged */ }
}

const state = { user:null, page:1 };

function uiOnLogin(user){
  el('#userBox').textContent = `${user.name} (${user.role})`;
  el('#loginCard').classList.add('hidden');
  el('#newCard').classList.remove('hidden');
  el('#filtersCard').classList.remove('hidden');
  el('#listCard').classList.remove('hidden');
}

el('#btnLogin').addEventListener('click', async()=>{
  const email = el('#email').value.trim();
  const password = el('#password').value.trim();
  try{
    const me = await api.login(email, password);
    state.user = me; uiOnLogin(me); toast('Bem-vindo!');
    await loadList();
  }catch(err){ toast(err.message); }
});

el('#btnLogout').addEventListener('click', async()=>{ await api.logout(); location.reload(); });

el('#btnCreate').addEventListener('click', async()=>{
  const subject = el('#subject').value.trim();
  const description = el('#description').value.trim();
  const priority = el('#priority').value;
  const tags = el('#tags').value.split(',').map(s=>s.trim()).filter(Boolean);
  if(!subject || !description) return toast('Preencha assunto e descrição');
  try{
    const t = await api.createTicket({ subject, description, priority, tags });
    el('#subject').value = ''; el('#description').value=''; el('#tags').value='';
    toast('Chamado criado');
    await loadList();
  }catch(err){ toast(err.message); }
});

el('#btnReload').addEventListener('click', loadList);

async function loadList(){
  const status = el('#fStatus').value || undefined;
  const priority = el('#fPriority').value || undefined;
  const q = el('#q').value || undefined;
  const data = await api.listTickets({ status, priority, q, page: state.page, limit: 50 });

  const list = el('#list');
  list.innerHTML = '';
  for(const t of data.items){
    const div = document.createElement('div');
    div.className = 'ticket';
    div.innerHTML = `
      <div class="flex-between">
        <h4>${escapeHtml(t.subject)}</h4>
        <a class="badge" href="/ticketDetail.html?id=${t._id}">ver</a>
      </div>
      <div class="small">#${t._id} · ${new Date(t.updatedAt).toLocaleString()} · ${t.requester?.name||''}</div>
      <div class="flex" style="margin-top:6px">
        <span class="badge">${t.status}</span>
        <span class="badge">${t.priority}</span>
        ${(t.tags||[]).slice(0,4).map(x=>`<span class='badge'>${escapeHtml(x)}</span>`).join('')}
      </div>
    `;
    list.appendChild(div);
  }
}

function escapeHtml(str){
  return str.replace(/[&<>\"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
}

boot();
