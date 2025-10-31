const socket = io();

const channelList = document.querySelector('#channel-list');
const messageList = document.querySelector('#message-list');
const messagePane = document.querySelector('#message-pane');
const messageTemplate = document.querySelector('#message-template');
const messageForm = document.querySelector('#message-form');
const messageInput = document.querySelector('#message-input');
const displayNameInput = document.querySelector('#display-name');
const channelNameEl = document.querySelector('#channel-name');
const channelDescriptionEl = document.querySelector('#channel-description');
const createChannelButton = document.querySelector('#create-channel');

let channels = [];
let activeChannelId = null;
let messagesCache = new Map();

function loadDisplayName() {
  const stored = localStorage.getItem('display-name');
  if (stored) {
    displayNameInput.value = stored;
  }
}

function saveDisplayName() {
  const value = displayNameInput.value.trim();
  if (value) {
    localStorage.setItem('display-name', value);
  } else {
    localStorage.removeItem('display-name');
  }
}

displayNameInput.addEventListener('change', saveDisplayName);

displayNameInput.addEventListener('blur', () => {
  if (!displayNameInput.value.trim()) {
    displayNameInput.value = 'Guest';
    saveDisplayName();
  }
});

function formatTimestamp(ts) {
  const date = new Date(ts);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function renderChannels() {
  channelList.innerHTML = '';
  channels.forEach((channel) => {
    const li = document.createElement('li');
    li.className = 'channel';
    if (channel.id === activeChannelId) {
      li.classList.add('active');
    }

    const hash = document.createElement('span');
    hash.className = 'hash';
    hash.textContent = '#';

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = channel.name;

    li.append(hash, name);
    li.addEventListener('click', () => selectChannel(channel.id));
    channelList.appendChild(li);
  });
}

function renderMessages(channelId) {
  const messages = messagesCache.get(channelId) || [];
  messageList.innerHTML = '';

  if (!messages.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No messages yet. Break the ice!';
    messageList.appendChild(empty);
    return;
  }

  messages.forEach((message) => {
    const node = messageTemplate.content.cloneNode(true);
    const avatar = node.querySelector('.avatar');
    const author = node.querySelector('.author');
    const timestamp = node.querySelector('.timestamp');
    const body = node.querySelector('.body');

    const initials = message.user
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    avatar.textContent = initials || '🙂';
    author.textContent = message.user;
    timestamp.textContent = formatTimestamp(message.timestamp);
    body.textContent = message.text;

    messageList.appendChild(node);
  });

  messagePane.scrollTo({ top: messagePane.scrollHeight, behavior: 'smooth' });
}

async function fetchChannels() {
  const response = await fetch('/api/channels');
  channels = await response.json();
  if (!channels.length) {
    channelNameEl.textContent = 'No channels yet';
    channelDescriptionEl.textContent = 'Create a channel to get started.';
  }
  renderChannels();
  if (!activeChannelId && channels.length) {
    selectChannel(channels[0].id);
  }
}

async function fetchMessages(channelId) {
  const response = await fetch(`/api/channels/${channelId}/messages`);
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  messagesCache.set(channelId, data);
  return data;
}

async function selectChannel(channelId) {
  if (activeChannelId === channelId) return;

  activeChannelId = channelId;
  renderChannels();

  const channel = channels.find((c) => c.id === channelId);
  if (!channel) return;

  channelNameEl.textContent = `#${channel.name}`;
  channelDescriptionEl.textContent = channel.description || 'Conversation space';

  if (!messagesCache.has(channelId)) {
    await fetchMessages(channelId);
  }
  renderMessages(channelId);

  socket.emit('channel:subscribe', channelId);
}

messageForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!activeChannelId) {
    alert('Select a channel first.');
    return;
  }
  const text = messageInput.value.trim();
  if (!text) return;

  const user = displayNameInput.value.trim() || 'Guest';
  socket.emit('message:send', { channelId: activeChannelId, user, text });
  messageInput.value = '';
  messageInput.focus();
});

createChannelButton.addEventListener('click', async () => {
  const name = prompt('Channel name');
  if (!name) return;
  const description = prompt('Channel description (optional)') || '';

  const response = await fetch('/api/channels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  });

  if (!response.ok) {
    alert('Could not create channel.');
  }
});

socket.on('channel:created', (channel) => {
  channels.push(channel);
  renderChannels();
  if (!activeChannelId) {
    selectChannel(channel.id);
  }
});

socket.on('message:new', ({ channelId, message }) => {
  const list = messagesCache.get(channelId) || [];
  list.push(message);
  messagesCache.set(channelId, list);
  if (channelId === activeChannelId) {
    renderMessages(channelId);
  }
});

loadDisplayName();
fetchChannels();
