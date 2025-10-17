#!/bin/bash

# AI Generation System Test Runner
# Installs dependencies and runs comprehensive test suite

set -e

echo "🚀 AI Generation System Test Runner"
echo "==================================="

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    echo "Please create .env.local with required environment variables:"
    echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "SUPABASE_SERVICE_ROLE_KEY=your_service_key"
    echo "OPENAI_API_KEY=your_openai_key"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if app is running
echo "🔍 Checking if app is running..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ App is already running"
else
    echo "ℹ️  Starting app in background..."
    npm run dev &
    APP_PID=$!

    # Wait for app to start
    echo "⏳ Waiting for app to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null; then
            echo "✅ App started successfully"
            break
        fi
        sleep 2
        if [ $i -eq 30 ]; then
            echo "❌ App failed to start within 60 seconds"
            kill $APP_PID 2>/dev/null || true
            exit 1
        fi
    done
fi

# Run tests
echo "🧪 Running comprehensive test suite..."
echo ""

# Run database tests first
echo "🗄️  Running database integrity tests..."
if npm run test:database; then
    echo "✅ Database tests passed"
else
    echo "❌ Database tests failed"
    exit 1
fi

echo ""

# Run API tests
echo "🔗 Running API functionality tests..."
if npm run test:apis; then
    echo "✅ API tests passed"
else
    echo "❌ API tests failed"
    exit 1
fi

echo ""

# Run integration tests
echo "🔄 Running system integration tests..."
if npm run test:ai-system; then
    echo "✅ Integration tests passed"
else
    echo "❌ Integration tests failed"
    exit 1
fi

echo ""

# Run E2E tests
echo "🌐 Running frontend E2E tests..."
if npm run test:e2e; then
    echo "✅ E2E tests passed"
else
    echo "❌ E2E tests failed"
    exit 1
fi

echo ""
echo "🎉 ALL TESTS PASSED!"
echo "======================"
echo "✅ Database integrity verified"
echo "✅ API endpoints functional"
echo "✅ System integration working"
echo "✅ Frontend E2E flows working"
echo ""
echo "🚀 AI Generation System is PRODUCTION READY!"
echo ""
echo "Next steps:"
echo "1. Deploy to staging environment"
echo "2. Run tests in staging: npm run test:all"
echo "3. Deploy to production"
echo "4. Monitor system health"

# Kill background app if we started it
if [ ! -z "$APP_PID" ]; then
    echo ""
    echo "🛑 Stopping background app..."
    kill $APP_PID 2>/dev/null || true
fi
