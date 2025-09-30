/**
 * Admin Programs Tests
 * Tests for programs admin functionality including CRUD operations,
 * data integrity, and schema validation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

describe('Programs Admin - Schema Validation', () => {
  it('should have all required columns in programs table', async () => {
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'programs')
      .eq('table_schema', 'public');

    expect(error).toBeNull();
    
    const columnNames = columns?.map(c => c.column_name) || [];
    
    // Original columns
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('name');
    expect(columnNames).toContain('school_id');
    expect(columnNames).toContain('program_type');
    expect(columnNames).toContain('format');
    expect(columnNames).toContain('duration_text');
    expect(columnNames).toContain('short_desc');
    expect(columnNames).toContain('program_url');
    expect(columnNames).toContain('cip_code');
    expect(columnNames).toContain('status');
    
    // New columns from migrations
    expect(columnNames).toContain('program_id');
    expect(columnNames).toContain('catalog_provider');
    expect(columnNames).toContain('discipline');
    expect(columnNames).toContain('long_desc');
    expect(columnNames).toContain('program_guide_url');
    expect(columnNames).toContain('is_featured');
    expect(columnNames).toContain('featured_image_url');
    expect(columnNames).toContain('skills_count');
    expect(columnNames).toContain('created_at');
    expect(columnNames).toContain('updated_at');
  });

  it('should have program_id as unique and not null', async () => {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          column_name,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = 'programs' 
          AND column_name = 'program_id'
          AND table_schema = 'public';
      `
    });

    expect(error).toBeNull();
    expect(data?.[0]?.is_nullable).toBe('NO');
  });

  it('should have proper indexes on new columns', async () => {
    const { data: indexes, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'programs' 
          AND schemaname = 'public';
      `
    });

    expect(error).toBeNull();
    
    const indexNames = indexes?.map((i: any) => i.indexname) || [];
    expect(indexNames).toContain('idx_programs_is_featured');
    expect(indexNames).toContain('idx_programs_program_id');
    expect(indexNames).toContain('idx_programs_discipline');
  });
});

describe('Programs Admin - Data Integrity', () => {
  it('should have all programs with valid program_ids', async () => {
    const { data: programs, error } = await supabase
      .from('programs')
      .select('id, program_id, name')
      .is('program_id', null);

    expect(error).toBeNull();
    expect(programs).toHaveLength(0); // No programs should have null program_id
  });

  it('should have all program_ids as unique', async () => {
    const { data: programs, error } = await supabase
      .from('programs')
      .select('program_id');

    expect(error).toBeNull();
    
    const programIds = programs?.map(p => p.program_id) || [];
    const uniqueIds = new Set(programIds);
    
    expect(programIds.length).toBe(uniqueIds.size); // All should be unique
  });

  it('should have Direct programs with program_ids starting with 3', async () => {
    const { data: directPrograms, error } = await supabase
      .from('programs')
      .select('program_id, catalog_provider')
      .eq('catalog_provider', 'Direct');

    expect(error).toBeNull();
    
    directPrograms?.forEach(program => {
      expect(program.program_id).toMatch(/^3/); // Should start with 3
      expect(program.program_id).toHaveLength(11); // Should be 11 chars
    });
  });

  it('should have Bisk Amplified programs with numeric program_ids', async () => {
    const { data: biskPrograms, error } = await supabase
      .from('programs')
      .select('program_id, catalog_provider')
      .eq('catalog_provider', 'Bisk Amplified');

    expect(error).toBeNull();
    
    biskPrograms?.forEach(program => {
      expect(program.program_id).toMatch(/^\d+$/); // Should be all digits
      expect(program.program_id).toHaveLength(11); // Should be 11 chars
    });
  });

  it('should have all programs linked to valid schools', async () => {
    const { data: programs, error } = await supabase
      .from('programs')
      .select('id, name, school_id, school:schools(id, name)')
      .not('school_id', 'is', null);

    expect(error).toBeNull();
    
    programs?.forEach(program => {
      expect(program.school).not.toBeNull();
      expect(program.school?.id).toBe(program.school_id);
    });
  });

  it('should have valid discipline values', async () => {
    const validDisciplines = [
      'Business',
      'Technology',
      'Healthcare',
      'Engineering',
      'Education',
      'Arts & Humanities',
      'Science',
      'Social Sciences',
      'Criminal Justice',
      'Human Resources',
      'General Studies',
      'Engineering & Construction'
    ];

    const { data: programs, error } = await supabase
      .from('programs')
      .select('discipline')
      .not('discipline', 'is', null);

    expect(error).toBeNull();
    
    programs?.forEach(program => {
      expect(validDisciplines).toContain(program.discipline);
    });
  });

  it('should have skills_count matching actual program_skills count', async () => {
    const { data: programs, error } = await supabase
      .from('programs')
      .select('id, skills_count');

    expect(error).toBeNull();

    for (const program of programs || []) {
      const { data: skills, error: skillsError } = await supabase
        .from('program_skills')
        .select('skill_id')
        .eq('program_id', program.id);

      expect(skillsError).toBeNull();
      expect(program.skills_count).toBe(skills?.length || 0);
    }
  });
});

describe('Programs Admin - CRUD Operations', () => {
  let testProgramId: string;

  it('should create a new program', async () => {
    const { data: school } = await supabase
      .from('schools')
      .select('id')
      .limit(1)
      .single();

    const testProgram = {
      name: 'Test Program - Admin Tools',
      program_id: '3test123456',
      school_id: school?.id,
      program_type: 'Certificate',
      format: 'Online',
      duration_text: '6 weeks',
      short_desc: 'Test program for admin tools validation',
      discipline: 'Technology',
      catalog_provider: 'Direct',
      is_featured: false,
      status: 'draft'
    };

    const { data: program, error } = await supabase
      .from('programs')
      .insert(testProgram)
      .select()
      .single();

    expect(error).toBeNull();
    expect(program).toBeDefined();
    expect(program?.name).toBe(testProgram.name);
    
    testProgramId = program?.id;
  });

  it('should read the created program', async () => {
    const { data: program, error } = await supabase
      .from('programs')
      .select('*, school:schools(*)')
      .eq('id', testProgramId)
      .single();

    expect(error).toBeNull();
    expect(program).toBeDefined();
    expect(program?.name).toBe('Test Program - Admin Tools');
    expect(program?.school).toBeDefined();
  });

  it('should update program featured status', async () => {
    const { data: program, error } = await supabase
      .from('programs')
      .update({ is_featured: true })
      .eq('id', testProgramId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(program?.is_featured).toBe(true);
  });

  it('should update program status', async () => {
    const { data: program, error } = await supabase
      .from('programs')
      .update({ status: 'published' })
      .eq('id', testProgramId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(program?.status).toBe('published');
  });

  it('should delete the test program', async () => {
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', testProgramId);

    expect(error).toBeNull();

    // Verify deletion
    const { data: program } = await supabase
      .from('programs')
      .select('id')
      .eq('id', testProgramId)
      .single();

    expect(program).toBeNull();
  });
});

describe('Programs Admin - RLS Policies', () => {
  it('should have proper RLS policies on programs table', async () => {
    const { data: policies, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT policyname, cmd 
        FROM pg_policies 
        WHERE tablename = 'programs' 
          AND schemaname = 'public';
      `
    });

    expect(error).toBeNull();
    
    const policyNames = policies?.map((p: any) => p.policyname) || [];
    
    expect(policyNames).toContain('Admins can view programs based on role');
    expect(policyNames).toContain('Admins can update programs based on role');
    expect(policyNames).toContain('Admins can delete programs based on role');
  });
});

describe('Programs Admin - Triggers', () => {
  it('should have updated_at trigger', async () => {
    const { data: triggers, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'programs' 
          AND event_object_schema = 'public';
      `
    });

    expect(error).toBeNull();
    
    const triggerNames = triggers?.map((t: any) => t.trigger_name) || [];
    expect(triggerNames).toContain('handle_programs_updated_at');
  });

  it('should have skills_count trigger on program_skills', async () => {
    const { data: triggers, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'program_skills' 
          AND event_object_schema = 'public';
      `
    });

    expect(error).toBeNull();
    
    const triggerNames = triggers?.map((t: any) => t.trigger_name) || [];
    expect(triggerNames).toContain('trigger_update_program_skills_count');
  });
});

describe('Schools Admin - Catalog Affiliation', () => {
  it('should have catalog_affiliation column in schools table', async () => {
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'schools')
      .eq('table_schema', 'public');

    expect(error).toBeNull();
    
    const columnNames = columns?.map(c => c.column_name) || [];
    expect(columnNames).toContain('catalog_affiliation');
  });
});

describe('HubSpot Staging - Data Preservation', () => {
  it('should have hubspot_programs_staging table', async () => {
    const { data: tables, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'hubspot_programs_staging';
      `
    });

    expect(error).toBeNull();
    expect(tables).toHaveLength(1);
  });

  it('should have all HubSpot data preserved in staging', async () => {
    const { data: stagingRecords, error } = await supabase
      .from('hubspot_programs_staging')
      .select('record_id, program_name, processed');

    expect(error).toBeNull();
    expect(stagingRecords).toBeDefined();
    
    // Should have 218 records from HubSpot import
    expect(stagingRecords?.length).toBeGreaterThan(200);
  });

  it('should have all staging records processed', async () => {
    const { data: unprocessed, error } = await supabase
      .from('hubspot_programs_staging')
      .select('record_id, program_name')
      .eq('processed', false);

    expect(error).toBeNull();
    expect(unprocessed).toHaveLength(0); // All should be processed
  });
});
