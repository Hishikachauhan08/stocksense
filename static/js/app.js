const API = '/api';
let token = localStorage.getItem('ss_token');
let currentUser = JSON.parse(localStorage.getItem('ss_user') || 'null');
let currentPage = 'dashboard';
let warehouses = [];
let categories = [];
let products = [];

// ========== UTILS ==========
function toast(msg, type = 'info') {
  const colors = { info: 'bg-brand-600', success: 'bg-emerald-600', error: 'bg-red-600', warn: 'bg-amber-600' };
  const el = document.createElement('div');
  el.className = `toast px-5 py-3 rounded-xl text-sm font-medium text-white shadow-lg ${colors[type] || colors.info}`;
  el.textContent = msg;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(API + path, { ...opts, headers });
  if (res.status === 401) { logout(); throw new Error('Unauthorized'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.message || 'Request failed');
  return data;
}

function statusBadge(s) {
  const cls = { Draft: 'status-draft', Waiting: 'status-waiting', Ready: 'status-ready', Done: 'status-done', Canceled: 'status-canceled' }[s] || 'status-draft';
  return `<span class="px-2.5 py-1 rounded-full text-xs font-medium text-white ${cls}">${s}</span>`;
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); document.getElementById('modal').classList.remove('flex'); }
function openModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('modal').classList.add('flex');
}

// ========== AUTH ==========
function switchAuthTab(tab) {
  ['login', 'register', 'forgot'].forEach(t => {
    document.getElementById(`form-${t}`).classList.toggle('hidden', t !== tab);
    const btn = document.getElementById(`tab-${t}`);
    if (t === tab) { btn.classList.add('bg-brand-600', 'text-white'); btn.classList.remove('text-slate-400'); }
    else { btn.classList.remove('bg-brand-600', 'text-white'); btn.classList.add('text-slate-400'); }
  });
}

async function handleLogin(e) {
  e.preventDefault();
  try {
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: document.getElementById('login-email').value, password: document.getElementById('login-password').value }) });
    token = data.access_token;
    currentUser = data.user;
    localStorage.setItem('ss_token', token);
    localStorage.setItem('ss_user', JSON.stringify(currentUser));
    showApp();
    toast('Welcome back!', 'success');
  } catch (err) { toast(err.message, 'error'); }
}

async function handleRegister(e) {
  e.preventDefault();
  try {
    await api('/auth/register', { method: 'POST', body: JSON.stringify({
      email: document.getElementById('reg-email').value,
      username: document.getElementById('reg-username').value,
      password: document.getElementById('reg-password').value,
      full_name: document.getElementById('reg-name').value
    }) });
    toast('Account created! Please login.', 'success');
    switchAuthTab('login');
  } catch (err) { toast(err.message, 'error'); }
}

async function handleForgot(e) {
  e.preventDefault();
  try {
    const data = await api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: document.getElementById('forgot-email').value }) });
    document.getElementById('otp-display').textContent = `Demo OTP: ${data.otp}`;
    document.getElementById('forgot-step1').classList.add('hidden');
    document.getElementById('forgot-step2').classList.remove('hidden');
    toast('OTP generated (demo)', 'info');
  } catch (err) { toast(err.message, 'error'); }
}

async function handleReset() {
  try {
    await api('/auth/reset-password', { method: 'POST', body: JSON.stringify({
      email: document.getElementById('forgot-email').value,
      otp: document.getElementById('forgot-otp').value,
      new_password: document.getElementById('forgot-newpass').value
    }) });
    toast('Password reset! Login now.', 'success');
    switchAuthTab('login');
    document.getElementById('forgot-step1').classList.remove('hidden');
    document.getElementById('forgot-step2').classList.add('hidden');
  } catch (err) { toast(err.message, 'error'); }
}

function logout() {
  token = null; currentUser = null;
  localStorage.removeItem('ss_token'); localStorage.removeItem('ss_user');
  document.getElementById('app-shell').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
}

function showApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  if (currentUser) {
    document.getElementById('user-name').textContent = currentUser.full_name || currentUser.username;
    document.getElementById('user-role').textContent = currentUser.role;
    document.getElementById('user-avatar').textContent = (currentUser.full_name || currentUser.username || 'U')[0].toUpperCase();
  }
  loadLookups().then(() => navigate('dashboard'));
}

