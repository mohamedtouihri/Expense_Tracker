/* ============================================================
   Expense Tracker — app.js
   Features: localStorage, dark mode, PWA install, offline status,
             edit/delete, filters, responsive nav
   ============================================================ */


/* ============================================================
   1 — DARK MODE
   ============================================================ */

// Load saved preference (default: light)
let isDark = localStorage.getItem('expense-theme') === 'dark';

function applyTheme() {
  document.body.classList.toggle('dark', isDark);

  const icon  = isDark ? '☀️' : '🌙';
  const label = isDark ? 'Light Mode' : 'Dark Mode';

  const iconSidebar  = document.getElementById('dark-icon-sidebar');
  const labelSidebar = document.getElementById('dark-label-sidebar');
  const iconMobile   = document.getElementById('dark-icon-mobile');
  const labelMobile  = document.getElementById('dark-label-mobile');
  const iconBottom   = document.getElementById('dark-icon-bottom');

  if (iconSidebar)  iconSidebar.textContent  = icon;
  if (labelSidebar) labelSidebar.textContent = label;
  if (iconMobile)   iconMobile.textContent   = icon;
  if (labelMobile)  labelMobile.textContent  = isDark ? 'Light' : 'Dark';
  if (iconBottom)   iconBottom.textContent   = icon;
}

function toggleTheme() {
  isDark = !isDark;
  localStorage.setItem('expense-theme', isDark ? 'dark' : 'light');
  applyTheme();
}

// Apply on load
applyTheme();

// Attach toggle buttons
document.getElementById('dark-toggle-sidebar')?.addEventListener('click', toggleTheme);
document.getElementById('dark-toggle-mobile')?.addEventListener('click', toggleTheme);
document.getElementById('dark-toggle-bottom')?.addEventListener('click', toggleTheme);


/* ============================================================
   2 — ONLINE / OFFLINE STATUS
   ============================================================ */

const statusDot  = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

function updateNetworkStatus() {
  if (!statusDot || !statusText) return;
  if (navigator.onLine) {
    statusDot.className  = 'status-dot online';
    statusText.textContent = 'Online';
  } else {
    statusDot.className  = 'status-dot offline';
    statusText.textContent = 'Offline';
  }
}

window.addEventListener('online',  updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);
updateNetworkStatus();


/* ============================================================
   3 — MOBILE / SIDEBAR NAVIGATION
   ============================================================ */

const sections = {
  form:  document.querySelector('section[aria-label="Add expense"]'),
  list:  document.querySelector('section[aria-label="Expense list"]'),
  chart: document.querySelector('section[aria-label="Spending chart"]'),
};

// On mobile, show only the active section
function setActiveSection(name) {
  const isMobile = window.innerWidth <= 640;

  if (isMobile) {
    Object.entries(sections).forEach(([key, el]) => {
      if (el) el.style.display = key === name ? 'block' : 'none';
    });
  } else {
    // Desktop: always show all sections
    Object.values(sections).forEach(el => { if (el) el.style.display = ''; });
  }

  // Update active state on all nav buttons
  document.querySelectorAll('[data-section]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === name);
  });
}

// Attach nav buttons (sidebar + bottom nav)
document.querySelectorAll('[data-section]').forEach(btn => {
  if (btn.tagName === 'BUTTON' && !btn.id.startsWith('dark')) {
    btn.addEventListener('click', () => setActiveSection(btn.dataset.section));
  }
});

// Reset layout on resize
window.addEventListener('resize', () => {
  if (window.innerWidth > 640) {
    Object.values(sections).forEach(el => { if (el) el.style.display = ''; });
  }
});

// Initial: on mobile show form, on desktop show all
setActiveSection('form');


/* ============================================================
   4 — STATE & DOM REFERENCES
   ============================================================ */

// Load expenses from localStorage (or start empty)
let expenses      = JSON.parse(localStorage.getItem('expense-tracker-data') || '[]');
let currentEditId = null;

const form             = document.getElementById('expense-form');
const descriptionInput = document.getElementById('description');
const amountInput      = document.getElementById('amount');
const typeSelect       = document.getElementById('type');
const categorySelect   = document.getElementById('category');
const dateInput        = document.getElementById('date');
const submitBtn        = document.getElementById('submit-btn');
const cancelBtn        = document.getElementById('cancel-btn');
const expenseList      = document.getElementById('expense-list');
const emptyState       = document.getElementById('empty-state');
const balanceEl        = document.getElementById('balance');
const totalIncomeEl    = document.getElementById('total-income');
const totalExpensesEl  = document.getElementById('total-expenses');
const searchInput      = document.getElementById('search-input');
const filterCategory   = document.getElementById('filter-category');
const filterType       = document.getElementById('filter-type');

// Default date to today
dateInput.value = new Date().toISOString().split('T')[0];


/* ============================================================
   5 — LOCALSTORAGE SAVE
   ============================================================ */

function saveToStorage() {
  localStorage.setItem('expense-tracker-data', JSON.stringify(expenses));
}


/* ============================================================
   6 — FILTER FUNCTION
   ============================================================ */

function getFilteredExpenses() {
  const searchTerm     = searchInput.value.toLowerCase().trim();
  const categoryFilter = filterCategory.value;
  const typeFilter     = filterType.value;

  return expenses.filter(expense => {
    const matchesSearch   = expense.description.toLowerCase().includes(searchTerm);
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    const matchesType     = typeFilter === 'all'     || expense.type === typeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });
}


/* ============================================================
   7 — RENDER
   ============================================================ */

function renderExpenses() {
  const filtered = getFilteredExpenses();

  if (filtered.length === 0) {
    expenseList.innerHTML = expenses.length === 0
      ? '<p style="padding:1rem;color:var(--text-muted)">No expenses yet. Add your first one!</p>'
      : '<p style="padding:1rem;color:var(--text-muted)">No results match your filters.</p>';
    emptyState.hidden = true;
  } else {
    expenseList.innerHTML = filtered.map(createExpenseCardHTML).join('');
  }

  updateTotals();
}

function createExpenseCardHTML(expense) {
  const sign        = expense.type === 'income' ? '+' : '-';
  const amountClass = expense.type === 'income' ? 'income' : 'expense';
  const formatted   = parseFloat(expense.amount).toFixed(2);

  return `
    <li class="expense-card" data-id="${expense.id}">
      <div class="card-left">
        <span class="card-category-badge badge-${expense.category}">${expense.category}</span>
        <div class="card-info">
          <span class="card-description">${escapeHtml(expense.description)}</span>
          <span class="card-date">${expense.date}</span>
        </div>
      </div>
      <div class="card-right">
        <span class="card-amount ${amountClass}">${sign}$${formatted}</span>
        <div class="card-actions">
          <button class="btn-edit"   data-id="${expense.id}">Edit</button>
          <button class="btn-delete" data-id="${expense.id}">Delete</button>
        </div>
      </div>
    </li>
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function updateTotals() {
  const totalIncome   = expenses.filter(e => e.type === 'income')
                                .reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const totalExpenses = expenses.filter(e => e.type === 'expense')
                                .reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const balance       = totalIncome - totalExpenses;

  balanceEl.textContent      = `$${balance.toFixed(2)}`;
  totalIncomeEl.textContent  = `$${totalIncome.toFixed(2)}`;
  totalExpensesEl.textContent= `$${totalExpenses.toFixed(2)}`;

  // Color the balance
  balanceEl.style.color = balance >= 0
    ? 'var(--income-color)'
    : 'var(--expense-color)';
}


/* ============================================================
   8 — FORM SUBMIT (Add or Edit)
   ============================================================ */

form.addEventListener('submit', function(event) {
  event.preventDefault();
  if (!validateForm()) return;

  if (currentEditId !== null) {
    // Edit mode
    const index = expenses.findIndex(e => e.id === currentEditId);
    if (index !== -1) {
      expenses[index] = {
        ...expenses[index],
        description: descriptionInput.value.trim(),
        amount:      parseFloat(amountInput.value),
        type:        typeSelect.value,
        category:    categorySelect.value,
        date:        dateInput.value,
      };
    }
  } else {
    // Add mode
    expenses.push({
      id:          Date.now(),
      description: descriptionInput.value.trim(),
      amount:      parseFloat(amountInput.value),
      type:        typeSelect.value,
      category:    categorySelect.value,
      date:        dateInput.value,
    });
  }

  saveToStorage();  // 💾 persist to localStorage
  renderExpenses();
  resetForm();

  // On mobile, switch to transactions view after adding
  if (window.innerWidth <= 640) setActiveSection('list');
});


/* ============================================================
   9 — DELETE & EDIT (event delegation)
   ============================================================ */

expenseList.addEventListener('click', function(event) {
  const el = event.target;

  if (el.classList.contains('btn-delete')) {
    deleteExpense(el.dataset.id);
  }

  if (el.classList.contains('btn-edit')) {
    startEdit(el.dataset.id);
    // On mobile, switch to form view for editing
    if (window.innerWidth <= 640) setActiveSection('form');
  }
});

function deleteExpense(id) {
  expenses = expenses.filter(e => String(e.id) !== String(id));
  saveToStorage();  // 💾
  renderExpenses();
}

function startEdit(id) {
  const expense = expenses.find(e => String(e.id) === String(id));
  if (!expense) return;

  descriptionInput.value = expense.description;
  amountInput.value      = expense.amount;
  typeSelect.value       = expense.type;
  categorySelect.value   = expense.category;
  dateInput.value        = expense.date;

  currentEditId         = expense.id;
  submitBtn.textContent = 'Update Expense';
  cancelBtn.hidden      = false;

  form.scrollIntoView({ behavior: 'smooth' });
}


/* ============================================================
   10 — CANCEL EDIT
   ============================================================ */

cancelBtn.addEventListener('click', resetForm);

function resetForm() {
  form.reset();
  dateInput.value       = new Date().toISOString().split('T')[0];
  submitBtn.textContent = 'Add Expense';
  cancelBtn.hidden      = true;
  currentEditId         = null;
  document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
  document.querySelectorAll('input.error').forEach(el => el.classList.remove('error'));
}


/* ============================================================
   11 — FILTERS
   ============================================================ */

searchInput.addEventListener('input', renderExpenses);
filterCategory.addEventListener('change', renderExpenses);
filterType.addEventListener('change', renderExpenses);


/* ============================================================
   12 — VALIDATION
   ============================================================ */

function validateForm() {
  let isValid = true;
  document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
  document.querySelectorAll('input.error').forEach(el => el.classList.remove('error'));

  if (descriptionInput.value.trim() === '') {
    document.getElementById('description-error').textContent = 'Please enter a description';
    descriptionInput.classList.add('error');
    isValid = false;
  }

  const amount = parseFloat(amountInput.value);
  if (isNaN(amount) || amount <= 0) {
    document.getElementById('amount-error').textContent = 'Please enter a valid positive amount';
    amountInput.classList.add('error');
    isValid = false;
  }

  if (dateInput.value === '') {
    document.getElementById('date-error').textContent = 'Please select a date';
    isValid = false;
  }

  return isValid;
}


/* ============================================================
   13 — PWA INSTALL PROMPT
   ============================================================ */

let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  // You can show an install button here if you want
  console.log('💡 PWA can be installed');
});

window.addEventListener('appinstalled', () => {
  console.log('✅ PWA installed');
  deferredInstallPrompt = null;
});


/* ============================================================
   14 — INITIAL RENDER
   ============================================================ */

renderExpenses();
