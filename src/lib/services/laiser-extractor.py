#!/usr/bin/env python3
"""
LAiSER Skills Extractor Wrapper for SkillSync
Python script that interfaces with LAiSER package and provides JSON output for Node.js integration
"""

import json
import sys
import argparse
import os
import warnings
from typing import Dict, List, Any
from contextlib import redirect_stdout, redirect_stderr
from io import StringIO

# CRITICAL: Suppress ALL output except final JSON
# Redirect stdout to buffer, stderr to devnull
warnings.filterwarnings('ignore')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TRANSFORMERS_VERBOSITY'] = 'error'
os.environ['TOKENIZERS_PARALLELISM'] = 'false'

import logging
logging.basicConfig(level=logging.CRITICAL, force=True)
for logger_name in ['laiser', 'transformers', 'torch', 'tensorflow', 'faiss']:
    logging.getLogger(logger_name).setLevel(logging.CRITICAL)
    logging.getLogger(logger_name).disabled = True

try:
    from laiser.skill_extractor_refactored import SkillExtractorRefactored
    import pandas as pd
except ImportError as e:
    print(json.dumps({"skills": [], "error": f"LAiSER package not installed: {str(e)}. Run: pip install laiser[gpu]"}))
    sys.exit(1)

class SkillSyncLaiserExtractor:
    def __init__(self, model_id: str, hf_token: str = None, use_gpu: bool = True):
        self.model_id = model_id
        self.hf_token = hf_token
        self.use_gpu = use_gpu
        self.extractor = None

    def initialize_extractor(self):
        """Initialize LAiSER extractor with error handling"""
        try:
            # Capture all output during initialization
            captured_output = StringIO()
            with redirect_stdout(captured_output), redirect_stderr(captured_output):
                self.extractor = SkillExtractorRefactored(
                    model_id=self.model_id,
                    hf_token=self.hf_token,
                    use_gpu=self.use_gpu
                )
            return True
        except Exception as e:
            print(f"Failed to initialize LAiSER extractor: {e}", file=sys.stderr)
            return False

    def extract_skills_from_text(self, text: str) -> Dict[str, Any]:
        """Extract skills from text and format for SkillSync"""
        if not self.extractor:
            if not self.initialize_extractor():
                return {"skills": [], "error": "Failed to initialize extractor"}

        try:
            # Convert text to DataFrame format that LAiSER expects
            df = pd.DataFrame({
                'id': ['doc_1'],
                'text': [text]
            })

            # Extract skills using LAiSER - capture all output
            captured_output = StringIO()
            with redirect_stdout(captured_output), redirect_stderr(captured_output):
                result_df = self.extractor.extract_and_align(
                    data=df,
                    id_column='id',
                    text_columns=['text'],
                    input_type='job_desc',
                    top_k=30,  # Get top 30 skills
                    levels=True,  # Extract proficiency levels
                    batch_size=1
                )

            # Transform LAiSER DataFrame output to SkillSync format
            skills = self._transform_laiser_dataframe(result_df)

            return {
                "skills": skills,
                "text_processed": len(text),
                "skills_found": len(skills)
            }

        except Exception as e:
            return {
                "skills": [],
                "error": f"Extraction failed: {str(e)}"
            }

    def _transform_laiser_dataframe(self, result_df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Transform LAiSER DataFrame output to SkillSync skill format"""
        skills = []
        
        try:
            # LAiSER returns DataFrame with skill columns
            for _, row in result_df.iterrows():
                # Extract skill columns (LAiSER prefixes with 'skill_')
                skill_cols = [col for col in result_df.columns if col.startswith('skill_')]
                
                for skill_col in skill_cols:
                    skill_name = row.get(skill_col)
                    if skill_name and isinstance(skill_name, str) and skill_name.strip():
                        skills.append({
                            "skill": skill_name.strip(),
                            "level": 5,  # Default level
                            "knowledge_required": [],
                            "tasks": [],
                            "confidence": 75  # Default confidence
                        })
        except Exception as e:
            print(f"DataFrame transformation error: {e}", file=sys.stderr)
        
        return skills

    def _transform_laiser_output(self, laiser_result: Any) -> List[Dict[str, Any]]:
        """Transform LAiSER output to SkillSync skill format"""
        skills = []

        # Handle different LAiSER output formats
        if isinstance(laiser_result, dict):
            extracted_skills = laiser_result.get('skills', laiser_result.get('extracted_skills', []))
        elif isinstance(laiser_result, list):
            extracted_skills = laiser_result
        else:
            return skills

        for skill_data in extracted_skills:
            if isinstance(skill_data, dict):
                # Transform to SkillSync format
                skill = {
                    "skill": skill_data.get('skill', skill_data.get('name', '')),
                    "level": skill_data.get('level', skill_data.get('proficiency_level', 1)),
                    "knowledge_required": skill_data.get('knowledge_required', skill_data.get('knowledge', [])),
                    "tasks": skill_data.get('tasks', skill_data.get('task_abilities', [])),
                    "confidence": skill_data.get('confidence', skill_data.get('score', 1.0))
                }

                # Ensure level is within 1-12 range
                skill['level'] = max(1, min(12, int(skill['level'])))

                # Ensure arrays are properly formatted
                if not isinstance(skill['knowledge_required'], list):
                    skill['knowledge_required'] = [skill['knowledge_required']] if skill['knowledge_required'] else []
                if not isinstance(skill['tasks'], list):
                    skill['tasks'] = [skill['tasks']] if skill['tasks'] else []

                skills.append(skill)
            elif isinstance(skill_data, str):
                # Simple string skill
                skills.append({
                    "skill": skill_data,
                    "level": 1,
                    "knowledge_required": [],
                    "tasks": [],
                    "confidence": 0.5
                })

        return skills

def main():
    parser = argparse.ArgumentParser(description='LAiSER Skills Extractor for SkillSync')
    parser.add_argument('--input', required=True, help='Input text file path')
    parser.add_argument('--model', default='microsoft/DialoGPT-medium', help='HuggingFace model ID')
    parser.add_argument('--hf-token', default='', help='HuggingFace token')
    parser.add_argument('--gpu', action='store_true', default=True, help='Use GPU if available')

    args = parser.parse_args()

    # Read input text
    try:
        with open(args.input, 'r', encoding='utf-8') as f:
            text = f.read().strip()
    except Exception as e:
        result = {"skills": [], "error": f"Failed to read input file: {e}"}
        print(json.dumps(result))
        sys.exit(1)

    if not text:
        result = {"skills": [], "error": "Empty input text"}
        print(json.dumps(result))
        sys.exit(1)

    # Initialize extractor
    extractor = SkillSyncLaiserExtractor(
        model_id=args.model,
        hf_token=args.hf_token if args.hf_token else None,
        use_gpu=args.gpu
    )

    # Extract skills
    result = extractor.extract_skills_from_text(text)

    # Output JSON result
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()