async function loadLookups() {
  try {
    warehouses = await api('/warehouses');
    categories = await api('/categories');
    products = await api('/products');
  } catch (e) { console.error(e); }
}

// ========== NAV ==========
function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.sidebar-item').forEach(b => {
    b.classList.toggle('active', b.dataset.page === page);
    b.classList.toggle('text-slate-400', b.dataset.page !== page);
  });
  const titles = {
    dashboard: ['Dashboard', 'Real-time inventory snapshot'],
    products: ['Products', 'Manage catalog & stock levels'],
    receipts: ['Receipts', 'Incoming goods from vendors'],
    deliveries: ['Delivery Orders', 'Outgoing stock to customers'],
    transfers: ['Internal Transfers', 'Move stock between locations'],
    adjustments: ['Stock Adjustments', 'Correct physical count differences'],
    moves: ['Move History', 'Complete stock ledger'],
    warehouses: ['Warehouses', 'Manage storage locations']
  };
  document.getElementById('page-title').textContent = titles[page][0];
  document.getElementById('page-subtitle').textContent = titles[page][1];
  const content = document.getElementById('page-content');
  content.classList.remove('animate-fade-in');
  void content.offsetWidth;
  content.classList.add('animate-fade-in');
  const renderers = { dashboard: renderDashboard, products: renderProducts, receipts: renderReceipts, deliveries: renderDeliveries, transfers: renderTransfers, adjustments: renderAdjustments, moves: renderMoves, warehouses: renderWarehouses };
  (renderers[page] || (() => {}))();
}

function refreshCurrent() { navigate(currentPage); toast('Refreshed', 'info'); }
function globalSearch() {
  const q = document.getElementById('global-search').value.trim();
  if (q) { navigate('products'); setTimeout(() => document.getElementById('prod-search')?.dispatchEvent(new Event('input')), 100); }
}

