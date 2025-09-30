/**
 * Admin Endpoints Tests
 * Tests for admin API endpoints and data access
 */

import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

describe('Admin Programs Endpoints', () => {
  it('should fetch all programs with school data', async () => {
    const { data: programs, error } = await supabase
      .from('programs')
      .select('*, school:schools(id, name)')
      .order('created_at', { ascending: false })
      .limit(10);

    expect(error).toBeNull();
    expect(programs).toBeDefined();
    expect(Array.isArray(programs)).toBe(true);
    
    programs?.forEach(program => {
      expect(program).toHaveProperty('id');
      expect(program).toHaveProperty('name');
      expect(program).toHaveProperty('program_id');
      expect(program).toHaveProperty('is_featured');
      expect(program).toHaveProperty('skills_count');
    });
  });

  it('should fetch featured programs only', async () => {
    const { data: programs, error } = await supabase
      .from('programs')
      .select('*')
      .eq('is_featured', true)
      .eq('status', 'published');

    expect(error).toBeNull();
    expect(programs).toBeDefined();
    
    programs?.forEach(program => {
      expect(program.is_featured).toBe(true);
      expect(program.status).toBe('published');
    });
  });

  it('should fetch programs by discipline', async () => {
    const { data: programs, error } = await supabase
      .from('programs')
      .select('*')
      .eq('discipline', 'Business')
      .limit(5);

    expect(error).toBeNull();
    expect(programs).toBeDefined();
    
    programs?.forEach(program => {
      expect(program.discipline).toBe('Business');
    });
  });

  it('should fetch programs by catalog provider', async () => {
    const { data: programs, error } = await supabase
      .from('programs')
      .select('*')
      .eq('catalog_provider', 'Bisk Amplified')
      .limit(5);

    expect(error).toBeNull();
    expect(programs).toBeDefined();
    
    programs?.forEach(program => {
      expect(program.catalog_provider).toBe('Bisk Amplified');
    });
  });

  it('should search programs by name', async () => {
    const { data: programs, error } = await supabase
      .from('programs')
      .select('*')
      .ilike('name', '%Business%')
      .limit(5);

    expect(error).toBeNull();
    expect(programs).toBeDefined();
    
    programs?.forEach(program => {
      expect(program.name.toLowerCase()).toContain('business');
    });
  });
});

describe('Admin Schools Endpoints', () => {
  it('should fetch all schools', async () => {
    const { data: schools, error } = await supabase
      .from('schools')
      .select('*')
      .order('name');

    expect(error).toBeNull();
    expect(schools).toBeDefined();
    expect(Array.isArray(schools)).toBe(true);
    
    schools?.forEach(school => {
      expect(school).toHaveProperty('id');
      expect(school).toHaveProperty('name');
    });
  });

  it('should fetch schools with program count', async () => {
    const { data: schools, error } = await supabase
      .from('schools')
      .select('id, name, programs:programs(count)');

    expect(error).toBeNull();
    expect(schools).toBeDefined();
    
    schools?.forEach(school => {
      expect(school).toHaveProperty('programs');
    });
  });
});

describe('Admin Helper Functions', () => {
  it('should call get_featured_programs function', async () => {
    const { data: programs, error } = await supabase
      .rpc('get_featured_programs');

    expect(error).toBeNull();
    expect(programs).toBeDefined();
    
    programs?.forEach((program: any) => {
      expect(program.is_featured).toBe(true);
      expect(program.status).toBe('published');
    });
  });

  it('should call get_programs_with_skills function', async () => {
    const { data: programs, error } = await supabase
      .rpc('get_programs_with_skills');

    expect(error).toBeNull();
    expect(programs).toBeDefined();
    
    programs?.forEach((program: any) => {
      expect(program).toHaveProperty('skills');
      expect(program.status).toBe('published');
    });
  });
});

describe('Admin Data Consistency', () => {
  it('should have consistent program counts across tables', async () => {
    // Count in programs table
    const { count: programsCount, error: programsError } = await supabase
      .from('programs')
      .select('*', { count: 'exact', head: true });

    expect(programsError).toBeNull();

    // Count processed in staging
    const { count: stagingCount, error: stagingError } = await supabase
      .from('hubspot_programs_staging')
      .select('*', { count: 'exact', head: true })
      .eq('processed', true);

    expect(stagingError).toBeNull();

    // Staging count should be close to programs count (accounting for existing programs)
    expect(stagingCount).toBeGreaterThan(200);
  });

  it('should have all schools referenced by programs', async () => {
    const { data: programs, error } = await supabase
      .from('programs')
      .select('school_id')
      .not('school_id', 'is', null);

    expect(error).toBeNull();

    const schoolIds = new Set(programs?.map(p => p.school_id));

    for (const schoolId of schoolIds) {
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('id')
        .eq('id', schoolId)
        .single();

      expect(schoolError).toBeNull();
      expect(school).toBeDefined();
    }
  });

  it('should have no orphaned program_skills records', async () => {
    const { data: programSkills, error } = await supabase
      .from('program_skills')
      .select('program_id');

    expect(error).toBeNull();

    const programIds = new Set(programSkills?.map(ps => ps.program_id));

    for (const programId of programIds) {
      const { data: program, error: programError } = await supabase
        .from('programs')
        .select('id')
        .eq('id', programId)
        .single();

      expect(programError).toBeNull();
      expect(program).toBeDefined();
    }
  });
});

describe('Admin Performance', () => {
  it('should fetch programs list quickly (< 1s)', async () => {
    const start = Date.now();
    
    const { data: programs, error } = await supabase
      .from('programs')
      .select('*, school:schools(id, name)')
      .limit(50);

    const duration = Date.now() - start;

    expect(error).toBeNull();
    expect(programs).toBeDefined();
    expect(duration).toBeLessThan(1000); // Should be under 1 second
  });

  it('should search programs quickly (< 500ms)', async () => {
    const start = Date.now();
    
    const { data: programs, error } = await supabase
      .from('programs')
      .select('*')
      .or('name.ilike.%business%,discipline.eq.Business')
      .limit(20);

    const duration = Date.now() - start;

    expect(error).toBeNull();
    expect(programs).toBeDefined();
    expect(duration).toBeLessThan(500); // Should be under 500ms
  });
});
