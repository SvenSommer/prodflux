#!/bin/bash
# ProdFlux Backend Startup Script

echo "🚀 Starting ProdFlux Backend (Django)..."

# Navigate to project directory
cd /Users/Shared/dev/prodflux

# Add PostgreSQL 16 to PATH for database support
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run setup first."
    exit 1
fi

# Start Django backend only
echo "📡 Starting Django API server..."
echo "🌐 Backend API will be available at: http://localhost:8000/api/"
echo "🔧 Admin interface at: http://localhost:8000/admin/"
echo "📋 Start frontend separately with: cd prodflux-frontend && ng serve"
echo "🛑 Press CTRL+C to stop the server"
echo ""

/Users/Shared/dev/prodflux/venv/bin/python manage.py runserver 0.0.0.0:8000