-- 20240102000000_audit_tables.sql

-- 1. Audit Templates
CREATE TABLE public.audit_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Audit Template Modules
CREATE TABLE public.audit_template_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.audit_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Audit Questions
CREATE TABLE public.audit_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.audit_template_modules(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('pass_fail', 'scale', 'text')),
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Audits (Execution Sessions)
CREATE TABLE public.audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.audit_templates(id) ON DELETE RESTRICT,
  auditor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 5. Audit Answers
CREATE TABLE public.audit_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.audit_questions(id) ON DELETE RESTRICT,
  answer_value TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(audit_id, question_id)
);

-- Enable RLS
ALTER TABLE public.audit_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_template_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_answers ENABLE ROW LEVEL SECURITY;

-- Triggers for updated_at
CREATE TRIGGER update_audit_templates_modtime BEFORE UPDATE ON public.audit_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audit_template_modules_modtime BEFORE UPDATE ON public.audit_template_modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audit_questions_modtime BEFORE UPDATE ON public.audit_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audits_modtime BEFORE UPDATE ON public.audits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audit_answers_modtime BEFORE UPDATE ON public.audit_answers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

-- Audit Templates
-- Can read if organization_id is null (global) or belongs to user's org
CREATE POLICY "Users can read templates for their orgs or global" ON public.audit_templates
  FOR SELECT USING (
    organization_id IS NULL OR
    organization_id IN (SELECT * FROM public.get_user_organizations())
  );

CREATE POLICY "Admins can insert templates" ON public.audit_templates
  FOR INSERT WITH CHECK (public.has_org_role(organization_id, ARRAY['organization_owner', 'organization_admin']));

CREATE POLICY "Admins can update templates" ON public.audit_templates
  FOR UPDATE USING (public.has_org_role(organization_id, ARRAY['organization_owner', 'organization_admin']));

CREATE POLICY "Admins can delete templates" ON public.audit_templates
  FOR DELETE USING (public.has_org_role(organization_id, ARRAY['organization_owner', 'organization_admin']));

-- Audit Template Modules (inherits from template access via JOIN)
CREATE POLICY "Users can read modules for accessible templates" ON public.audit_template_modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.audit_templates
      WHERE audit_templates.id = audit_template_modules.template_id
      AND (audit_templates.organization_id IS NULL OR audit_templates.organization_id IN (SELECT * FROM public.get_user_organizations()))
    )
  );

-- Assuming only admins can modify modules for now.
CREATE POLICY "Admins can manage modules" ON public.audit_template_modules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.audit_templates
      WHERE audit_templates.id = audit_template_modules.template_id
      AND public.has_org_role(audit_templates.organization_id, ARRAY['organization_owner', 'organization_admin'])
    )
  );

-- Audit Questions
CREATE POLICY "Users can read questions for accessible modules" ON public.audit_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.audit_template_modules
      JOIN public.audit_templates ON audit_templates.id = audit_template_modules.template_id
      WHERE audit_template_modules.id = audit_questions.module_id
      AND (audit_templates.organization_id IS NULL OR audit_templates.organization_id IN (SELECT * FROM public.get_user_organizations()))
    )
  );

CREATE POLICY "Admins can manage questions" ON public.audit_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.audit_template_modules
      JOIN public.audit_templates ON audit_templates.id = audit_template_modules.template_id
      WHERE audit_template_modules.id = audit_questions.module_id
      AND public.has_org_role(audit_templates.organization_id, ARRAY['organization_owner', 'organization_admin'])
    )
  );

-- Audits
CREATE POLICY "Users can read audits in their organizations" ON public.audits
  FOR SELECT USING (
    organization_id IN (SELECT * FROM public.get_user_organizations())
  );

CREATE POLICY "Users can insert audits for their organizations" ON public.audits
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT * FROM public.get_user_organizations())
  );

CREATE POLICY "Users can update audits in their organizations" ON public.audits
  FOR UPDATE USING (
    organization_id IN (SELECT * FROM public.get_user_organizations())
  );

-- Audit Answers
CREATE POLICY "Users can read answers for accessible audits" ON public.audit_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.audits
      WHERE audits.id = audit_answers.audit_id
      AND audits.organization_id IN (SELECT * FROM public.get_user_organizations())
    )
  );

CREATE POLICY "Users can insert answers for accessible audits" ON public.audit_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audits
      WHERE audits.id = audit_answers.audit_id
      AND audits.organization_id IN (SELECT * FROM public.get_user_organizations())
    )
  );

CREATE POLICY "Users can update answers for accessible audits" ON public.audit_answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.audits
      WHERE audits.id = audit_answers.audit_id
      AND audits.organization_id IN (SELECT * FROM public.get_user_organizations())
    )
  );
