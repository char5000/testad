# Slack Clone Demo

A polished, single-repo Slack-style collaboration app. The project ships with an Express + Socket.IO backend and a modern vanilla JavaScript front-end that mimics Slack's layout, channel management, and real-time messaging.

## Features

- Workspace sidebar with channel list and quick channel creation dialog
- Channel detail pane with description, message history, and smooth autoscroll
- Real-time messaging powered by Socket.IO rooms
- Persistent display name stored locally for a personalized feel
- Elegant, responsive design inspired by Slack's modern aesthetic

## Tech Stack

- **Backend:** Node.js, Express, Socket.IO
- **Frontend:** Static HTML, modern vanilla JS, and CSS (no build step)

## Getting Started

```bash
npm install
npm run start
```

Then open your browser to [http://localhost:3000](http://localhost:3000).

The server serves the API and the front-end bundle from `server/public` so no additional build tooling is required. When using `npm run dev`, changes to the server restart automatically thanks to nodemon.

## Project Structure

```
.
├── package.json
├── README.md
└── server
    ├── public
    │   ├── app.js
    │   ├── index.html
    │   └── styles.css
    └── server.js
```

## Future Enhancements

- Persist data to a database such as PostgreSQL or MongoDB
- Add authentication and user presence indicators
- Support file uploads, threads, and reactions
- Provide search and channel member management

Feel free to fork the project and iterate! PRs are welcome.
