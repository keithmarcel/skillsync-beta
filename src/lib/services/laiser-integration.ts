/**
 * LAiSER Skills Extraction Integration for SkillSync
 * Integrates LAiSER Python package directly into Node.js/TypeScript codebase
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export interface LaiserSkill {
  skill: string;
  level: number; // 1-12 scale
  knowledge_required?: string[];
  tasks?: string[];
  confidence?: number;
}

export interface LaiserExtractionResult {
  skills: LaiserSkill[];
  processing_time: number;
  model_used: string;
}

export class LaiserIntegrationService {
  private pythonPath: string;
  private laiserScriptPath: string;
  private modelId: string;
  private hfToken?: string;

  constructor() {
    // Use venv Python if available, fallback to system Python
    const venvPython = path.join(process.cwd(), 'venv', 'bin', 'python3');
    this.pythonPath = process.env.PYTHON_PATH || venvPython;
    // Reference the source file location, not the compiled location
    this.laiserScriptPath = path.join(process.cwd(), 'src', 'lib', 'services', 'laiser-extractor.py');
    this.modelId = process.env.LAISER_MODEL_ID || 'microsoft/DialoGPT-medium';
    this.hfToken = process.env.HUGGINGFACE_TOKEN;
  }

  /**
   * Extract skills from text using LAiSER
   */
  async extractSkills(text: string): Promise<LaiserExtractionResult> {
    const startTime = Date.now();

    try {
      // Create temporary input file
      const inputFile = await this.createTempInputFile(text);

      // Run LAiSER extraction
      const result = await this.runLaiserExtraction(inputFile);

      // Clean up temp file
      await fs.unlink(inputFile);

      return {
        ...result,
        processing_time: Date.now() - startTime,
        model_used: this.modelId
      };
    } catch (error: any) {
      console.error('LAiSER extraction failed:', error);
      const errorMessage = error?.message || String(error);
      throw new Error(`Skills extraction failed: ${errorMessage}`);
    }
  }

  /**
   * Extract skills from multiple texts in batch
   */
  async extractSkillsBatch(texts: string[]): Promise<LaiserExtractionResult[]> {
    const results: LaiserExtractionResult[] = [];

    for (const text of texts) {
      try {
        const result = await this.extractSkills(text);
        results.push(result);
      } catch (error) {
        console.error(`Failed to extract skills from text: ${error.message}`);
        // Return empty result for failed extractions
        results.push({
          skills: [],
          processing_time: 0,
          model_used: this.modelId
        });
      }
    }

    return results;
  }

  /**
   * Create temporary input file for LAiSER
   */
  private async createTempInputFile(text: string): Promise<string> {
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });

    const inputFile = path.join(tempDir, `laiser-input-${Date.now()}.txt`);
    await fs.writeFile(inputFile, text, 'utf8');

    return inputFile;
  }

  /**
   * Run LAiSER extraction via Python subprocess
   */
  private async runLaiserExtraction(inputFile: string): Promise<Omit<LaiserExtractionResult, 'processing_time' | 'model_used'>> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(this.pythonPath, [
        this.laiserScriptPath,
        '--input', inputFile,
        '--model', this.modelId,
        '--hf-token', this.hfToken || ''
      ], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'ignore'], // Ignore stderr to suppress INFO logs
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
          TF_CPP_MIN_LOG_LEVEL: '3',
          TRANSFORMERS_VERBOSITY: 'error'
        }
      });

      let stdout = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            // Clean stdout by removing any non-JSON lines (like INFO logs)
            const lines = stdout.split('\n').filter(line => {
              const trimmed = line.trim();
              return trimmed && !trimmed.startsWith('INFO') && !trimmed.startsWith('Loading') && 
                     !trimmed.startsWith('Loaded') && !trimmed.startsWith('Using') &&
                     !trimmed.startsWith('Failed') && !trimmed.startsWith('Consider') &&
                     !trimmed.startsWith('WARNING') && !trimmed.startsWith('TIP') &&
                     !trimmed.startsWith('[');
            });
            
            const jsonLine = lines.find(line => line.trim().startsWith('{') || line.trim().startsWith('['));
            
            if (!jsonLine) {
              reject(new Error(`No JSON output found in LAiSER response. Output: ${stdout.substring(0, 200)}`));
              return;
            }
            
            const result = JSON.parse(jsonLine);
            resolve(result);
          } catch (parseError) {
            reject(new Error(`Failed to parse LAiSER output: ${parseError instanceof Error ? parseError.message : String(parseError)}. Output: ${stdout.substring(0, 200)}`));
          }
        } else {
          reject(new Error(`LAiSER process failed with code ${code}. Output: ${stdout.substring(0, 200)}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start LAiSER process: ${error.message}`));
      });
    });
  }

  /**
   * Check if LAiSER is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const testResult = await this.extractSkills('Python programming test');
      return testResult.skills.length >= 0; // Just check if it runs
    } catch (error) {
      console.error('LAiSER availability check failed:', error);
      return false;
    }
  }
}

// Default export
export default LaiserIntegrationService;
