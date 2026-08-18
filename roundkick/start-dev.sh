#!/bin/bash

echo "Starting Customer Portal Development Environment"
echo "==============================================="

echo "Checking if MongoDB is running..."
if ! nc -z localhost 27017 2>/dev/null; then
    echo "WARNING: MongoDB does not appear to be running on port 27017"
    echo "Please start MongoDB first, then run this script again"
    exit 1
fi

echo "MongoDB appears to be running. Starting services..."

echo "Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!

sleep 3

echo "Starting frontend server..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "Services starting up..."
echo "Backend will be available at: http://localhost:5000"
echo "Frontend will be available at: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
