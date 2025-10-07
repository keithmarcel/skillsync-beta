import dotenv from 'dotenv';
import path from 'path';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Load environment variables from .env.local for the test environment
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });