# AI Generation System - Comprehensive Test Suite

This directory contains a complete testing system for the AI-powered question generation feature in SkillSync. Instead of fixing issues reactively, this test suite allows you to run comprehensive tests to verify the entire system works end-to-end.

## 🧪 Test Overview

The testing system covers all layers of the AI generation system:

### **1. Database Layer** (`test-database-integrity.js`)
- Schema validation
- Foreign key constraints
- Data integrity checks
- Performance benchmarks

### **2. API Layer** (`test-ai-apis.js`)
- Endpoint functionality
- Request/response validation
- Error handling
- Performance testing

### **3. Integration Layer** (`test-ai-generation-system.js`)
- Full workflow testing
- Cross-component integration
- End-to-end data flow
- System performance

### **4. Frontend E2E** (`test-frontend-e2e.js`)
- Browser automation
- User workflow testing
- UI responsiveness
- Accessibility checks

## 🚀 Quick Start

### Prerequisites

```bash
# Install test dependencies
npm install

# Make sure the app is running
npm run dev

# In another terminal, set environment variables
export NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
export SUPABASE_SERVICE_ROLE_KEY="your_service_key"
```

### Run All Tests

```bash
npm run test:all
```

This runs all tests in sequence and provides a comprehensive report.

### Run Individual Test Suites

```bash
# Database integrity tests
npm run test:database

# API functionality tests
npm run test:apis

# Full system integration tests
npm run test:ai-system

# Frontend E2E tests (requires puppeteer)
npm run test:e2e
```

## 📋 Test Details

### Database Tests
- ✅ Table schema validation
- ✅ Foreign key relationships
- ✅ Data type constraints
- ✅ Query performance monitoring
- ✅ Referential integrity

### API Tests
- ✅ Endpoint availability
- ✅ Request validation
- ✅ Response format validation
- ✅ Error handling
- ✅ Performance benchmarks
- ✅ Different proficiency levels

### Integration Tests
- ✅ Complete AI generation workflow
- ✅ Database persistence
- ✅ Data consistency
- ✅ Cross-component communication
- ✅ Error recovery

### E2E Tests
- ✅ Page loading and navigation
- ✅ UI component visibility
- ✅ User interaction flows
- ✅ Responsive design
- ✅ Browser compatibility

## 🔍 Test Architecture

Each test follows a consistent pattern:

```javascript
function test(name, fn) {
  return async () => {
    try {
      log(`Testing: ${name}`)
      await fn()
      results.passed++
      log(`${name} - PASSED`, 'success')
    } catch (error) {
      results.failed++
      log(`${name} - FAILED: ${error.message}`, 'error')
    }
  }
}
```

Tests include:
- **Setup**: Create test data
- **Execution**: Run the functionality
- **Validation**: Check results
- **Cleanup**: Remove test data

## 📊 Test Reports

All tests provide detailed console output:

```
🧪 AI GENERATION SYSTEM TEST RESULTS
============================================================
✅ Passed: 25
❌ Failed: 0
📊 Total: 25

🎉 ALL TESTS PASSED! AI Generation System is fully operational.
```

Failed tests show specific error details for debugging.

## 🛠️ Debugging Failed Tests

When tests fail, check:

1. **Environment Variables**: Ensure all required env vars are set
2. **Database State**: Verify test data exists and is accessible
3. **App Running**: Make sure `npm run dev` is running on port 3000
4. **Dependencies**: Run `npm install` to ensure all packages are installed

### Common Issues

- **Database Connection**: Check Supabase credentials
- **Missing Data**: Tests create their own data, but may need existing reference data
- **Port Conflicts**: Ensure port 3000 is available
- **Rate Limits**: OpenAI API has rate limits that may cause test failures

## 🔧 Test Configuration

Tests are configured via environment variables:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Optional
OPENAI_API_KEY=your_openai_key  # For API tests
```

## 📈 Performance Benchmarks

Tests include performance validation:

- **Database Queries**: < 5 seconds
- **AI Generation**: < 45 seconds for expert level
- **API Responses**: < 30 seconds
- **Page Loads**: < 10 seconds

## 🎯 Test Coverage

The test suite covers:

- ✅ **Happy Path**: Normal operation scenarios
- ✅ **Error Cases**: Invalid inputs, missing data
- ✅ **Edge Cases**: Empty data, large datasets
- ✅ **Performance**: Speed and resource usage
- ✅ **Integration**: Component interactions
- ✅ **UI/UX**: User experience validation

## 🚨 CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Run AI System Tests
  run: |
    npm run dev &
    sleep 10
    npm run test:all
```

## 📝 Contributing

When adding new features to the AI generation system:

1. Add corresponding tests to the appropriate test file
2. Update this README if new test categories are added
3. Ensure all tests pass before merging

## 🆘 Troubleshooting

### Test Fails with "App not responding"
- Ensure `npm run dev` is running
- Check that port 3000 is not blocked
- Verify environment variables are set

### Database Tests Fail
- Check Supabase connection
- Verify database migrations are applied
- Ensure test data is available

### API Tests Fail
- Verify OpenAI API key is valid
- Check API rate limits
- Ensure all required environment variables are set

### E2E Tests Fail
- Install puppeteer: `npm install puppeteer`
- Ensure sufficient system resources for browser automation
- Check for display server issues in headless mode

## 🎉 Success Criteria

The AI generation system is **production-ready** when:

- ✅ All database tests pass
- ✅ All API tests pass
- ✅ All integration tests pass
- ✅ All E2E tests pass
- ✅ Performance benchmarks met
- ✅ No critical errors in logs

Run `npm run test:all` to verify complete system health! 🚀
