# EcoScorer - Car Telemetry Application

This is a full-stack application that tracks car telemetry data and provides eco-driving scores to help users drive more efficiently and reduce emissions.

## Project Structure

- `client`: React frontend application built with Vite
- `server`: Express.js backend with Prisma ORM and SQLite database

## Features

- User authentication (register/login)
- Vehicle management
- Real-time telemetry data tracking
- Driving behavior analysis
- Emissions tracking
- Leaderboard functionality
- WebSocket support for real-time updates

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install server dependencies:

```bash
cd server
npm install
```

2. Install client dependencies:

```bash
cd ../client
npm install
```

### Database Setup

1. Make sure you have the `.env` file in the server directory with the database URL:

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
PORT=3001
```

2. Run the Prisma migration:

```bash
cd server
npx prisma migrate dev
```

3. Generate Prisma client:

```bash
npx prisma generate
```

### Running the Application

1. Start the server:

```bash
cd server
npm run dev
```

2. In a new terminal, start the client:

```bash
cd client
npm run dev
```

The application will be available at `http://localhost:5173`

### Testing with Sample Data

To generate sample telemetry data, you can use the included script:

```bash
cd server
node scripts/generator.js
```

This script will register a test user if one doesn't exist, create a vehicle, and start sending simulated telemetry data.

### API Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/vehicles` - Get user's vehicles
- `POST /api/vehicles` - Create a new vehicle
- `POST /api/telemetry` - Send telemetry data
- `GET /api/leaderboard` - Get leaderboard data

### Tech Stack

#### Frontend
- React 19
- Vite
- Tailwind CSS
- React Router v7
- Socket.io-client
- Recharts

#### Backend
- Express.js
- Prisma ORM
- SQLite
- JSON Web Tokens (JWT)
- Bcryptjs for password hashing
- Socket.io for real-time communication

## Development

The application uses a proxy in the Vite configuration to forward API requests to the server running on port 3001.

## Troubleshooting

If you encounter issues with Prisma, try:

1. Ensure you have the `.env` file configured correctly in the server directory
2. Run `npx prisma generate` to regenerate the Prisma client
3. Run `npx prisma migrate reset` to reset the database if needed

For frontend issues, make sure you're running the development server with `npm run dev` to get HMR and proxy features.