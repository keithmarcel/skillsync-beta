# LAiSER Integration Setup Guide

## Overview
This guide explains how to integrate LAiSER (Python AI skills extraction) directly into your existing SkillSync Node.js/TypeScript codebase without requiring a separate service.

## Architecture
```
SkillSync Node.js App
        │
        ├── Existing Services (TypeScript)
        │
        └── LAiSER Integration (Python subprocess)
            │
            ├── laiser-integration.ts (Node.js wrapper)
            ├── laiser-extractor.py (Python script)
            └── LAiSER Python package
```

## Prerequisites

### System Requirements
- Python 3.9+ installed on deployment server
- 15GB+ GPU memory (recommended) or CPU-only mode
- HuggingFace account with access token

### Python Dependencies
Add to your deployment setup (Dockerfile or server provisioning):

```bash
# Install LAiSER
pip install laiser[gpu]  # For GPU support
# OR
pip install laiser[cpu]  # For CPU-only
```

## Environment Variables

Add to your `.env` file:

```bash
# Python configuration
PYTHON_PATH=python3

# LAiSER configuration
LAISER_MODEL_ID=microsoft/DialoGPT-medium
HUGGINGFACE_TOKEN=your_huggingface_token_here

# GPU configuration (optional)
LAISER_USE_GPU=true
```

## Docker Integration

### Option 1: Multi-stage Docker Build
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install Python
FROM base AS python-deps
RUN apk add --no-cache python3 py3-pip
RUN pip install laiser[gpu]

FROM base AS runner
# Copy Python installation
COPY --from=python-deps /usr/lib/python3* /usr/lib/
COPY --from=python-deps /usr/bin/python3 /usr/bin/
COPY --from=python-deps /usr/lib/libpython3* /usr/lib/

# Copy your app
COPY . .
RUN npm run build

CMD ["npm", "start"]
```

### Option 2: Separate Python Container
If you prefer container isolation:

```yaml
# docker-compose.yml
version: '3.8'
services:
  skillsync:
    build: .
    environment:
      - PYTHON_PATH=python3
    depends_on:
      - laiser-service

  laiser-service:
    image: laiser-extractor:latest
    environment:
      - MODEL_ID=microsoft/DialoGPT-medium
      - HF_TOKEN=${HUGGINGFACE_TOKEN}
    # This container just provides LAiSER binaries
    command: sleep infinity
```

## Installation Steps

### 1. Install Python Dependencies
```bash
# On your deployment server
pip install laiser[gpu]

# Verify installation
python3 -c "from laiser.skill_extractor_refactored import SkillExtractorRefactored; print('LAiSER ready')"
```

### 2. Configure Environment
```bash
# Add to your .env file
LAISER_MODEL_ID=microsoft/DialoGPT-medium
HUGGINGFACE_TOKEN=your_token_here
PYTHON_PATH=python3
```

### 3. Test Integration
```typescript
// In your codebase, test the integration
import LaiserIntegrationService from '@/lib/services/laiser-integration'

const testLaiser = async () => {
  const service = new LaiserIntegrationService()
  const available = await service.checkAvailability()

  if (available) {
    console.log('✅ LAiSER integration working')
  } else {
    console.log('❌ LAiSER integration failed')
  }
}

testLaiser()
```

## Usage Examples

### Basic Skills Extraction
```typescript
import LaiserIntegrationService from '@/lib/services/laiser-integration'

const extractSkills = async (text: string) => {
  const service = new LaiserIntegrationService()
  const result = await service.extractSkills(text)

  return result.skills.map(skill => ({
    name: skill.skill,
    level: skill.level, // 1-12 scale
    knowledge: skill.knowledge_required,
    tasks: skill.tasks
  }))
}
```

### Program Skills Automation
```typescript
import LaiserProgramSkillsService from '@/lib/services/laiser-program-skills'

const autoExtract = async (programId: string) => {
  const service = new LaiserProgramSkillsService()
  const result = await service.extractProgramSkills(programId)

  console.log(`Extracted ${result.skills_mapped} skills with ${result.confidence_score} confidence`)
}
```

## Performance Considerations

### Resource Usage
- **GPU Mode**: ~15GB VRAM, ~2-5 seconds per extraction
- **CPU Mode**: ~4GB RAM, ~10-30 seconds per extraction
- **Batch Processing**: More efficient for multiple texts

### Caching Strategy
```typescript
// Implement caching to avoid re-processing
const skillCache = new Map()

const getCachedSkills = async (text: string) => {
  const cacheKey = hash(text)

  if (skillCache.has(cacheKey)) {
    return skillCache.get(cacheKey)
  }

  const result = await extractSkills(text)
  skillCache.set(cacheKey, result)

  return result
}
```

## Monitoring & Troubleshooting

### Health Checks
```typescript
// Add to your health check endpoint
const checkLaiserHealth = async () => {
  const service = new LaiserIntegrationService()
  return await service.checkAvailability()
}
```

### Common Issues

#### 1. Python Not Found
```
Error: spawn python3 ENOENT
```
**Solution**: Set correct PYTHON_PATH in environment variables

#### 2. LAiSER Package Not Installed
```
Error: ModuleNotFoundError: No module named 'laiser'
```
**Solution**: Run `pip install laiser[gpu]` on deployment server

#### 3. GPU Memory Issues
```
Error: CUDA out of memory
```
**Solution**: Switch to CPU mode or use larger GPU

#### 4. HuggingFace Token Issues
```
Error: Authorization required
```
**Solution**: Set valid HUGGINGFACE_TOKEN environment variable

## Deployment Checklist

- [ ] Python 3.9+ installed
- [ ] LAiSER package installed (`pip install laiser[gpu]`)
- [ ] Environment variables configured
- [ ] HuggingFace token valid
- [ ] GPU available (if using GPU mode)
- [ ] Integration tested with sample data
- [ ] Error handling implemented
- [ ] Caching strategy in place
- [ ] Monitoring/logging added

## Next Steps

1. **Start Small**: Test with a single program extraction
2. **Monitor Performance**: Track extraction times and accuracy
3. **Iterate**: Refine based on real-world results
4. **Scale**: Implement batch processing for bulk operations

## Support

For LAiSER-specific issues:
- GitHub: https://github.com/LAiSER-Software/extract-module
- Documentation: https://laiser-software.github.io/docs/

For SkillSync integration issues:
- Check logs in `/temp/laiser-*` files
- Verify Python subprocess output
- Test with simple text inputs first