// ========== DASHBOARD ==========
async function renderDashboard() {
  const el = document.getElementById('page-content');
  el.innerHTML = `<div class="flex items-center justify-center h-64"><i class="fas fa-spinner fa-spin text-3xl text-brand-500"></i></div>`;
  try {
    const kpis = await api('/dashboard/kpis');
    el.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        ${kpiCard('Total Products', kpis.total_products, 'fa-box', 'from-blue-500 to-cyan-500')}
        ${kpiCard('Low Stock', kpis.low_stock_items, 'fa-exclamation-triangle', 'from-amber-500 to-orange-500', kpis.low_stock_items > 0)}
        ${kpiCard('Out of Stock', kpis.out_of_stock_items, 'fa-times-circle', 'from-red-500 to-rose-500', kpis.out_of_stock_items > 0)}
        ${kpiCard('Total Units', Math.round(kpis.total_stock_value), 'fa-cubes', 'from-emerald-500 to-teal-500')}
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        ${kpiCard('Pending Receipts', kpis.pending_receipts, 'fa-truck-loading', 'from-indigo-500 to-purple-500')}
        ${kpiCard('Pending Deliveries', kpis.pending_deliveries, 'fa-shipping-fast', 'from-pink-500 to-rose-500')}
        ${kpiCard('Pending Transfers', kpis.pending_transfers, 'fa-exchange-alt', 'from-violet-500 to-purple-500')}
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="glass rounded-2xl p-6">
          <h3 class="font-semibold mb-4">Quick Actions</h3>
          <div class="grid grid-cols-2 gap-3">
            <button onclick="navigate('receipts'); setTimeout(showCreateReceipt, 200)" class="p-4 rounded-xl bg-dark-800 hover:bg-brand-600/20 border border-slate-700 hover:border-brand-500 transition text-left">
              <i class="fas fa-plus-circle text-brand-400 mb-2"></i><p class="text-sm font-medium">New Receipt</p>
            </button>
            <button onclick="navigate('deliveries'); setTimeout(showCreateDelivery, 200)" class="p-4 rounded-xl bg-dark-800 hover:bg-brand-600/20 border border-slate-700 hover:border-brand-500 transition text-left">
              <i class="fas fa-plus-circle text-brand-400 mb-2"></i><p class="text-sm font-medium">New Delivery</p>
            </button>
            <button onclick="navigate('transfers'); setTimeout(showCreateTransfer, 200)" class="p-4 rounded-xl bg-dark-800 hover:bg-brand-600/20 border border-slate-700 hover:border-brand-500 transition text-left">
              <i class="fas fa-plus-circle text-brand-400 mb-2"></i><p class="text-sm font-medium">New Transfer</p>
            </button>
            <button onclick="navigate('adjustments'); setTimeout(showCreateAdjustment, 200)" class="p-4 rounded-xl bg-dark-800 hover:bg-brand-600/20 border border-slate-700 hover:border-brand-500 transition text-left">
              <i class="fas fa-plus-circle text-brand-400 mb-2"></i><p class="text-sm font-medium">Stock Adjust</p>
            </button>
          </div>
        </div>
        <div class="glass rounded-2xl p-6">
          <h3 class="font-semibold mb-4">Stock Alerts</h3>
          <div id="alerts-list" class="space-y-2 max-h-48 overflow-y-auto text-sm">
            <p class="text-slate-500">Loading...</p>
          </div>
        </div>
      </div>`;
    // Alerts
    const low = products.filter(p => p.is_low || p.is_out);
    document.getElementById('alerts-list').innerHTML = low.length ? low.map(p => `
      <div class="flex items-center justify-between p-3 rounded-lg bg-dark-800/50">
        <div><span class="font-medium">${p.name}</span> <span class="text-slate-500 text-xs">(${p.sku})</span></div>
        <span class="text-xs ${p.is_out ? 'text-red-400' : 'text-amber-400'}">${p.is_out ? 'OUT OF STOCK' : `Low: ${p.total_stock}`}</span>
      </div>`).join('') : '<p class="text-slate-500">No alerts – all stock healthy 🎉</p>';
  } catch (e) { el.innerHTML = `<p class="text-red-400">${e.message}</p>`; }
}

function kpiCard(title, value, icon, gradient, alert = false) {
  return `<div class="kpi-card glass rounded-2xl p-5 card-hover ${alert ? 'ring-1 ring-amber-500/50' : ''}">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-slate-400 text-xs font-medium uppercase tracking-wide">${title}</p>
        <p class="text-3xl font-bold mt-1">${value}</p>
      </div>
      <div class="w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg">
        <i class="fas ${icon} text-white"></i>
      </div>
    </div>
  </div>`;
}

// ========== PRODUCTS ==========
async function renderProducts() {
  const el = document.getElementById('page-content');
  el.innerHTML = `<div class="flex justify-between items-center mb-6">
    <div class="flex gap-3">
      <input type="text" id="prod-search" placeholder="Search name or SKU..." class="px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm w-64" oninput="filterProducts()" />
      <select id="prod-cat" class="px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" onchange="filterProducts()">
        <option value="">All Categories</option>
        ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
      </select>
    </div>
    <button onclick="showCreateProduct()" class="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold text-white"><i class="fas fa-plus mr-2"></i>Add Product</button>
  </div>
  <div class="glass rounded-2xl overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-dark-800/80 text-slate-400 text-xs uppercase"><tr>
        <th class="text-left px-5 py-3">Product</th><th class="text-left px-5 py-3">SKU</th><th class="text-left px-5 py-3">Category</th>
        <th class="text-right px-5 py-3">Stock</th><th class="text-right px-5 py-3">Reorder</th><th class="text-center px-5 py-3">Status</th>
      </tr></thead>
      <tbody id="prod-tbody"></tbody>
    </table>
  </div>`;
  filterProducts();
}

function filterProducts() {
  const q = (document.getElementById('prod-search')?.value || '').toLowerCase();
  const cat = document.getElementById('prod-cat')?.value;
  let list = products;
  if (q) list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  if (cat) list = list.filter(p => p.category_id == cat);
  document.getElementById('prod-tbody').innerHTML = list.map(p => `
    <tr class="table-row border-t border-slate-800">
      <td class="px-5 py-3.5 font-medium">${p.name}</td>
      <td class="px-5 py-3.5 text-slate-400 font-mono text-xs">${p.sku}</td>
      <td class="px-5 py-3.5 text-slate-400">${p.category_name || '—'}</td>
      <td class="px-5 py-3.5 text-right font-semibold">${p.total_stock} <span class="text-xs text-slate-500">${p.unit}</span></td>
      <td class="px-5 py-3.5 text-right text-slate-400">${p.reorder_level}</td>
      <td class="px-5 py-3.5 text-center">${p.is_out ? '<span class="text-red-400 text-xs font-medium">OUT</span>' : p.is_low ? '<span class="text-amber-400 text-xs font-medium">LOW</span>' : '<span class="text-emerald-400 text-xs font-medium">OK</span>'}</td>
    </tr>`).join('') || '<tr><td colspan="6" class="px-5 py-8 text-center text-slate-500">No products found</td></tr>';
}

function showCreateProduct() {
  openModal(`
    <div class="p-6">
      <h3 class="text-lg font-bold mb-5">Create Product</h3>
      <form onsubmit="createProduct(event)" class="space-y-4">
        <div><label class="text-xs text-slate-400">Name *</label><input id="np-name" required class="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" /></div>
        <div><label class="text-xs text-slate-400">SKU *</label><input id="np-sku" required class="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs text-slate-400">Category</label><select id="np-cat" class="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm"><option value="">—</option>${categories.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
          <div><label class="text-xs text-slate-400">Unit</label><input id="np-unit" value="Units" class="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" /></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs text-slate-400">Reorder Level</label><input type="number" id="np-reorder" value="10" class="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" /></div>
          <div><label class="text-xs text-slate-400">Initial Stock</label><input type="number" id="np-stock" value="0" class="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" /></div>
        </div>
        <div><label class="text-xs text-slate-400">Warehouse (for initial stock)</label><select id="np-wh" class="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm">${warehouses.map(w=>`<option value="${w.id}">${w.name}</option>`).join('')}</select></div>
        <div class="flex gap-3 pt-2">
          <button type="button" onclick="closeModal()" class="flex-1 py-2.5 rounded-xl border border-slate-600 text-sm">Cancel</button>
          <button type="submit" class="flex-1 py-2.5 btn-primary rounded-xl text-sm font-semibold text-white">Create</button>
        </div>
      </form>
    </div>`);
}

async function createProduct(e) {
  e.preventDefault();
  try {
    await api('/products', { method: 'POST', body: JSON.stringify({
      name: document.getElementById('np-name').value,
      sku: document.getElementById('np-sku').value,
      category_id: parseInt(document.getElementById('np-cat').value) || null,
      unit: document.getElementById('np-unit').value,
      reorder_level: parseFloat(document.getElementById('np-reorder').value),
      initial_stock: parseFloat(document.getElementById('np-stock').value),
      warehouse_id: parseInt(document.getElementById('np-wh').value)
    }) });
    closeModal(); toast('Product created', 'success');
    products = await api('/products'); navigate('products');
  } catch (err) { toast(err.message, 'error'); }
}

// ========== RECEIPTS ==========
async function renderReceipts() {
  const el = document.getElementById('page-content');
  el.innerHTML = `<div class="flex justify-between mb-6">
    <select id="rcpt-status" class="px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" onchange="loadReceipts()">
      <option value="">All Status</option><option>Draft</option><option>Done</option>
    </select>
    <button onclick="showCreateReceipt()" class="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold text-white"><i class="fas fa-plus mr-2"></i>New Receipt</button>
  </div>
  <div class="glass rounded-2xl overflow-hidden"><div id="rcpt-list" class="divide-y divide-slate-800"></div></div>`;
  loadReceipts();
}

async function loadReceipts() {
  try {
    const status = document.getElementById('rcpt-status')?.value || '';
    const list = await api('/receipts' + (status ? `?status=${status}` : ''));
    document.getElementById('rcpt-list').innerHTML = list.length ? list.map(r => `
      <div class="p-5 table-row">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-semibold">${r.reference}</p>
            <p class="text-xs text-slate-500 mt-0.5">${r.supplier || 'No supplier'} · ${new Date(r.created_at).toLocaleString()}</p>
            <div class="mt-2 flex flex-wrap gap-2">${r.lines.map(l => `<span class="text-xs bg-dark-800 px-2 py-1 rounded">${l.product_name} × ${l.quantity}</span>`).join('')}</div>
          </div>
          <div class="flex items-center gap-3">
            ${statusBadge(r.status)}
            ${r.status !== 'Done' ? `<button onclick="validateReceipt(${r.id})" class="btn-success px-3 py-1.5 rounded-lg text-xs text-white font-medium">Validate</button>` : ''}
          </div>
        </div>
      </div>`).join('') : '<p class="p-8 text-center text-slate-500">No receipts yet</p>';
  } catch (e) { toast(e.message, 'error'); }
}

function showCreateReceipt() {
  openModal(`
    <div class="p-6">
      <h3 class="text-lg font-bold mb-5">New Receipt</h3>
      <form onsubmit="createReceipt(event)" class="space-y-4">
        <div><label class="text-xs text-slate-400">Supplier</label><input id="rc-supplier" class="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" /></div>
        <div><label class="text-xs text-slate-400">Warehouse *</label><select id="rc-wh" required class="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm">${warehouses.map(w=>`<option value="${w.id}">${w.name}</option>`).join('')}</select></div>
        <div><label class="text-xs text-slate-400">Product *</label><select id="rc-prod" required class="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm">${products.map(p=>`<option value="${p.id}">${p.name} (${p.sku})</option>`).join('')}</select></div>
        <div><label class="text-xs text-slate-400">Quantity *</label><input type="number" id="rc-qty" required min="0.01" step="any" class="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" /></div>
        <div class="flex gap-3 pt-2">
          <button type="button" onclick="closeModal()" class="flex-1 py-2.5 rounded-xl border border-slate-600 text-sm">Cancel</button>
          <button type="submit" class="flex-1 py-2.5 btn-primary rounded-xl text-sm font-semibold text-white">Create Draft</button>
        </div>
      </form>
    </div>`);
}

async function createReceipt(e) {
  e.preventDefault();
  try {
    await api('/receipts', { method: 'POST', body: JSON.stringify({
      supplier: document.getElementById('rc-supplier').value,
      warehouse_id: parseInt(document.getElementById('rc-wh').value),
      lines: [{ product_id: parseInt(document.getElementById('rc-prod').value), quantity: parseFloat(document.getElementById('rc-qty').value) }]
    }) });
    closeModal(); toast('Receipt created', 'success'); loadReceipts(); products = await api('/products');
  } catch (err) { toast(err.message, 'error'); }
}

async function validateReceipt(id) {
  try {
    await api(`/receipts/${id}/validate`, { method: 'POST' });
    toast('Stock increased!', 'success'); loadReceipts(); products = await api('/products');
  } catch (err) { toast(err.message, 'error'); }
}

// ========== DELIVERIES ==========
async function renderDeliveries() {
  const el = document.getElementById('page-content');
  el.innerHTML = `<div class="flex justify-between mb-6">
    <select id="del-status" class="px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" onchange="loadDeliveries()">
      <option value="">All Status</option><option>Draft</option><option>Done</option>
    </select>
    <button onclick="showCreateDelivery()" class="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold text-white"><i class="fas fa-plus mr-2"></i>New Delivery</button>
  </div>
  <div class="glass rounded-2xl overflow-hidden"><div id="del-list" class="divide-y divide-slate-800"></div></div>`;
  loadDeliveries();
}

async function loadDeliveries() {
  try {
    const status = document.getElementById('del-status')?.value || '';
    const list = await api('/deliveries' + (status ? `?status=${status}` : ''));
    document.getElementById('del-list').innerHTML = list.length ? list.map(d => `
      <div class="p-5 table-row">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-semibold">${d.reference}</p>
            <p class="text-xs text-slate-500 mt-0.5">${d.customer || 'No customer'} · ${new Date(d.created_at).toLocaleString()}</p>
            <div class="mt-2 flex flex-wrap gap-2">${d.lines.map(l => `<span class="text-xs bg-dark-800 px-2 py-1 rounded">${l.product_name} × ${l.quantity}</span>`).join('')}</div>
          </div>
          <div class="flex items-center gap-3">
            ${statusBadge(d.status)}
            ${d.status !== 'Done' ? `<button onclick="validateDelivery(${d.id})" class="btn-success px-3 py-1.5 rounded-lg text-xs text-white font-medium">Validate</button>` : ''}
          </div>
        </div>
      </div>`).join('') : '<p class="p-8 text-center text-slate-500">No deliveries yet</p>';
  } catch (e) { toast(e.message, 'error'); }
}

function showCreateDelivery() {
  openModal(`
    <div class="p-6">
      <h3 class="text-lg font-bold mb-5">New Delivery Order</h3>
      <form onsubmit="createDelivery(event)" class="space-y-4">
        <div><label class="text-xs text-slate-400">Customer</label><input id="dl-customer" class="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" /></div>
        <div><label class="text-xs text-slate-400">Warehouse *</label><select id="dl-wh" required class="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm">${warehouses.map(w=>`<option value="${w.id}">${w.name}</option>`).join('')}</select></div>
        <div><label class="text-xs text-slate-400">Product *</label><select id="dl-prod" required class="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm">${products.map(p=>`<option value="${p.id}">${p.name} (stock: ${p.total_stock})</option>`).join('')}</select></div>
        <div><label class="text-xs text-slate-400">Quantity *</label><input type="number" id="dl-qty" required min="0.01" step="any" class="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" /></div>
        <div class="flex gap-3 pt-2">
          <button type="button" onclick="closeModal()" class="flex-1 py-2.5 rounded-xl border border-slate-600 text-sm">Cancel</button>
          <button type="submit" class="flex-1 py-2.5 btn-primary rounded-xl text-sm font-semibold text-white">Create Draft</button>
        </div>
      </form>
    </div>`);
}

async function createDelivery(e) {
  e.preventDefault();
  try {
    await api('/deliveries', { method: 'POST', body: JSON.stringify({
      customer: document.getElementById('dl-customer').value,
      warehouse_id: parseInt(document.getElementById('dl-wh').value),
      lines: [{ product_id: parseInt(document.getElementById('dl-prod').value), quantity: parseFloat(document.getElementById('dl-qty').value) }]
    }) });
    closeModal(); toast('Delivery created', 'success'); loadDeliveries();
  } catch (err) { toast(err.message, 'error'); }
}

async function validateDelivery(id) {
  try {
    await api(`/deliveries/${id}/validate`, { method: 'POST' });
    toast('Stock decreased!', 'success'); loadDeliveries(); products = await api('/products');
  } catch (err) { toast(err.message, 'error'); }
}

// ========== TRANSFERS ==========
async function renderTransfers() {
  const el = document.getElementById('page-content');
  el.innerHTML = `<div class="flex justify-between mb-6">
    <select id="trf-status" class="px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" onchange="loadTransfers()">
      <option value="">All Status</option><option>Draft</option><option>Done</option>
    </select>
    <button onclick="showCreateTransfer()" class="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold text-white"><i class="fas fa-plus mr-2"></i>New Transfer</button>
  </div>
  <div class="glass rounded-2xl overflow-hidden"><div id="trf-list" class="divide-y divide-slate-800"></div></div>`;
  loadTransfers();
}

async function loadTransfers() {
  try {
    const status = document.getElementById('trf-status')?.value || '';
    const list = await api('/transfers' + (status ? `?status=${status}` : ''));
    document.getElementById('trf-list').innerHTML = list.length ? list.map(t => {
      const src = warehouses.find(w => w.id === t.source_warehouse_id)?.name || t.source_warehouse_id;
      const dest = warehouses.find(w => w.id === t.dest_warehouse_id)?.name || t.dest_warehouse_id;
      return `<div class="p-5 table-row">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-semibold">${t.reference}</p>
            <p class="text-xs text-slate-500 mt-0.5">${src} → ${dest} · ${new Date(t.created_at).toLocaleString()}</p>
            <div class="mt-2 flex flex-wrap gap-2">${t.lines.map(l => `<span class="text-xs bg-dark-800 px-2 py-1 rounded">${l.product_name} × ${l.quantity}</span>`).join('')}</div>
          </div>
          <div class="flex items-center gap-3">
            ${statusBadge(t.status)}
            ${t.status !== 'Done' ? `<button onclick="validateTransfer(${t.id})" class="btn-success px-3 py-1.5 rounded-lg text-xs text-white font-medium">Validate</button>` : ''}
          </div>
        </div>
      </div>`;
    }).join('') : '<p class="p-8 text-center text-slate-500">No transfers yet</p>';
  } catch (e) { toast(e.message, 'error'); }
}

function showCreateTransfer() {
  openModal(`
    <div class="p-6">
      <h3 class="text-lg font-bold mb-5">New Internal Transfer</h3>
      <form onsubmit="createTransfer(event)" class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs text-slate-400">From *</label><select id="tr-src" required class="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm">${warehouses.map(w=>`<option value="${w.id}">${w.name}</option>`).join('')}</select></div>
          <div><label class="text-xs text-slate-400">To *</label><select id="tr-dest" required class="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm">${warehouses.map(w=>`<option value="${w.id}">${w.name}</option>`).join('')}</select></div>
        </div>
        <div><label class="text-xs text-slate-400">Product *</label><select id="tr-prod" required class="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm">${products.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select></div>
        <div><label class="text-xs text-slate-400">Quantity *</label><input type="number" id="tr-qty" required min="0.01" step="any" class="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" /></div>
        <div class="flex gap-3 pt-2">
          <button type="button" onclick="closeModal()" class="flex-1 py-2.5 rounded-xl border border-slate-600 text-sm">Cancel</button>
          <button type="submit" class="flex-1 py-2.5 btn-primary rounded-xl text-sm font-semibold text-white">Create Draft</button>
        </div>
      </form>
    </div>`);
}

async function createTransfer(e) {
  e.preventDefault();
  try {
    await api('/transfers', { method: 'POST', body: JSON.stringify({
      source_warehouse_id: parseInt(document.getElementById('tr-src').value),
      dest_warehouse_id: parseInt(document.getElementById('tr-dest').value),
      lines: [{ product_id: parseInt(document.getElementById('tr-prod').value), quantity: parseFloat(document.getElementById('tr-qty').value) }]
    }) });
    closeModal(); toast('Transfer created', 'success'); loadTransfers();
  } catch (err) { toast(err.message, 'error'); }
}

async function validateTransfer(id) {
  try {
    await api(`/transfers/${id}/validate`, { method: 'POST' });
    toast('Transfer completed!', 'success'); loadTransfers(); products = await api('/products');
  } catch (err) { toast(err.message, 'error'); }
}

// ========== ADJUSTMENTS ==========
async function renderAdjustments() {
  const el = document.getElementById('page-content');
  el.innerHTML = `<div class="flex justify-end mb-6">
    <button onclick="showCreateAdjustment()" class="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold text-white"><i class="fas fa-plus mr-2"></i>New Adjustment</button>
  </div>
  <div class="glass rounded-2xl overflow-hidden"><div id="adj-list" class="divide-y divide-slate-800"></div></div>`;
  loadAdjustments();
}

async function loadAdjustments() {
  try {
    const list = await api('/adjustments');
    document.getElementById('adj-list').innerHTML = list.length ? list.map(a => `
      <div class="p-5 table-row">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-semibold">${a.reference}</p>
            <p class="text-xs text-slate-500 mt-0.5">${a.product_name} @ ${a.warehouse_name} · ${new Date(a.created_at).toLocaleString()}</p>
            <p class="text-sm mt-1">System: ${a.system_qty} → Counted: ${a.counted_qty} <span class="${a.difference >= 0 ? 'text-emerald-400' : 'text-red-400'}">(${a.difference >= 0 ? '+' : ''}${a.difference})</span></p>
            ${a.reason ? `<p class="text-xs text-slate-500 mt-1">${a.reason}</p>` : ''}
          </div>
          ${statusBadge(a.status)}
        </div>
      </div>`).join('') : '<p class="p-8 text-center text-slate-500">No adjustments yet</p>';
  } catch (e) { toast(e.message, 'error'); }
}

function showCreateAdjustment() {
  openModal(`
    <div class="p-6">
      <h3 class="text-lg font-bold mb-5">Stock Adjustment</h3>
      <form onsubmit="createAdjustment(event)" class="space-y-4">
        <div><label class="text-xs text-slate-400">Warehouse *</label><select id="ad-wh" required class="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm">${warehouses.map(w=>`<option value="${w.id}">${w.name}</option>`).join('')}</select></div>
        <div><label class="text-xs text-slate-400">Product *</label><select id="ad-prod" required class="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm">${products.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select></div>
        <div><label class="text-xs text-slate-400">Counted Quantity *</label><input type="number" id="ad-qty" required step="any" class="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" /></div>
        <div><label class="text-xs text-slate-400">Reason</label><input id="ad-reason" placeholder="Damaged, lost, found..." class="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" /></div>
        <div class="flex gap-3 pt-2">
          <button type="button" onclick="closeModal()" class="flex-1 py-2.5 rounded-xl border border-slate-600 text-sm">Cancel</button>
          <button type="submit" class="flex-1 py-2.5 btn-primary rounded-xl text-sm font-semibold text-white">Apply</button>
        </div>
      </form>
    </div>`);
}

async function createAdjustment(e) {
  e.preventDefault();
  try {
    await api('/adjustments', { method: 'POST', body: JSON.stringify({
      warehouse_id: parseInt(document.getElementById('ad-wh').value),
      product_id: parseInt(document.getElementById('ad-prod').value),
      counted_qty: parseFloat(document.getElementById('ad-qty').value),
      reason: document.getElementById('ad-reason').value
    }) });
    closeModal(); toast('Adjustment applied', 'success'); loadAdjustments(); products = await api('/products');
  } catch (err) { toast(err.message, 'error'); }
}

// ========== MOVES ==========
async function renderMoves() {
  const el = document.getElementById('page-content');
  el.innerHTML = `<div class="glass rounded-2xl overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-dark-800/80 text-slate-400 text-xs uppercase"><tr>
        <th class="text-left px-5 py-3">Date</th><th class="text-left px-5 py-3">Product</th><th class="text-left px-5 py-3">Warehouse</th>
        <th class="text-right px-5 py-3">Qty</th><th class="text-left px-5 py-3">Type</th><th class="text-left px-5 py-3">Reference</th>
      </tr></thead>
      <tbody id="moves-tbody"></tbody>
    </table>
  </div>`;
  try {
    const moves = await api('/moves?limit=50');
    document.getElementById('moves-tbody').innerHTML = moves.map(m => `
      <tr class="table-row border-t border-slate-800">
        <td class="px-5 py-3 text-xs text-slate-400">${new Date(m.created_at).toLocaleString()}</td>
        <td class="px-5 py-3 font-medium">${m.product_name}</td>
        <td class="px-5 py-3 text-slate-400">${m.warehouse_name}</td>
        <td class="px-5 py-3 text-right font-semibold ${m.quantity >= 0 ? 'text-emerald-400' : 'text-red-400'}">${m.quantity >= 0 ? '+' : ''}${m.quantity}</td>
        <td class="px-5 py-3"><span class="text-xs bg-dark-800 px-2 py-1 rounded">${m.move_type}</span></td>
        <td class="px-5 py-3 text-xs font-mono text-slate-500">${m.reference || '—'}</td>
      </tr>`).join('') || '<tr><td colspan="6" class="px-5 py-8 text-center text-slate-500">No moves yet</td></tr>';
  } catch (e) { toast(e.message, 'error'); }
}

// ========== WAREHOUSES ==========
async function renderWarehouses() {
  const el = document.getElementById('page-content');
  el.innerHTML = `<div class="flex justify-end mb-6">
    <button onclick="showCreateWarehouse()" class="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold text-white"><i class="fas fa-plus mr-2"></i>Add Warehouse</button>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="wh-grid"></div>`;
  try {
    warehouses = await api('/warehouses');
    document.getElementById('wh-grid').innerHTML = warehouses.map(w => `
      <div class="glass rounded-2xl p-5 card-hover">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center"><i class="fas fa-warehouse text-brand-400"></i></div>
          <div><p class="font-semibold">${w.name}</p><p class="text-xs text-slate-500">${w.location || 'No location'}</p></div>
        </div>
        <span class="text-xs text-emerald-400">Active</span>
      </div>`).join('');
  } catch (e) { toast(e.message, 'error'); }
}

function showCreateWarehouse() {
  openModal(`
    <div class="p-6">
      <h3 class="text-lg font-bold mb-5">Add Warehouse</h3>
      <form onsubmit="createWarehouse(event)" class="space-y-4">
        <div><label class="text-xs text-slate-400">Name *</label><input id="wh-name" required class="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" /></div>
        <div><label class="text-xs text-slate-400">Location</label><input id="wh-loc" class="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" /></div>
        <div class="flex gap-3 pt-2">
          <button type="button" onclick="closeModal()" class="flex-1 py-2.5 rounded-xl border border-slate-600 text-sm">Cancel</button>
          <button type="submit" class="flex-1 py-2.5 btn-primary rounded-xl text-sm font-semibold text-white">Create</button>
        </div>
      </form>
    </div>`);
}

async function createWarehouse(e) {
  e.preventDefault();
  try {
    await api('/warehouses', { method: 'POST', body: JSON.stringify({ name: document.getElementById('wh-name').value, location: document.getElementById('wh-loc').value }) });
    closeModal(); toast('Warehouse created', 'success'); navigate('warehouses');
  } catch (err) { toast(err.message, 'error'); }
}

// ========== INIT ==========
if (token && currentUser) showApp();
else document.getElementById('auth-screen').classList.remove('hidden');
