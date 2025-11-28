#!/bin/bash
# ProdFlux Backend Startup Script

# Port Configuration
BACKEND_PORT=8001

echo "🚀 Starting ProdFlux Backend (Django)..."

# Navigate to project directory
cd /Users/Shared/dev/prodflux

# Add PostgreSQL 16 to PATH for database support
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

# Kill any existing processes on the backend port
echo "🧹 Cleaning up existing processes on port $BACKEND_PORT..."
DJANGO_PIDS=$(lsof -ti:$BACKEND_PORT 2>/dev/null || true)
if [ -n "$DJANGO_PIDS" ]; then
    echo "$DJANGO_PIDS" | xargs kill -9 2>/dev/null || true
    echo "✓ Stopped existing process on port $BACKEND_PORT"
    sleep 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run setup first."
    exit 1
fi

# Start Django backend only
echo "📡 Starting Django API server..."
echo "🌐 Backend API will be available at: http://localhost:$BACKEND_PORT/api/"
echo "🔧 Admin interface at: http://localhost:$BACKEND_PORT/admin/"
echo "📋 Start frontend separately with: cd prodflux-frontend && ng serve --port 4201"
echo "🛑 Press CTRL+C to stop the server"
echo ""

/Users/Shared/dev/prodflux/venv/bin/python manage.py runserver 0.0.0.0:$BACKEND_PORT