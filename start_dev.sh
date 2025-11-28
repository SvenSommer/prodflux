#!/bin/bash
# Complete ProdFlux Development Setup

# Port Configuration (change these to avoid conflicts with other projects)
BACKEND_PORT=8001
FRONTEND_PORT=4201

echo "🚀 Starting Complete ProdFlux Development Environment..."

# Kill any existing servers first
echo "🧹 Cleaning up existing servers..."

# Kill Django (Python) processes on configured port
DJANGO_PIDS=$(lsof -ti:$BACKEND_PORT 2>/dev/null || true)
if [ -n "$DJANGO_PIDS" ]; then
    echo "$DJANGO_PIDS" | xargs kill -9 2>/dev/null || true
    echo "✓ Stopped existing Django server on port $BACKEND_PORT"
fi

# Kill Angular (Node) processes on configured port
ANGULAR_PIDS=$(lsof -ti:$FRONTEND_PORT 2>/dev/null || true)
if [ -n "$ANGULAR_PIDS" ]; then
    echo "$ANGULAR_PIDS" | xargs kill -9 2>/dev/null || true
    echo "✓ Stopped existing Angular server on port $FRONTEND_PORT"
fi

# Also kill any processes named "python manage.py runserver" or "ng serve"
pkill -f "manage.py runserver" 2>/dev/null || true
pkill -f "ng serve" 2>/dev/null || true

sleep 1
echo ""

# Function to kill processes on exit
cleanup() {
    echo "🛑 Stopping all services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Set up trap for cleanup
trap cleanup INT TERM

# Navigate to project directory
cd /Users/Shared/dev/prodflux

echo "📡 Starting Backend (Django) at http://localhost:$BACKEND_PORT..."
/Users/Shared/dev/prodflux/venv/bin/python manage.py runserver 0.0.0.0:$BACKEND_PORT &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

echo "🌐 Starting Frontend (Angular) at http://localhost:$FRONTEND_PORT..."
cd prodflux-frontend
ng serve --host 0.0.0.0 --port $FRONTEND_PORT &
FRONTEND_PID=$!

echo ""
echo "✅ Both services are starting..."
echo "🌐 Frontend: http://localhost:$FRONTEND_PORT"
echo "📡 Backend API: http://localhost:$BACKEND_PORT/api/"
echo "🔧 Admin: http://localhost:$BACKEND_PORT/admin/"
echo ""
echo "🛑 Press CTRL+C to stop both services"

# Wait for both processes
wait