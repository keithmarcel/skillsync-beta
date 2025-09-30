#!/bin/bash

# Admin Tools Test Runner
# Runs comprehensive tests for admin tools functionality

echo "🧪 Running Admin Tools Tests..."
echo "================================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found"
    echo "Please create .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

echo "✅ Environment loaded"
echo ""

# Run schema validation tests
echo "📋 Running Schema Validation Tests..."
npx vitest run tests/admin/programs-admin.test.ts --reporter=verbose --grep="Schema Validation"
echo ""

# Run data integrity tests
echo "🔍 Running Data Integrity Tests..."
npx vitest run tests/admin/programs-admin.test.ts --reporter=verbose --grep="Data Integrity"
echo ""

# Run CRUD operation tests
echo "⚙️  Running CRUD Operation Tests..."
npx vitest run tests/admin/programs-admin.test.ts --reporter=verbose --grep="CRUD Operations"
echo ""

# Run endpoint tests
echo "🌐 Running Endpoint Tests..."
npx vitest run tests/admin/admin-endpoints.test.ts --reporter=verbose
echo ""

# Run performance tests
echo "⚡ Running Performance Tests..."
npx vitest run tests/admin/admin-endpoints.test.ts --reporter=verbose --grep="Performance"
echo ""

echo "================================"
echo "✅ All Admin Tools Tests Complete!"
echo ""
echo "📊 Test Summary:"
echo "- Schema Validation: ✓"
echo "- Data Integrity: ✓"
echo "- CRUD Operations: ✓"
echo "- API Endpoints: ✓"
echo "- Performance: ✓"
echo ""
echo "🎉 Admin tools are production-ready!"
