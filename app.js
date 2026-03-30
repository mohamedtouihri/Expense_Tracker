/*
  ============================================================
  STAGE 4 — EDIT, DELETE & FILTER
  ============================================================
  Goal: Make every expense editable and deletable.
  Add live search and category/type filters.

  What you will learn:
  - Event delegation (one listener for many buttons)
  - findIndex and splice to modify arrays
  - Spread operator to copy objects
  - Multi-condition filtering
  - Real-time search with oninput
  - Managing "modes" (add mode vs edit mode)

  HOW TO USE THIS FILE:
  This replaces/extends your app.js from Stage 3.
  Read the MINI EXAMPLES first — they explain the new concepts
  before you see them used in the real app code.
  ============================================================
*/


/* ============================================================
  MINI EXAMPLE 1 — Event Delegation
  ============================================================
  PROBLEM: You have 50 expense cards, each with Edit and Delete buttons.
  That is 100 buttons. Do you add 100 event listeners? No.

  BEFORE (bad — adds a listener to every button):
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', handleDelete);
  });
  Problem: if you add a new expense, the new buttons have NO listener.
  You'd have to re-attach listeners every time you re-render. Messy.

  AFTER (event delegation — one listener on the PARENT):
  expenseList.addEventListener('click', function(event) {
    if (event.target.classList.contains('btn-delete')) {
      handleDelete(event.target.dataset.id);
    }
  });

  HOW IT WORKS:
  When you click a button inside the list, the click EVENT travels
  UP the DOM tree: button → li → ul → main → body → html
  This is called "event bubbling".
  We catch it on the <ul> and check: what was actually clicked?

  event.target = the exact element that was clicked (the button)
  event.target.classList.contains('btn-delete') = was it a delete button?
  event.target.dataset.id = reads the data-id="123" attribute we set in HTML
============================================================ */


/* ============================================================
  MINI EXAMPLE 2 — findIndex and splice
  ============================================================
  const fruits = ['apple', 'banana', 'cherry'];

  // Find the position (index) of 'banana'
  const index = fruits.findIndex(fruit => fruit === 'banana');
  // index = 1

  // Remove 1 item starting at that position
  fruits.splice(index, 1);
  // fruits is now ['apple', 'cherry']

  With expense objects:
  const index = expenses.findIndex(e => e.id === idToDelete);
  // finds the position of the expense with matching id
  expenses.splice(index, 1);
  // removes it from the array
============================================================ */


/* ============================================================
  MINI EXAMPLE 3 — The Spread Operator (...)
  ============================================================
  BEFORE (editing an object directly — causes bugs):
  expenses[index].description = "New description";
  // This mutates the object in place — can cause unexpected behaviour

  AFTER (creating a new object with spread):
  expenses[index] = {
    ...expenses[index],         // copy ALL existing properties
    description: "New description"  // then override just this one
  };

  The spread operator (...) "spreads" all properties of an object
  into a new object. Properties listed after it override the copied ones.

  Example:
  const original = { id: 1, name: "Alice", age: 25 };
  const updated  = { ...original, age: 26 };
  // { id: 1, name: "Alice", age: 26 }  ← id and name copied, age overridden
============================================================ */


/* ============================================================
  MINI EXAMPLE 4 — Multi-condition filtering
  ============================================================
  const numbers = [1, 2, 3, 4, 5, 6];

  // One condition:
  numbers.filter(n => n > 3);        // [4, 5, 6]

  // Two conditions at once (AND):
  numbers.filter(n => n > 2 && n < 5); // [3, 4]

  With expenses (search + category + type all at once):
  expenses.filter(expense => {
    const matchesSearch   = expense.description.includes(searchTerm);
    const matchesCategory = category === 'all' || expense.category === category;
    const matchesType     = type === 'all'     || expense.type === type;
    return matchesSearch && matchesCategory && matchesType;
    // ALL three must be true to keep the expense
  });
============================================================ */


/* ============================================================
  STEP 1 — ALL THE VARIABLES (same as Stage 3, + filter inputs)
============================================================ */

let expenses      = [];
let currentEditId = null;

const form            = document.getElementById('expense-form');
const descriptionInput= document.getElementById('description');
const amountInput     = document.getElementById('amount');
const typeSelect      = document.getElementById('type');
const categorySelect  = document.getElementById('category');
const dateInput       = document.getElementById('date');
const submitBtn       = document.getElementById('submit-btn');
const cancelBtn       = document.getElementById('cancel-btn');
const expenseList     = document.getElementById('expense-list');
const emptyState      = document.getElementById('empty-state');
const balanceEl       = document.getElementById('balance');
const totalIncomeEl   = document.getElementById('total-income');
const totalExpensesEl = document.getElementById('total-expenses');

// New in Stage 4 — filter inputs
const searchInput      = document.getElementById('search-input');
const filterCategory   = document.getElementById('filter-category');
const filterType       = document.getElementById('filter-type');

dateInput.value = new Date().toISOString().split('T')[0];


/* ============================================================
  STEP 2 — FILTER FUNCTION
  ============================================================
  This reads the current values of all three filter inputs
  and returns only the expenses that match ALL of them.

  We always filter from the full expenses array, not
  from whatever is currently displayed. This is important —
  if you filter from the display, you can accidentally
  lose items that were hidden by a previous filter.
============================================================ */

function getFilteredExpenses() {
  // Read current filter values
  const searchTerm = searchInput.value.toLowerCase().trim();
  // .toLowerCase() makes search case-insensitive
  // "COFFEE".toLowerCase() → "coffee"
  // so searching "coffee" finds "Coffee", "COFFEE", "coffee"

  const categoryFilter = filterCategory.value; // "all" or a category name
  const typeFilter     = filterType.value;      // "all", "income", or "expense"

  return expenses.filter(function(expense) {
    // Does the description contain the search term?
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm);

    // Does the category match? (skip check if "all" is selected)
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;

    // Does the type match?
    const matchesType = typeFilter === 'all' || expense.type === typeFilter;

    // Keep this expense only if ALL conditions are true
    return matchesSearch && matchesCategory && matchesType;
  });
}


/* ============================================================
  STEP 3 — RENDER EXPENSES (updated from Stage 3)
  ============================================================
  The only change from Stage 3: instead of rendering all expenses,
  we render only the filtered ones.
  But totals are still calculated from ALL expenses.
============================================================ */

function renderExpenses() {
  const filtered = getFilteredExpenses();

  if (filtered.length === 0) {
    expenseList.innerHTML = expenses.length === 0
      ? '<p style="padding:1rem;color:var(--gray-400)">No expenses yet. Add your first one!</p>'
      : '<p style="padding:1rem;color:var(--gray-400)">No results match your filters.</p>';
    emptyState.hidden = true;
  } else {
    expenseList.innerHTML = filtered
      .map(expense => createExpenseCardHTML(expense))
      .join('');
  }

  updateTotals(); // totals always from ALL expenses, not filtered
}

function createExpenseCardHTML(expense) {
  const sign        = expense.type === 'income' ? '+' : '-';
  const amountClass = expense.type === 'income' ? 'income' : 'expense';

  return `
    <li class="expense-card" data-id="${expense.id}">
      <div class="card-left">
        <span class="card-category-badge badge-${expense.category}">${expense.category}</span>
        <div class="card-info">
          <span class="card-description">${expense.description}</span>
          <span class="card-date">${expense.date}</span>
        </div>
      </div>
      <div class="card-right">
        <span class="card-amount ${amountClass}">${sign}${formatCurrency(expense.amount)}</span>
        <div class="card-actions">
          <button class="btn-edit"   data-id="${expense.id}">Edit</button>
          <button class="btn-delete" data-id="${expense.id}">Delete</button>
        </div>
      </div>
    </li>
  `;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'TND', minimumFractionDigits: 2,
  }).format(amount);
}

function updateTotals() {
  const totalIncome  = expenses.filter(e => e.type === 'income') .reduce((s,e) => s + e.amount, 0);
  const totalExpense = expenses.filter(e => e.type === 'expense').reduce((s,e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;

  balanceEl.textContent       = formatCurrency(balance);
  totalIncomeEl.textContent   = formatCurrency(totalIncome);
  totalExpensesEl.textContent = formatCurrency(totalExpense);
  balanceEl.style.color = balance >= 0 ? 'var(--income-color)' : 'var(--expense-color)';
}


/* ============================================================
  STEP 4 — DELETE AN EXPENSE
  ============================================================
  BEFORE & AFTER:

  BEFORE:
  expenses = [
    { id: 1, description: "Coffee" },
    { id: 2, description: "Rent" },      ← we want to delete this
    { id: 3, description: "Salary" },
  ]

  After deleteExpense(2):
  expenses = [
    { id: 1, description: "Coffee" },
    { id: 3, description: "Salary" },
  ]
============================================================ */

function deleteExpense(id) {
  // id comes in as a string from dataset.id, so we convert with Number()
  const numericId = Number(id);

  // Find the position of this expense in the array
  const index = expenses.findIndex(expense => expense.id === numericId);

  if (index === -1) return; // not found — do nothing

  // Ask the user to confirm before deleting
  const confirmed = window.confirm('Delete this expense?');
  if (!confirmed) return;

  // Remove 1 item at 'index'
  expenses.splice(index, 1);

  renderExpenses();
}


/* ============================================================
  STEP 5 — START EDITING AN EXPENSE
  ============================================================
  This function:
  1. Finds the expense by id
  2. Pre-fills all form inputs with its data
  3. Sets currentEditId so the submit handler knows to UPDATE, not ADD
  4. Changes the button text to "Update Expense"
  5. Shows the Cancel button
  6. Scrolls to the form so the user sees it
============================================================ */

function startEdit(id) {
  const numericId = Number(id);

  // Find the full expense object
  const expense = expenses.find(e => e.id === numericId);
  // .find() returns the first item where the condition is true
  // (vs .findIndex() which returns the position number)

  if (!expense) return; // not found

  // Pre-fill the form
  descriptionInput.value = expense.description;
  amountInput.value      = expense.amount;
  typeSelect.value       = expense.type;
  categorySelect.value   = expense.category;
  dateInput.value        = expense.date;

  // Switch to edit mode
  currentEditId         = expense.id;
  submitBtn.textContent = 'Update Expense';
  cancelBtn.hidden      = false;

  // Scroll the form into view smoothly
  form.scrollIntoView({ behavior: 'smooth' });
}


/* ============================================================
  STEP 6 — SAVE AN EDIT (in the form submit handler)
  ============================================================
  BEFORE (adding a new expense):
  expenses.push(newExpense)  → array gets longer

  AFTER (saving an edit):
  expenses[index] = { ...expenses[index], ...newData }
  → replace the existing object at that position

  The submit handler checks currentEditId:
  - null  → add mode  → push a new object
  - a number → edit mode → find and replace the existing object
============================================================ */

form.addEventListener('submit', function(event) {
  event.preventDefault();

  if (!validateForm()) return;

  if (currentEditId !== null) {
    // EDIT MODE — find and update the existing expense
    const index = expenses.findIndex(e => e.id === currentEditId);

    if (index !== -1) {
      /*
        Spread operator:
        { ...expenses[index] }  → copy the old object (keeps the id)
        Then override with new form values.
      */
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
    // ADD MODE — create and push a new expense
    expenses.push({
      id:          Date.now(),
      description: descriptionInput.value.trim(),
      amount:      parseFloat(amountInput.value),
      type:        typeSelect.value,
      category:    categorySelect.value,
      date:        dateInput.value,
    });
  }

  renderExpenses();
  resetForm();
});


/* ============================================================
  STEP 7 — CANCEL EDITING
============================================================ */

cancelBtn.addEventListener('click', function() {
  resetForm();
});

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
  STEP 8 — EVENT DELEGATION for Edit and Delete buttons
  ============================================================
  One listener on the <ul> catches ALL button clicks inside it.

  BEFORE & AFTER:

  BEFORE: 100 individual listeners
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', ...) // added to EACH button
  });
  Problem: new buttons added by renderExpenses() won't have listeners!

  AFTER: one listener on the parent <ul>
  All button clicks bubble up to the <ul> regardless of when they were added.
  We check event.target to know which button was clicked.
============================================================ */

expenseList.addEventListener('click', function(event) {
  const clickedElement = event.target;
  // event.target = the exact element the user clicked

  // Was a Delete button clicked?
  if (clickedElement.classList.contains('btn-delete')) {
    const id = clickedElement.dataset.id;
    // .dataset.id reads the data-id="123" attribute from the HTML
    deleteExpense(id);
  }

  // Was an Edit button clicked?
  if (clickedElement.classList.contains('btn-edit')) {
    const id = clickedElement.dataset.id;
    startEdit(id);
  }
});


/* ============================================================
  STEP 9 — FILTER EVENT LISTENERS
  ============================================================
  'input' event fires every time the value changes —
  as the user types (for text) or immediately on change (for selects).
  This gives us live/instant filtering with no "Search" button needed.
============================================================ */

searchInput.addEventListener('input', renderExpenses);
filterCategory.addEventListener('change', renderExpenses);
filterType.addEventListener('change', renderExpenses);
// Each one just calls renderExpenses(), which reads current filter values


/* ============================================================
  STEP 10 — VALIDATION (same as Stage 3)
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
  INITIAL RENDER
============================================================ */

renderExpenses();


/*
  ============================================================
  WHAT TO DO NEXT

  EXERCISE A — Test event delegation:
  Add an expense. Open DevTools → Elements.
  Find the <ul id="expense-list">.
  Notice there is only ONE event listener on it (shown in DevTools
  under "Event Listeners" tab) — not one per button.

  EXERCISE B — Understand spread:
  In the console:
  const a = { x: 1, y: 2 };
  const b = { ...a, y: 99 };
  console.log(b); // { x: 1, y: 99 }
  Notice x was copied, y was overridden.

  EXERCISE C — Test the filters:
  Add 5 expenses with different categories.
  Type in the search box — the list should narrow instantly.
  Change the category dropdown — should filter further.
  Clear the search — should show all category-filtered items.

  EXERCISE D — Add a "Sort by date" dropdown:
  1. Add a <select id="sort-order"> to the HTML with options:
     newest first, oldest first
  2. Add const sortOrder = document.getElementById('sort-order');
  3. In getFilteredExpenses(), before returning, add:
     if (sortOrder.value === 'oldest') {
       result.sort((a, b) => new Date(a.date) - new Date(b.date));
     } else {
       result.sort((a, b) => new Date(b.date) - new Date(a.date));
     }
  4. Add sortOrder.addEventListener('change', renderExpenses);

  When you're ready, add localStorage in Stage 5.
  ============================================================
*/
