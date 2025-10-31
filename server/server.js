const path = require('path');
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { v4: uuid } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const channels = new Map();

function seedData() {
  const generalId = uuid();
  const randomId = uuid();

  channels.set(generalId, {
    id: generalId,
    name: 'general',
    description: 'Company-wide announcements and work-related matters.',
    messages: [
      {
        id: uuid(),
        user: 'Ava Harper',
        text: 'Welcome to the Slack Clone demo! Feel free to explore and add new channels.',
        timestamp: Date.now() - 1000 * 60 * 60,
      },
      {
        id: uuid(),
        user: 'Jordan Lee',
        text: 'This space is built with Express, Socket.IO, and a vanilla JS front-end.',
        timestamp: Date.now() - 1000 * 60 * 45,
      },
    ],
  });

  channels.set(randomId, {
    id: randomId,
    name: 'random',
    description: 'Casual watercooler chatter and fun finds.',
    messages: [
      {
        id: uuid(),
        user: 'Morgan Wu',
        text: 'Drop your weekend plans here! 🍕',
        timestamp: Date.now() - 1000 * 60 * 15,
      },
    ],
  });
}

seedData();

app.get('/api/channels', (req, res) => {
  const list = Array.from(channels.values()).map(({ id, name, description }) => ({
    id,
    name,
    description,
  }));
  res.json(list);
});

app.get('/api/channels/:channelId/messages', (req, res) => {
  const channel = channels.get(req.params.channelId);
  if (!channel) {
    return res.status(404).json({ error: 'Channel not found' });
  }
  res.json(channel.messages);
});

app.post('/api/channels', (req, res) => {
  const { name, description } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Channel name is required' });
  }
  const id = uuid();
  const channel = {
    id,
    name,
    description: description || 'A brand-new space to collaborate.',
    messages: [],
  };
  channels.set(id, channel);
  io.emit('channel:created', channel);
  res.status(201).json(channel);
});

io.on('connection', (socket) => {
  socket.on('channel:subscribe', (channelId) => {
    if (!channels.has(channelId)) {
      return;
    }
    socket.join(channelId);
  });

  socket.on('message:send', ({ channelId, user, text }) => {
    const channel = channels.get(channelId);
    if (!channel || !text || !user) {
      return;
    }
    const message = {
      id: uuid(),
      user: String(user).slice(0, 50),
      text: String(text).slice(0, 2000),
      timestamp: Date.now(),
    };
    channel.messages.push(message);
    io.to(channelId).emit('message:new', { channelId, message });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Slack Clone server running on http://localhost:${PORT}`);
});
