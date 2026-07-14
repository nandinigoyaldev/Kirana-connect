# Kirana Connect - Hyperlocal Retail Operating System

Kirana Connect is an AI-powered hyperlocal retail operating system that connects local customers, kirana store owners (merchants), delivery partners, and platform administrators. The platform modernizes neighborhood commerce through real-time inventory synchronization, AI-driven basket split-optimization, speech-to-inventory parsing, and OCR receipt digitizing.

---

## 🏗️ Architecture & Technology Stack

The application is structured as a unified full-stack Node.js monorepo:

### Frontend (Client)
- **Framework**: React 19 (via Vite)
- **Routing**: React Router DOM v6
- **State Management**: React Context API (`AuthContext`, `CartContext`)
- **Styling**: Modern CSS Custom Properties (Vanilla CSS) for layout, cards, and custom micro-interactions
- **Icons**: Lucide React
- **Feeds & Tracking**: WebSocket Client (`socket.io-client`) for real-time inventory updates and driver location mapping

### Backend (Server)
- **Runtime**: Node.js v26
- **Server**: Express
- **Real-Time Layer**: Socket.io (WebSockets)
- **Auth**: JSON Web Tokens (JWT) for secure authentication across roles
- **Database Layer**: Dual-mode MongoDB integration via Mongoose with an automatic local JSON file database fallback (`server/data/local_db.json`)

---

## ⚡ Key Core Engines

### 1. Hybrid DB Storage Engine (Fallback System)
To guarantee the system runs immediately in any local environment, [server/config/db.js](server/config/db.js) implements a database proxy layer:
- It attempts to establish a connection to a MongoDB database using `MONGODB_URI` from the environment.
- If no connection is active, it initializes an **in-memory/file-based database** seeded from [server/data/seedData.json](server/data/seedData.json).
- Writes and updates are automatically committed back to [server/data/local_db.json](server/data/local_db.json) in real-time, preserving states across server restarts.

### 2. AI Basket Splitting Algorithm
The Basket Optimizer evaluates cart checkouts:
- It calculates the cost of buying all products from a single store (adding delivery charges and tax).
- It concurrently runs a heuristic pricing scan across all local store listings to find the cheapest individual store for each item.
- It sums up the split totals (including individual store delivery fees and tax weights) and compares them against single-store orders.
- It returns the cheapest overall checkout path (Single vs. Split), detailing the cost breakdown, savings, and an AI recommendation score.

### 3. Speech-to-Inventory Translation
Shopkeepers can speak or write natural language updates (e.g., *"Add 20 packets of Amul Milk"*). The natural language parser:
- Extracts actions (`increase`/`decrease` stock levels).
- Isolates target quantities from spoken numerals.
- Runs a keyword-matching scan on product databases and translates the speech pattern into database updates, emitting WebSocket alerts to update active customer screens.

### 4. OCR Invoice Processing
Integrates receipt scanning for stock intake:
- Emulates document structure recognition and character parsing.
- Extracts line items, quantities, and pricing levels with confidence logs.
- Syncs directly to the shopkeeper's store inventory database.

---

## 📂 Project Directory Structure

```
kirana_connect/
├── client/ (built in root src)
│   ├── src/
│   │   ├── context/        # Auth & Cart Shared State
│   │   ├── pages/          # 15 Responsive Role-based Pages
│   │   ├── index.css       # Vanilla CSS Design System
│   │   └── App.jsx         # App Routing & Demo Role Switcher
├── server/
│   ├── config/             # DB Config & Mongoose Schemas
│   ├── data/               # Seed data and fallback JSON databases
│   └── server.js           # Express API Routing & Socket.io WebSockets
├── package.json            # Unified execution configurations
└── vite.config.js          # Proxy setups
```

---

## 🚀 Installation & Local Startup

### 1. Clone the repository and install dependencies
```bash
npm install
```

### 2. Start the Application
You can launch both the React client dev server and the Express API server concurrently with a single command:
```bash
npm run dev
```

The system will start:
- **Frontend App (Vite)**: [http://localhost:5173/](http://localhost:5173/)
- **Backend API Server (Node/Express)**: [http://localhost:5001/](http://localhost:5001/) (configured on `5001` to prevent conflicts with macOS AirPlay services)

---

## 🎭 Sandbox Demo Role Switching
A floating control bar **"Switch Roles Demo"** is present on the bottom-right corner. Use this widget to dynamically switch between test profiles:
- **Customer**: Compare prices, add products, optimize checkout splits, simulate Razorpay payments, and watch orders on a live map stepper.
- **Shopkeeper**: Pack orders, toggle product availability, scan invoice templates, log items by dictating spoken commands, and view analytics charts.
- **Driver (Delivery)**: Accept routes, confirm driver pickups, verify deliveries using OTP code `1234`, and withdraw earnings.
- **Admin**: Audit platform transactions, config pricing fees, and inspect security alerts (e.g., geofence deviations).
