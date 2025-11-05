(() => {
  const API_BASE = '';
  
  // DOM元素
  const listEl = document.getElementById('ticket-list');
  const titleEl = document.getElementById('detail-title');
  const contentEl = document.getElementById('detail-content');
  const selectEl = document.getElementById('label-select');
  const submitBtn = document.getElementById('submit-label');
  const currentLabelEl = document.getElementById('current-label');
  const statLabeledEl = document.getElementById('stat-labeled');
  const statUnlabeledEl = document.getElementById('stat-unlabeled');
  const statTotalEl = document.getElementById('stat-total');
  const pieCanvas = document.getElementById('pie-canvas');
  const legendEl = document.getElementById('legend');
  const newLabelInput = document.getElementById('new-label-input');
  const addLabelBtn = document.getElementById('add-label-btn');
  const csvInput = document.getElementById('csv-input');
  const btnImportCsv = document.getElementById('btn-import-csv');
  const btnToggleAdd = document.getElementById('btn-toggle-add');
  const manualAdd = document.getElementById('manual-add');
  const addTitle = document.getElementById('add-title');
  const addContent = document.getElementById('add-content');
  const addLabelSelect = document.getElementById('add-label-select');
  const addLabelNew = document.getElementById('add-label-new');
  const btnAddTicket = document.getElementById('btn-add-ticket');
  const nextIdDisplay = document.getElementById('next-id-display');

  // 数据状态
  let tickets = [];
  let labels = [];
  let labelColors = {};
  let activeId = null;

  // ============ API调用 ============
  async function apiGet(url) {
    try {
      const res = await fetch(`${API_BASE}${url}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('响应不是JSON格式');
      }
      const data = await res.json();
      if (data.success) return data;
      throw new Error(data.message || '请求失败');
    } catch (e) {
      console.error('API GET错误:', url, e);
      const message = e.message || '网络错误，请检查后端服务是否启动';
      showToast(message, 'error');
      throw e;
    }
  }

  async function apiPost(url, body) {
    try {
      const res = await fetch(`${API_BASE}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('响应不是JSON格式');
      }
      const data = await res.json();
      if (data.success) return data;
      throw new Error(data.message || '请求失败');
    } catch (e) {
      console.error('API POST错误:', url, e);
      const message = e.message || '网络错误，请检查后端服务是否启动';
      showToast(message, 'error');
      throw e;
    }
  }

  async function apiPut(url, body) {
    try {
      const res = await fetch(`${API_BASE}${url}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('响应不是JSON格式');
      }
      const data = await res.json();
      if (data.success) return data;
      throw new Error(data.message || '请求失败');
    } catch (e) {
      console.error('API PUT错误:', url, e);
      const message = e.message || '网络错误，请检查后端服务是否启动';
      showToast(message, 'error');
      throw e;
    }
  }

  async function apiPostForm(url, formData) {
    try {
      const res = await fetch(`${API_BASE}${url}`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('响应不是JSON格式');
      }
      const data = await res.json();
      if (data.success) return data;
      throw new Error(data.message || '请求失败');
    } catch (e) {
      console.error('API POST Form错误:', url, e);
      const message = e.message || '网络错误，请检查后端服务是否启动';
      showToast(message, 'error');
      throw e;
    }
  }

  // ============ 数据加载 ============
  async function loadTickets() {
    try {
      const data = await apiGet('/api/tickets');
      tickets = data.data || [];
      renderList();
      if (tickets.length > 0 && !activeId) {
        activeId = tickets[0].id;
        renderDetail();
      }
      renderStats();
    } catch (e) {
      console.error('加载工单失败:', e);
    }
  }

  async function loadLabels() {
    try {
      const data = await apiGet('/api/labels');
      labels = data.data || [];
      labelColors = data.colors || {};
      hydrateLabelSelect(selectEl);
      hydrateLabelSelect(addLabelSelect, true);
    } catch (e) {
      console.error('加载标签失败:', e);
    }
  }

  async function loadNextId() {
    try {
      const data = await apiGet('/api/next-id');
      if (nextIdDisplay) nextIdDisplay.textContent = data.data;
    } catch (e) {
      console.error('加载下一个ID失败:', e);
    }
  }

  // ============ 工具函数 ============
  function byId(id) {
    return tickets.find(t => t.id === id);
  }

  function fmtLabel(label) {
    return label || '空';
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s reverse';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  // ============ 渲染 ============
  function renderList() {
    listEl.innerHTML = '';
    tickets.forEach(t => {
      const item = document.createElement('div');
      item.className = 'item' + (t.id === activeId ? ' active' : '');
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', String(t.id === activeId));
      
      const labelBadge = t.label 
        ? `<span class="label-badge" style="background: ${getColorForLabel(t.label)}20; color: ${getColorForLabel(t.label)};">${escapeHtml(t.label)}</span>`
        : '<span class="label-badge">未打标</span>';
      
      item.innerHTML = `
        <div class="title">#${t.id} ${escapeHtml(t.title)}</div>
        <div class="meta">${labelBadge}</div>
      `;
      item.addEventListener('click', () => {
        activeId = t.id;
        renderDetail();
        renderList();
      });
      listEl.appendChild(item);
    });
  }

  function renderDetail() {
    const t = byId(activeId);
    if (!t) {
      titleEl.textContent = '请选择左侧工单';
      contentEl.textContent = '';
      hydrateLabelSelect(selectEl);
      selectEl.value = '';
      submitBtn.disabled = true;
      currentLabelEl.innerHTML = '当前标签：<strong>空</strong>';
      return;
    }
    titleEl.textContent = `#${t.id} ${t.title}`;
    contentEl.textContent = t.content;
    hydrateLabelSelect(selectEl);
    selectEl.value = t.label || '';
    submitBtn.disabled = false;
    currentLabelEl.innerHTML = `当前标签：<strong>${fmtLabel(t.label)}</strong>`;
  }

  function hydrateLabelSelect(sel, includeEmpty) {
    if (!sel) return;
    sel.innerHTML = '';
    if (includeEmpty) {
      const op0 = document.createElement('option');
      op0.value = '';
      op0.textContent = '（可留空）';
      sel.appendChild(op0);
    } else {
      const op = document.createElement('option');
      op.value = '';
      op.textContent = '未选择';
      sel.appendChild(op);
    }
    labels.forEach(l => {
      const op = document.createElement('option');
      op.value = l;
      op.textContent = l;
      sel.appendChild(op);
    });
  }

  // ============ 提交打标 ============
  submitBtn.addEventListener('click', async () => {
    const t = byId(activeId);
    if (!t) return;
    
    const val = selectEl.value;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '提交中<span class="loading"></span>';
    
    try {
      await apiPut(`/api/tickets/${t.id}/label`, { label: val || '' });
      t.label = val || null;
      await loadLabels(); // 重新加载标签（可能新增了标签）
      renderDetail();
      renderList();
      renderStats();
      showToast('打标成功', 'success');
    } catch (e) {
      showToast('打标失败: ' + e.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '提交打标';
    }
  });

  // ============ 标签管理 ============
  addLabelBtn && addLabelBtn.addEventListener('click', async () => {
    const name = (newLabelInput.value || '').trim();
    if (!name) {
      showToast('请输入标签名称', 'error');
      return;
    }
    if (labels.includes(name)) {
      selectEl.value = name;
      showToast('标签已存在', 'success');
      return;
    }
    
    addLabelBtn.disabled = true;
    addLabelBtn.innerHTML = '添加中<span class="loading"></span>';
    
    try {
      await apiPost('/api/labels', { name });
      await loadLabels();
      hydrateLabelSelect(selectEl);
      hydrateLabelSelect(addLabelSelect, true);
      selectEl.value = name;
      newLabelInput.value = '';
      showToast('标签添加成功', 'success');
    } catch (e) {
      showToast('添加失败: ' + e.message, 'error');
    } finally {
      addLabelBtn.disabled = false;
      addLabelBtn.innerHTML = '添加标签';
    }
  });

  // ============ CSV导入 ============
  btnImportCsv && btnImportCsv.addEventListener('click', async () => {
    const file = csvInput && csvInput.files && csvInput.files[0];
    if (!file) {
      showToast('请先选择CSV文件', 'error');
      return;
    }
    
    btnImportCsv.disabled = true;
    btnImportCsv.innerHTML = '导入中<span class="loading"></span>';
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await apiPostForm('/api/tickets/import', formData);
      await loadTickets();
      await loadLabels();
      await loadNextId();
      showToast(data.message || '导入成功', 'success');
      csvInput.value = '';
    } catch (e) {
      showToast('导入失败: ' + e.message, 'error');
    } finally {
      btnImportCsv.disabled = false;
      btnImportCsv.innerHTML = '导入 CSV';
    }
  });

  // ============ 手工新增工单 ============
  btnToggleAdd && btnToggleAdd.addEventListener('click', () => {
    if (!manualAdd) return;
    manualAdd.style.display = manualAdd.style.display === 'none' ? 'block' : 'none';
    hydrateLabelSelect(addLabelSelect, true);
    loadNextId();
  });

  btnAddTicket && btnAddTicket.addEventListener('click', async () => {
    const title = (addTitle && addTitle.value || '').trim();
    const content = (addContent && addContent.value || '').trim();
    const chosen = addLabelSelect ? addLabelSelect.value : '';
    const custom = (addLabelNew && addLabelNew.value || '').trim();
    
    if (!title) {
      showToast('请输入标题', 'error');
      return;
    }
    if (!content) {
      showToast('请输入内容', 'error');
      return;
    }
    
    btnAddTicket.disabled = true;
    btnAddTicket.innerHTML = '创建中<span class="loading"></span>';
    
    try {
      const label = custom || chosen || '';
      await apiPost('/api/tickets', { title, content, label: label || '' });
      await loadTickets();
      await loadLabels();
      await loadNextId();
      
      if (addTitle) addTitle.value = '';
      if (addContent) addContent.value = '';
      if (addLabelSelect) addLabelSelect.value = '';
      if (addLabelNew) addLabelNew.value = '';
      
      showToast('工单创建成功', 'success');
    } catch (e) {
      showToast('创建失败: ' + e.message, 'error');
    } finally {
      btnAddTicket.disabled = false;
      btnAddTicket.innerHTML = '创建';
    }
  });

  // ============ 统计与饼图 ============
  function computeStats() {
    const total = tickets.length;
    const labeled = tickets.filter(t => t.label).length;
    const unlabeled = total - labeled;
    const dist = {};
    labels.forEach(l => dist[l] = 0);
    tickets.forEach(t => {
      if (t.label) dist[t.label] = (dist[t.label] || 0) + 1;
    });
    return { total, labeled, unlabeled, dist };
  }

  function renderStats() {
    const { total, labeled, unlabeled, dist } = computeStats();
    statTotalEl.textContent = total;
    statLabeledEl.textContent = labeled;
    statUnlabeledEl.textContent = unlabeled;
    drawPie(dist, unlabeled);
    renderLegend(dist, unlabeled);
  }

  function getColorForLabel(name) {
    if (labelColors[name]) return labelColors[name];
    // 生成颜色
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    const hue = h % 360;
    const color = `hsl(${hue}, 65%, 55%)`;
    labelColors[name] = color;
    return color;
  }

  function drawPie(dist, unlabeled) {
    const ctx = pieCanvas.getContext('2d');
    const W = pieCanvas.width;
    const H = pieCanvas.height;
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2;
    const cy = H / 2;
    const r = Math.min(W, H) / 2 - 10;
    const total = Object.values(dist).reduce((a, b) => a + b, 0) + unlabeled;
    
    if (total === 0) {
      ctx.fillStyle = '#f0f0f0';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    
    let start = -Math.PI / 2;
    const slices = [
      ...labels.map(l => ({ name: l, value: dist[l] || 0, color: getColorForLabel(l) })),
      { name: '未打标', value: unlabeled, color: '#d9d9d9' }
    ].filter(s => s.value > 0);
    
    slices.forEach(s => {
      const ang = (s.value / total) * Math.PI * 2;
      const end = start + ang;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = s.color;
      ctx.fill();
      
      // 添加边框
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      start = end;
    });
  }

  function renderLegend(dist, unlabeled) {
    legendEl.innerHTML = '';
    const total = Object.values(dist).reduce((a, b) => a + b, 0) + unlabeled;
    const entries = [
      ...labels.map(l => ({ name: l, value: dist[l] || 0, color: getColorForLabel(l) })),
      { name: '未打标', value: unlabeled, color: '#d9d9d9' }
    ];
    
    entries.forEach(e => {
      const pct = total === 0 ? 0 : Math.round(e.value * 1000 / total) / 10;
      const el = document.createElement('div');
      el.className = 'legend-item';
      el.innerHTML = `
        <span class="dot" style="background:${e.color}"></span>
        <span style="flex:1;">${e.name}</span>
        <span style="font-weight:600;">${e.value}</span>
        <span style="color:#6c757d;">(${pct}%)</span>
      `;
      legendEl.appendChild(el);
    });
  }

  // ============ 连接检查 ============
  async function checkConnection() {
    try {
      const res = await fetch(`${API_BASE}/api/next-id`, { method: 'GET' });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  // ============ 初始化 ============
  async function init() {
    // 检查后端连接
    const isConnected = await checkConnection();
    if (!isConnected) {
      showToast('无法连接到后端服务，请确保已启动Python后端 (python app.py)', 'error');
      console.error('后端服务未启动或无法访问');
      // 即使后端未启动，也显示空界面
      renderList();
      renderStats();
      return;
    }
    
    try {
      await loadLabels();
      await loadTickets();
      await loadNextId();
      
      // 定期刷新下一个ID
      setInterval(loadNextId, 5000);
    } catch (e) {
      console.error('初始化失败:', e);
      showToast('初始化失败，请检查后端服务', 'error');
    }
  }

  init();
})();
