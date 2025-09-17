-- Admin RLS Policies for CMS Tools

-- Companies table - Super Admin only
CREATE POLICY "Super admins can manage companies" ON public.companies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND admin_role = 'super_admin'
        )
    );

-- Jobs table - Role-based access with entity limits
CREATE POLICY "Admins can view jobs based on role" ON public.jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND (
                -- Super admin sees all
                p.admin_role = 'super_admin'
                OR 
                -- Company admin sees their company's roles
                (p.admin_role = 'company_admin' AND p.company_id = jobs.company_id)
            )
        )
    );

CREATE POLICY "Company admins can insert roles with limits" ON public.jobs
    FOR INSERT WITH CHECK (
        job_kind = 'featured_role'
        AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND (
                p.admin_role = 'super_admin'
                OR 
                (p.admin_role = 'company_admin' 
                 AND p.company_id = jobs.company_id
                 AND count_company_roles(p.company_id) < 10)
            )
        )
    );

CREATE POLICY "Admins can update jobs based on role" ON public.jobs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND (
                -- Super admin can update all
                p.admin_role = 'super_admin'
                OR 
                -- Company admin can update their company's roles
                (p.admin_role = 'company_admin' AND p.company_id = jobs.company_id)
            )
        )
    );

CREATE POLICY "Admins can delete jobs based on role" ON public.jobs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND (
                -- Super admin can delete all
                p.admin_role = 'super_admin'
                OR 
                -- Company admin can delete their company's roles
                (p.admin_role = 'company_admin' AND p.company_id = jobs.company_id)
            )
        )
    );

-- Schools table - Super Admin only
CREATE POLICY "Super admins can manage schools" ON public.schools
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND admin_role = 'super_admin'
        )
    );

-- Programs table - Role-based access with entity limits
CREATE POLICY "Admins can view programs based on role" ON public.programs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND (
                -- Super admin sees all
                p.admin_role = 'super_admin'
                OR 
                -- Provider admin sees their school's programs
                (p.admin_role = 'provider_admin' AND p.school_id = programs.school_id)
            )
        )
    );

CREATE POLICY "Provider admins can insert programs with limits" ON public.programs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND (
                p.admin_role = 'super_admin'
                OR 
                (p.admin_role = 'provider_admin' 
                 AND p.school_id = programs.school_id
                 AND count_provider_programs(p.school_id) < 300)
            )
        )
    );

CREATE POLICY "Admins can update programs based on role" ON public.programs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND (
                -- Super admin can update all
                p.admin_role = 'super_admin'
                OR 
                -- Provider admin can update their school's programs
                (p.admin_role = 'provider_admin' AND p.school_id = programs.school_id)
            )
        )
    );

CREATE POLICY "Admins can delete programs based on role" ON public.programs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND (
                -- Super admin can delete all
                p.admin_role = 'super_admin'
                OR 
                -- Provider admin can delete their school's programs
                (p.admin_role = 'provider_admin' AND p.school_id = programs.school_id)
            )
        )
    );

-- Assessments table - Super Admin only
CREATE POLICY "Super admins can manage assessments" ON public.assessments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND admin_role = 'super_admin'
        )
    );

-- Skills table - Read access for all admins, write for Super Admin only
CREATE POLICY "Admins can view skills" ON public.skills
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND admin_role IS NOT NULL
        )
    );

CREATE POLICY "Super admins can manage skills" ON public.skills
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND admin_role = 'super_admin'
        )
    );

-- Job Skills junction table - Follows job permissions
CREATE POLICY "Admins can manage job skills based on job access" ON public.job_skills
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.jobs j ON j.id = job_skills.job_id
            WHERE p.id = auth.uid() 
            AND (
                p.admin_role = 'super_admin'
                OR 
                (p.admin_role = 'company_admin' AND p.company_id = j.company_id)
            )
        )
    );

-- Program Skills junction table - Follows program permissions
CREATE POLICY "Admins can manage program skills based on program access" ON public.program_skills
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.programs pr ON pr.id = program_skills.program_id
            WHERE p.id = auth.uid() 
            AND (
                p.admin_role = 'super_admin'
                OR 
                (p.admin_role = 'provider_admin' AND p.school_id = pr.school_id)
            )
        )
    );
