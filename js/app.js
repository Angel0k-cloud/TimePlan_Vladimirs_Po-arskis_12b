(function(){
  const themeToggle = document.getElementById('themeToggle');
  if(themeToggle){
    themeToggle.addEventListener('click',()=>{
      const isDark = document.documentElement.classList.toggle('dark');
      themeToggle.setAttribute('aria-pressed', String(isDark));
      localStorage.setItem('timeplan-dark', String(isDark));
    });
    const stored = localStorage.getItem('timeplan-dark') === 'true';
    if(stored) document.documentElement.classList.add('dark');
    themeToggle.setAttribute('aria-pressed', String(stored));
  }

  const y = new Date().getFullYear();
  const yEl = document.getElementById('year'); if(yEl) yEl.textContent = y;
  const yEl2 = document.getElementById('year2'); if(yEl2) yEl2.textContent = y;

  function escapeHtml(s){
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function parseISO(s){
    if(!s) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if(!m) return null;
    const dt = new Date(Number(m[1]), Number(m[2])-1, Number(m[3]));
    dt.setHours(0,0,0,0);
    return dt;
  }

  function dateKey(d){
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }

  function isSameDay(a,b){
    return a && b && a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
  }

  function priorityLabel(p){
    if(p === 'high') return 'Augsta';
    if(p === 'medium') return 'Vidēja';
    return 'Zema';
  }

  function loadUsers(){
    try{ return JSON.parse(localStorage.getItem('timeplan-users') || '[]'); }catch(e){ return []; }
  }
  function saveUsers(users){
    localStorage.setItem('timeplan-users', JSON.stringify(users));
  }
  function getSession(){
    try{ return JSON.parse(localStorage.getItem('timeplan-session') || 'null'); }catch(e){ return null; }
  }
  function setSession(session){
    localStorage.setItem('timeplan-session', JSON.stringify(session));
  }
  function clearSession(){
    localStorage.removeItem('timeplan-session');
  }
  function currentUser(){
    const session = getSession();
    if(!session || !session.email) return null;
    const users = loadUsers();
    return users.find(u => u.email === session.email) || null;
  }

  function loadTasks(){
    try{ return JSON.parse(localStorage.getItem('timeplan-tasks') || '[]'); }catch(e){ return []; }
  }
  function saveTasks(tasks){
    localStorage.setItem('timeplan-tasks', JSON.stringify(tasks));
  }

  function startOfWeek(d){
    const x = new Date(d);
    x.setHours(0,0,0,0);
    const day = (x.getDay() + 6) % 7;
    x.setDate(x.getDate() - day);
    return x;
  }
  function endOfWeek(d){
    const s = startOfWeek(d);
    const e = new Date(s);
    e.setDate(e.getDate() + 6);
    e.setHours(0,0,0,0);
    return e;
  }

  function motivationalText(pct,total){
  const t = Number(total||0);
  const p = Number(pct||0);
  if(t === 0) return 'Pievieno uzdevumus, lai sāktu plānot.';
  if(t === 1 && p === 100) return 'Lieliski! Tu esi pabeidzis vienīgo uzdevumu.';
  if(p === 100) return 'Izcili! Tu esi pabeidzis visu plānu.';
  if(p >= 90) return 'Teicami! Atlicis pavisam nedaudz līdz pilnīgai izpildei.';
  if(p >= 80) return 'Tu esi paveicis lielāko daļu no sava plāna. Turpini!';
  if(p >= 60) return 'Labs progress! Turpini strādāt.';
  if(p > 0) return 'Tu esi iesācis. Katrs solis ir svarīgs.';
  return 'Sāc ar pirmo uzdevumu.';
}
function bindAuthUI(){
    const user = currentUser();
    const userBadge = document.getElementById('userBadge');
    const loginLink = document.getElementById('loginLink');
    const registerLink = document.getElementById('registerLink');
    const logoutBtn = document.getElementById('logoutBtn');

    if(user){
      if(userBadge){
        userBadge.textContent = user.name;
        userBadge.style.display = '';
      }
      if(loginLink) loginLink.style.display = 'none';
      if(registerLink) registerLink.style.display = 'none';
      if(logoutBtn){
        logoutBtn.style.display = '';
        if(!logoutBtn.__bound){
          logoutBtn.__bound = true;
          logoutBtn.addEventListener('click', ()=>{
            clearSession();
            bindAuthUI();
            renderAll();
          });
        }
      }
    }else{
      if(userBadge) userBadge.style.display = 'none';
      if(loginLink) loginLink.style.display = '';
      if(registerLink) registerLink.style.display = '';
      if(logoutBtn) logoutBtn.style.display = 'none';
    }

    const authHint = document.getElementById('authHint');
    if(authHint){
      authHint.style.display = user ? 'none' : '';
      if(!user) authHint.textContent = 'Prototipā vari izmantot uzdevumus arī bez konta, bet konts ļauj simulēt pieteikšanos.';
    }
  }

  function bindRegister(){
    const form = document.getElementById('registerForm');
    if(!form) return;
    const msg = document.getElementById('regMsg');

    form.addEventListener('submit', e=>{
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim().toLowerCase();
      const password = document.getElementById('regPassword').value;

      if(!name || !email || !password){
        if(msg) msg.textContent = 'Aizpildi visus laukus.';
        return;
      }

      const users = loadUsers();
      if(users.some(u => u.email === email)){
        if(msg) msg.textContent = 'Šāds e-pasts jau ir reģistrēts.';
        return;
      }

      users.push({ name, email, password });
      saveUsers(users);
      setSession({ email });
      if(msg) msg.textContent = 'Konts izveidots. Tu esi pieteicies.';
      bindAuthUI();
      setTimeout(()=>{ window.location.href = 'index.html'; }, 600);
    });
  }

  function bindLogin(){
    const form = document.getElementById('loginForm');
    if(!form) return;
    const msg = document.getElementById('loginMsg');

    form.addEventListener('submit', e=>{
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      const password = document.getElementById('loginPassword').value;

      const users = loadUsers();
      const user = users.find(u => u.email === email && u.password === password);
      if(!user){
        if(msg) msg.textContent = 'Nepareizs e-pasts vai parole.';
        return;
      }
      setSession({ email });
      if(msg) msg.textContent = 'Pieteikšanās veiksmīga.';
      bindAuthUI();
      setTimeout(()=>{ window.location.href = 'index.html'; }, 400);
    });
  }

  function renderTodayPlan(){
    const listEl = document.getElementById('todayList');
    const sumEl = document.getElementById('todaySummary');
    const msgEl = document.getElementById('todayMessage');
    if(!listEl || !sumEl) return;

    const tasks = loadTasks();
    const today = new Date();
    today.setHours(0,0,0,0);
    const key = dateKey(today);
    const todayTasks = tasks.filter(t => (t.date || '') === key);

    listEl.innerHTML = '';
    if(todayTasks.length === 0){
      listEl.innerHTML = '<li class="muted">Šodien nav pievienotu uzdevumu.</li>';
      sumEl.textContent = 'Pievieno uzdevumu sadaļā “Uzdevumi”, lai tas parādītos šeit.';
      if(msgEl) msgEl.style.display = 'none';
      return;
    }

    todayTasks.slice(0,6).forEach(t=>{
      const pr = t.priority || 'medium';
      const subject = t.subject ? escapeHtml(t.subject) : '—';
      const li = document.createElement('li');
      const prText = (pr === 'high') ? 'augsta prioritāte' : (pr === 'medium') ? 'vidēja prioritāte' : 'zema prioritāte';
      const titleText = escapeHtml(t.title || 'Uzdevums');
      li.innerHTML = `<strong>Uzdevums: ${subject} — <span class=\"prio-inline ${pr}\">${prText}</span></strong>`
        + `<div class="muted small">Nosaukums: ${titleText}</div>`;
      listEl.appendChild(li);
    });

    const done = todayTasks.filter(t=>t.done).length;
    sumEl.textContent = `Pabeigti ${done} no ${todayTasks.length} uzdevumiem`;

    const wkStart = startOfWeek(today);
    const wkEnd = endOfWeek(today);
    const weekTasks = tasks.filter(t=>{
      const d = parseISO(t.date);
      return d && d >= wkStart && d <= wkEnd;
    });
    const weekTotal = weekTasks.length;
    const weekDone = weekTasks.filter(t=>t.done).length;
    const pct = weekTotal === 0 ? 0 : Math.round(weekDone / weekTotal * 100);

    if(msgEl){
      msgEl.textContent = motivationalText(pct, weekTotal);
      msgEl.style.display = '';
    }
  }

  function renderTasksPage(){
    const taskForm = document.getElementById('taskForm');
    const taskList = document.getElementById('taskList');
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.getElementById('progressText');
    const searchInput = document.getElementById('searchInput');
    const subjectFilter = document.getElementById('subjectFilter');
    const dueFilter = document.getElementById('dueFilter');
    const clearFilters = document.getElementById('clearFilters');
    const weekMessage = document.getElementById('weekMessage');

    if(!taskForm || !taskList) return;

    let tasks = loadTasks();
    let filters = { q:'', subject:'', due:'all' };

    function rebuildSubjectOptions(){
      if(!subjectFilter) return;
      const subjects = Array.from(new Set(tasks.map(t=>String(t.subject||'').trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b));
      const current = subjectFilter.value || '';
      subjectFilter.innerHTML = '<option value="">Visi priekšmeti</option>' + subjects.map(s=>`<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
      subjectFilter.value = current;
    }

    function applyFilters(list){
      const today = new Date(); today.setHours(0,0,0,0);
      const in7 = new Date(today); in7.setDate(in7.getDate()+7);

      let out = list.slice();
      if(filters.q){
        const q = filters.q.toLowerCase();
        out = out.filter(t => String(t.title||'').toLowerCase().includes(q));
      }
      if(filters.subject){
        out = out.filter(t => String(t.subject||'').trim() === filters.subject);
      }
      if(filters.due && filters.due !== 'all'){
        if(filters.due === 'nodate'){
          out = out.filter(t => !parseISO(t.date));
        }else if(filters.due === 'overdue'){
          out = out.filter(t => {
            const d = parseISO(t.date);
            return d && d < today && !t.done;
          });
        }else if(filters.due === 'today'){
          const key = dateKey(today);
          out = out.filter(t => (t.date||'') === key);
        }else if(filters.due === 'next7'){
          out = out.filter(t=>{
            const d = parseISO(t.date);
            return d && d >= today && d <= in7 && !t.done;
          });
        }
      }
      return out;
    }

    function renderList(){
      tasks = loadTasks();
      rebuildSubjectOptions();
      const filtered = applyFilters(tasks);

      taskList.innerHTML = '';
      filtered.forEach(t=>{
        const idx = tasks.indexOf(t);
        const li = document.createElement('li');
        const pr = t.priority || 'medium';
        const subject = escapeHtml(t.subject || '—');
        const dateText = t.date ? t.date : 'bez datuma';
        li.innerHTML = `
          <div class="title">
            <strong>${escapeHtml(t.title)}</strong>
            <div class="meta-row muted small">
              <span>${subject}</span>
              <span>${escapeHtml(dateText)}</span>
              <span class="chip ${pr}">${priorityLabel(pr)}</span>
            </div>
          </div>
          <div class="actions">
            <button data-idx="${idx}" class="btn small toggle" type="button">${t.done ? 'Atsaukt' : 'Pabeigt'}</button>
            <button data-idx="${idx}" class="btn small del" type="button">Dzēst</button>
          </div>
        `;
        if(t.done) li.style.opacity = '0.65';
        taskList.appendChild(li);
      });

      taskList.querySelectorAll('.toggle').forEach(b=>b.addEventListener('click', e=>{
        const i = +e.currentTarget.getAttribute('data-idx');
        const all = loadTasks();
        if(all[i]){
          all[i].done = !all[i].done;
          saveTasks(all);
          renderAll();
        }
      }));
      taskList.querySelectorAll('.del').forEach(b=>b.addEventListener('click', e=>{
        const i = +e.currentTarget.getAttribute('data-idx');
        const all = loadTasks();
        if(all[i]){
          all.splice(i,1);
          saveTasks(all);
          renderAll();
        }
      }));

      const total = tasks.length || 0;
      const done = tasks.filter(t=>t.done).length;
      const pct = total===0 ? 0 : Math.round(done/total*100);
      if(progressFill) progressFill.style.width = pct + '%';
      if(progressText) progressText.textContent = pct + '% pabeigts';

      const today = new Date(); today.setHours(0,0,0,0);
      const ws = startOfWeek(today);
      const we = endOfWeek(today);
      const weekTasks = tasks.filter(t=>{
        const d = parseISO(t.date);
        return d && d >= ws && d <= we;
      });
      const wTotal = weekTasks.length;
      const wDone = weekTasks.filter(t=>t.done).length;
      const wPct = wTotal===0 ? 0 : Math.round(wDone/wTotal*100);
      if(weekMessage){
        weekMessage.textContent = motivationalText(wPct, wTotal);
        weekMessage.style.display = '';
      }
    }

    taskForm.addEventListener('submit', e=>{
      e.preventDefault();
      const title = document.getElementById('taskTitle').value.trim();
      const subject = document.getElementById('taskSubject').value.trim();
      const dateVal = document.getElementById('taskDate').value;
      const priority = document.getElementById('taskPriority').value;
      if(!title || !subject) return;

      const all = loadTasks();
      all.push({ title, subject, date:dateVal, priority, done:false });
      saveTasks(all);

      document.getElementById('taskTitle').value = '';
      document.getElementById('taskSubject').value = '';
      document.getElementById('taskDate').value = '';
      renderAll();
    });

    function bindFilters(){
      if(searchInput && !searchInput.__bound){
        searchInput.__bound = true;
        searchInput.addEventListener('input', ()=>{
          filters.q = searchInput.value.trim();
          renderList();
        });
      }
      if(subjectFilter && !subjectFilter.__bound){
        subjectFilter.__bound = true;
        subjectFilter.addEventListener('change', ()=>{
          filters.subject = subjectFilter.value;
          renderList();
        });
      }
      if(dueFilter && !dueFilter.__bound){
        dueFilter.__bound = true;
        dueFilter.addEventListener('change', ()=>{
          filters.due = dueFilter.value;
          renderList();
        });
      }
      if(clearFilters && !clearFilters.__bound){
        clearFilters.__bound = true;
        clearFilters.addEventListener('click', ()=>{
          filters = { q:'', subject:'', due:'all' };
          if(searchInput) searchInput.value = '';
          if(subjectFilter) subjectFilter.value = '';
          if(dueFilter) dueFilter.value = 'all';
          renderList();
        });
      }
    }

    bindFilters();
    renderList();
  }

  function renderStatistics(){
    const doneCount = document.getElementById('doneCount');
    const totalCount = document.getElementById('totalCount');
    const completionRate = document.getElementById('completionRate');
    const overdueCount = document.getElementById('overdueCount');
    const upcoming7Count = document.getElementById('upcoming7Count');
    const withDateCount = document.getElementById('withDateCount');

    const barHigh = document.getElementById('barHigh');
    const barMed = document.getElementById('barMed');
    const barLow = document.getElementById('barLow');
    const barHighVal = document.getElementById('barHighVal');
    const barMedVal = document.getElementById('barMedVal');
    const barLowVal = document.getElementById('barLowVal');
    const statsHint = document.getElementById('statsHint');

    const statsPresent = doneCount || totalCount || completionRate || barHigh || barMed || barLow;
    if(!statsPresent) return;

    const tasks = loadTasks();
    const total = tasks.length;
    const done = tasks.filter(t=>t.done).length;
    const pct = total === 0 ? 0 : Math.round(done/total*100);

    const today = new Date(); today.setHours(0,0,0,0);
    const in7 = new Date(today); in7.setDate(in7.getDate() + 7);

    const dated = tasks.filter(t=>!!parseISO(t.date));
    const overdue = dated.filter(t=>{
      const d = parseISO(t.date);
      return d && d < today && !t.done;
    }).length;

    const upcoming7 = dated.filter(t=>{
      const d = parseISO(t.date);
      return d && d >= today && d <= in7 && !t.done;
    }).length;

    const high = tasks.filter(t=>t.priority==='high').length;
    const med = tasks.filter(t=>(t.priority==='medium' || !t.priority)).length;
    const low = tasks.filter(t=>t.priority==='low').length;

    if(doneCount) doneCount.textContent = String(done);
    if(totalCount) totalCount.textContent = String(total);
    if(completionRate) completionRate.textContent = pct + '%';
    if(overdueCount) overdueCount.textContent = String(overdue);
    if(upcoming7Count) upcoming7Count.textContent = String(upcoming7);
    if(withDateCount) withDateCount.textContent = String(dated.length);

    const max = Math.max(high, med, low, 1);
    const wH = Math.round((high / max) * 100);
    const wM = Math.round((med / max) * 100);
    const wL = Math.round((low / max) * 100);

    if(barHigh) barHigh.style.width = wH + '%';
    if(barMed) barMed.style.width = wM + '%';
    if(barLow) barLow.style.width = wL + '%';
    if(barHighVal) barHighVal.textContent = String(high);
    if(barMedVal) barMedVal.textContent = String(med);
    if(barLowVal) barLowVal.textContent = String(low);

    if(statsHint){
      const ws = startOfWeek(today);
      const we = endOfWeek(today);
      const weekTasks = tasks.filter(t=>{
        const d = parseISO(t.date);
        return d && d >= ws && d <= we;
      });
      const wTotal = weekTasks.length;
      const wDone = weekTasks.filter(t=>t.done).length;
      const wPct = wTotal === 0 ? 0 : Math.round(wDone / wTotal * 100);

      if(total === 0){
        statsHint.textContent = 'Pievieno uzdevumus sadaļā “Uzdevumi”, lai redzētu statistiku.';
      }else{
        statsHint.textContent = motivationalText(wPct, wTotal);
      }
    }
  }

  function renderCalendar(){
    const grid = document.getElementById('calendarGrid');
    const label = document.getElementById('calMonthLabel');
    const prev = document.getElementById('calPrev');
    const next = document.getElementById('calNext');
    const selectedTitle = document.getElementById('selectedDateTitle');
    const selectedMeta = document.getElementById('selectedDateMeta');
    const dueList = document.getElementById('dueList');
    const dueEmpty = document.getElementById('dueEmpty');

    if(!grid || !label) return;

    const monthNames = ['Janvāris','Februāris','Marts','Aprīlis','Maijs','Jūnijs','Jūlijs','Augusts','Septembris','Oktobris','Novembris','Decembris'];
    const weekdays = ['Pr','Ot','Tr','Ce','Pk','Se','Sv'];

    const tasks = loadTasks();
    const tasksByDate = new Map();
    tasks.forEach(t=>{
      const d = parseISO(t.date);
      if(!d) return;
      const k = dateKey(d);
      if(!tasksByDate.has(k)) tasksByDate.set(k, []);
      tasksByDate.get(k).push(t);
    });

    const state = window.__timeplanCalState || (window.__timeplanCalState = {});
    if(!state.viewDate){
      const now = new Date();
      now.setHours(0,0,0,0);
      state.viewDate = new Date(now.getFullYear(), now.getMonth(), 1);
      state.selected = null;
    }

    function setSelected(d){
      state.selected = d;
      updateSide();
      render();
    }

    function updateSide(){
      if(!selectedTitle || !dueList || !dueEmpty) return;
      if(!state.selected){
        selectedTitle.textContent = 'Izvēlies datumu';
        if(selectedMeta) selectedMeta.textContent = '';
        dueList.innerHTML = '';
        dueEmpty.style.display = 'none';
        return;
      }

      const k = dateKey(state.selected);
      const list = tasksByDate.get(k) || [];
      const dd = String(state.selected.getDate()).padStart(2,'0');
      const mm = String(state.selected.getMonth()+1).padStart(2,'0');
      const yyyy = state.selected.getFullYear();
      selectedTitle.textContent = `${dd}.${mm}.${yyyy}`;
      if(selectedMeta) selectedMeta.textContent = list.length ? `Uzdevumi: ${list.length}` : '';
      dueList.innerHTML = '';
      if(list.length === 0){
        dueEmpty.style.display = 'block';
        return;
      }
      dueEmpty.style.display = 'none';

      list.forEach((t, idx)=>{
        const li = document.createElement('li');
        const pr = t.priority || 'medium';
        const subj = escapeHtml(t.subject || '—');
        li.innerHTML = `
          <div class="left">
            <div class="title">${escapeHtml(t.title)}</div>
            <div class="meta muted small">${subj} • <span class="chip ${pr}">${priorityLabel(pr)}</span></div>
          </div>
          <div>
            <button class="btn small dueToggle" type="button" data-date="${k}" data-idx="${idx}">${t.done ? 'Atsaukt' : 'Pabeigt'}</button>
          </div>
        `;
        if(t.done) li.style.opacity = '0.65';
        dueList.appendChild(li);
      });

      dueList.querySelectorAll('.dueToggle').forEach(btn=>{
        btn.addEventListener('click', e=>{
          const k = e.currentTarget.getAttribute('data-date');
          const i = Number(e.currentTarget.getAttribute('data-idx'));
          const list = tasksByDate.get(k) || [];
          const target = list[i];
          if(!target) return;
          const all = loadTasks();
          const idx = all.findIndex(x => x.title === target.title && x.date === target.date && String(x.subject||'') === String(target.subject||''));
          if(idx >= 0){
            all[idx].done = !all[idx].done;
            saveTasks(all);
            renderAll();
          }
        });
      });
    }

    function render(){
      const view = state.viewDate;
      label.textContent = `${monthNames[view.getMonth()]} ${view.getFullYear()}`;

      grid.innerHTML = '';
      weekdays.forEach(w=>{
        const el = document.createElement('div');
        el.className = 'cal-weekday';
        el.textContent = w;
        grid.appendChild(el);
      });

      const first = new Date(view.getFullYear(), view.getMonth(), 1);
      const last = new Date(view.getFullYear(), view.getMonth()+1, 0);
      const firstWeekday = (first.getDay() + 6) % 7;
      const today = new Date();
      today.setHours(0,0,0,0);

      for(let i=0;i<firstWeekday;i++){
        const empty = document.createElement('div');
        empty.className = 'cal-day is-out';
        empty.setAttribute('aria-hidden','true');
        grid.appendChild(empty);
      }

      for(let d=1; d<=last.getDate(); d++){
        const dayDate = new Date(view.getFullYear(), view.getMonth(), d);
        dayDate.setHours(0,0,0,0);
        const k = dateKey(dayDate);
        const list = tasksByDate.get(k) || [];

        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'cal-day';
        if(isSameDay(dayDate, today)) el.classList.add('is-today');
        const isSel = state.selected && isSameDay(dayDate, state.selected);
        el.setAttribute('aria-selected', isSel ? 'true' : 'false');

        const high = list.filter(t=>t.priority==='high').length;
        const med = list.filter(t=>(t.priority==='medium' || !t.priority)).length;
        const low = list.filter(t=>t.priority==='low').length;

        const badges = [];
        if(high) badges.push(`<span class="badge high">${high}</span>`);
        if(med) badges.push(`<span class="badge medium">${med}</span>`);
        if(low) badges.push(`<span class="badge low">${low}</span>`);

        el.innerHTML = `<div class="cal-day-num">${d}</div><div class="badges">${badges.join('')}</div>`;
        el.addEventListener('click', ()=>{ setSelected(dayDate); });
        grid.appendChild(el);
      }

      updateSide();
    }

    if(prev && !prev.__bound){
      prev.__bound = true;
      prev.addEventListener('click', ()=>{
        const v = state.viewDate;
        state.viewDate = new Date(v.getFullYear(), v.getMonth()-1, 1);
        render();
      });
    }
    if(next && !next.__bound){
      next.__bound = true;
      next.addEventListener('click', ()=>{
        const v = state.viewDate;
        state.viewDate = new Date(v.getFullYear(), v.getMonth()+1, 1);
        render();
      });
    }

    render();
  }

  function bindBurger(){
    document.querySelectorAll('.burger').forEach(b=>{
      if(b.__bound) return;
      b.__bound = true;
      b.addEventListener('click', ()=>{
        const nav = document.querySelector('.main-nav');
        if(!nav) return;
        nav.style.display = (nav.style.display === 'block') ? '' : 'block';
      });
    });
  }

  function renderAll(){
    bindAuthUI();
    renderTasksPage();
    renderStatistics();
    renderCalendar();
    renderTodayPlan();
  }

  bindAuthUI();
  bindRegister();
  bindLogin();
  renderAll();
  bindBurger();

  window.addEventListener('storage', e=>{
    if(e.key === 'timeplan-tasks') renderAll();
    if(e.key === 'timeplan-session' || e.key === 'timeplan-users') bindAuthUI();
    if(e.key === 'timeplan-dark'){
      const stored = localStorage.getItem('timeplan-dark') === 'true';
      document.documentElement.classList.toggle('dark', stored);
      if(themeToggle) themeToggle.setAttribute('aria-pressed', String(stored));
    }
  });
})();

function motivationalText(pct,total){
  const t = Number(total||0);
  const p = Number(pct||0);
  if(t === 0) return 'Pievieno uzdevumus, lai sāktu plānot.';
  if(t === 1 && p === 100) return 'Lieliski! Tu esi pabeidzis vienīgo uzdevumu.';
  if(p === 100) return 'Izcili! Tu esi pabeidzis visu plānu.';
  if(p >= 90) return 'Teicami! Atlicis pavisam nedaudz līdz pilnīgai izpildei.';
  if(p >= 80) return 'Tu esi paveicis lielāko daļu no sava plāna. Turpini!';
  if(p >= 60) return 'Labs progress! Turpini strādāt.';
  if(p > 0) return 'Tu esi iesācis. Katrs solis ir svarīgs.';
  return 'Sāc ar pirmo uzdevumu.';
}
