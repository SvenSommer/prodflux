#!/bin/bash
# Complete ProdFlux Development Setup

echo "🚀 Starting Complete ProdFlux Development Environment..."

# Kill any existing servers first
echo "🧹 Cleaning up existing servers..."

# Kill Django (Python) processes on port 8000
DJANGO_PIDS=$(lsof -ti:8000 2>/dev/null || true)
if [ -n "$DJANGO_PIDS" ]; then
    echo "$DJANGO_PIDS" | xargs kill -9 2>/dev/null || true
    echo "✓ Stopped existing Django server"
fi

# Kill Angular (Node) processes on port 4200
ANGULAR_PIDS=$(lsof -ti:4200 2>/dev/null || true)
if [ -n "$ANGULAR_PIDS" ]; then
    echo "$ANGULAR_PIDS" | xargs kill -9 2>/dev/null || true
    echo "✓ Stopped existing Angular server"
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

echo "📡 Starting Backend (Django) at http://localhost:8000..."
/Users/Shared/dev/prodflux/venv/bin/python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

echo "🌐 Starting Frontend (Angular) at http://localhost:4200..."
cd prodflux-frontend
ng serve --host 0.0.0.0 --port 4200 &
FRONTEND_PID=$!

echo ""
echo "✅ Both services are starting..."
echo "🌐 Frontend: http://localhost:4200"
echo "📡 Backend API: http://localhost:8000/api/"
echo "🔧 Admin: http://localhost:8000/admin/"
echo ""
echo "🛑 Press CTRL+C to stop both services"

# Wait for both processes
wait