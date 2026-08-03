-- 1. Create findings table
CREATE TABLE public.findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  audit_question_id UUID REFERENCES public.audit_questions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Resolved', 'Ignored')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create recommendations table
CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID NOT NULL REFERENCES public.findings(id) ON DELETE CASCADE,
  action_title TEXT NOT NULL,
  action_description TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Triggers for updated_at
CREATE TRIGGER update_findings_modtime BEFORE UPDATE ON public.findings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recommendations_modtime BEFORE UPDATE ON public.recommendations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for findings
CREATE POLICY "Users can read findings in their organizations" ON public.findings
  FOR SELECT USING (
    organization_id IN (SELECT * FROM public.get_user_organizations())
  );

CREATE POLICY "Users can insert findings for their organizations" ON public.findings
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT * FROM public.get_user_organizations())
  );

CREATE POLICY "Users can update findings in their organizations" ON public.findings
  FOR UPDATE USING (
    organization_id IN (SELECT * FROM public.get_user_organizations())
  );

CREATE POLICY "Admins can delete findings in their organizations" ON public.findings
  FOR DELETE USING (
    public.has_org_role(organization_id, ARRAY['organization_owner', 'organization_admin'])
  );

-- RLS Policies for recommendations
CREATE POLICY "Users can read recommendations for accessible findings" ON public.recommendations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.findings
      WHERE findings.id = recommendations.finding_id
      AND findings.organization_id IN (SELECT * FROM public.get_user_organizations())
    )
  );

CREATE POLICY "Users can insert recommendations for accessible findings" ON public.recommendations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.findings
      WHERE findings.id = recommendations.finding_id
      AND findings.organization_id IN (SELECT * FROM public.get_user_organizations())
    )
  );

CREATE POLICY "Users can update recommendations for accessible findings" ON public.recommendations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.findings
      WHERE findings.id = recommendations.finding_id
      AND findings.organization_id IN (SELECT * FROM public.get_user_organizations())
    )
  );

-- Grants
GRANT ALL ON TABLE public.findings TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.recommendations TO anon, authenticated, service_role;
