#!/bin/bash
# ProdFlux Frontend Startup Script

echo "🚀 Starting ProdFlux Frontend (Angular)..."

# Navigate to frontend directory
cd /Users/Shared/dev/prodflux/prodflux-frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

# Start Angular development server
echo "📡 Starting Angular development server..."
echo "🌐 Frontend will be available at: http://localhost:4200"
echo "🔧 Make sure backend is running at: http://localhost:8000"
echo "🛑 Press CTRL+C to stop the server"
echo ""

ng serve --host 0.0.0.0 --port 4200