# Drawixa

Drawixa is a real-time collaborative digital whiteboard application that allows multiple users to draw, collaborate, and export canvas boards simultaneously.

## Features

- Real-Time Collaboration: Sync drawings, updates, and active participants instantly using WebSockets.
- Digital Whiteboard Canvas: Rich drawing tools powered by Fabric.js.
- Export Capabilities: Export canvas boards to PDF and other formats.
- User Authentication: Secure user signup, login, and board management with JSON Web Tokens (JWT).
- Responsive Interface: Styled using Tailwind CSS with animations handled by Framer Motion.

## Technology Stack

### Frontend (Client)
- React
- Vite
- Fabric.js (Canvas library)
- Socket.io-client (Real-time events)
- Tailwind CSS (Styling)
- Framer Motion (Transitions and animations)
- jsPDF & pdfjs-dist (PDF export/rendering support)

### Backend (Server)
- Node.js
- Express
- MongoDB (Database)
- Mongoose (Object Data Modeling)
- Socket.io (WebSocket server)
- JSON Web Tokens (JWT) & bcryptjs (Authentication)

## Project Structure

```text
Drawixa/
├── client/          # Frontend application (React + Vite)
│   ├── src/         # React source files
│   └── public/      # Static assets
└── server/          # Backend server (Express + Socket.io)
    ├── models/      # MongoDB schemas
    ├── routes/      # REST API endpoints
    └── server.js    # Entry point and socket handlers
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB database (local or MongoDB Atlas cluster)

### Server Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the server directory with the following variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Client Setup

1. Navigate to the client directory:
   ```bash
   cd ../client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the client directory with the following variables:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

---
Developed by S Sanjith Kumar

