import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local for the test environment
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });