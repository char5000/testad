const STORAGE_KEY = 'todo-list-items-v1';

const state = {
  items: loadItems(),
  filter: 'all',
};

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const filterButtons = document.querySelectorAll('.todo-controls [data-filter]');
const clearCompletedButton = document.getElementById('clear-completed');
const itemTemplate = document.getElementById('todo-item-template');

document.addEventListener('DOMContentLoaded', () => {
  render();
  form.addEventListener('submit', handleSubmit);
  list.addEventListener('click', handleListClick);
  filterButtons.forEach((button) =>
    button.addEventListener('click', handleFilterClick)
  );
  clearCompletedButton.addEventListener('click', handleClearCompleted);
});

function handleSubmit(event) {
  event.preventDefault();
  const title = input.value.trim();
  if (!title) {
    return;
  }

  state.items = [
    {
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    },
    ...state.items,
  ];
  input.value = '';
  persist();
  render();
}

function handleListClick(event) {
  const listItem = event.target.closest('.todo-item');
  if (!listItem) {
    return;
  }

  const id = listItem.dataset.id;
  if (event.target.matches('input[type="checkbox"]')) {
    toggleCompletion(id, event.target.checked);
  } else if (event.target.matches('.todo-item__delete')) {
    deleteItem(id);
  }
}

function handleFilterClick(event) {
  const filter = event.target.dataset.filter;
  state.filter = filter;
  filterButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.filter === filter);
  });
  renderList();
}

function handleClearCompleted() {
  state.items = state.items.filter((item) => !item.completed);
  persist();
  render();
}

function toggleCompletion(id, completed) {
  state.items = state.items.map((item) =>
    item.id === id ? { ...item, completed } : item
  );
  persist();
  renderList();
}

function deleteItem(id) {
  state.items = state.items.filter((item) => item.id !== id);
  persist();
  render();
}

function render() {
  renderList();
}

function renderList() {
  list.innerHTML = '';
  const items = getVisibleItems();
  if (items.length === 0) {
    list.innerHTML = '<li class="empty">No tasks yet. Enjoy your day!</li>';
    return;
  }

  const fragment = document.createDocumentFragment();
  items.forEach((item) => {
    const element = itemTemplate.content.firstElementChild.cloneNode(true);
    element.dataset.id = item.id;
    element.classList.toggle('completed', item.completed);
    const checkbox = element.querySelector('input[type="checkbox"]');
    checkbox.checked = item.completed;
    element.querySelector('.todo-item__title').textContent = item.title;
    fragment.appendChild(element);
  });

  list.appendChild(fragment);
}

function getVisibleItems() {
  switch (state.filter) {
    case 'active':
      return state.items.filter((item) => !item.completed);
    case 'completed':
      return state.items.filter((item) => item.completed);
    default:
      return state.items;
  }
}

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    console.warn('Failed to load saved tasks', error);
    return [];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
}
