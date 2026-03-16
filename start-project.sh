#!/bin/bash

# Script to start the EcoScorer project

echo "Starting EcoScorer Project..."
echo

echo "Setting up server..."
cd server
echo "Installing server dependencies..."
npm install >/dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Warning: Error installing server dependencies, continuing anyway..."
fi

echo "Generating Prisma client..."
npx prisma generate >/dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Warning: Error generating Prisma client, continuing anyway..."
fi

echo "Starting server on port 3001..."
(npm run dev) &

sleep 5

echo
echo "Setting up client..."
cd ../client
echo "Installing client dependencies..."
npm install >/dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Warning: Error installing client dependencies, continuing anyway..."
fi

echo "Starting client on port 5173..."
(npm run dev) &

echo
echo "The application is now running!"
echo "- Client: http://localhost:5173"
echo "- Server: http://localhost:3001"
echo

echo "Press Ctrl+C to exit"
wait