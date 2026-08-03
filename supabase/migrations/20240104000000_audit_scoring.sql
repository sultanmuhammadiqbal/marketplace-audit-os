-- 1. Add overall_score to audits
ALTER TABLE public.audits ADD COLUMN overall_score NUMERIC(5,2);

-- 2. Create audit_module_results
CREATE TABLE public.audit_module_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.audit_template_modules(id) ON DELETE CASCADE,
  earned_score NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_score NUMERIC(10,2) NOT NULL DEFAULT 0,
  percentage_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(audit_id, module_id)
);

-- Enable RLS
ALTER TABLE public.audit_module_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_module_results
CREATE POLICY "Users can read module results for accessible audits" ON public.audit_module_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.audits
      WHERE audits.id = audit_module_results.audit_id
      AND audits.organization_id IN (SELECT * FROM public.get_user_organizations())
    )
  );

CREATE POLICY "Users can insert module results for accessible audits" ON public.audit_module_results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audits
      WHERE audits.id = audit_module_results.audit_id
      AND audits.organization_id IN (SELECT * FROM public.get_user_organizations())
    )
  );

-- Grants
GRANT ALL ON TABLE public.audit_module_results TO anon, authenticated, service_role;
