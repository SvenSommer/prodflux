#!/bin/bash
# ProdFlux Frontend Startup Script

# Port Configuration
FRONTEND_PORT=4201
BACKEND_PORT=8001

echo "🚀 Starting ProdFlux Frontend (Angular)..."

# Kill any existing processes on the frontend port
echo "🧹 Cleaning up existing processes on port $FRONTEND_PORT..."
ANGULAR_PIDS=$(lsof -ti:$FRONTEND_PORT 2>/dev/null || true)
if [ -n "$ANGULAR_PIDS" ]; then
    echo "$ANGULAR_PIDS" | xargs kill -9 2>/dev/null || true
    echo "✓ Stopped existing process on port $FRONTEND_PORT"
    sleep 1
fi

# Navigate to frontend directory
cd /Users/Shared/dev/prodflux/prodflux-frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

# Start Angular development server
echo "📡 Starting Angular development server..."
echo "🌐 Frontend will be available at: http://localhost:$FRONTEND_PORT"
echo "🔧 Make sure backend is running at: http://localhost:$BACKEND_PORT"
echo "🛑 Press CTRL+C to stop the server"
echo ""

ng serve --host 0.0.0.0 --port $FRONTEND_PORT