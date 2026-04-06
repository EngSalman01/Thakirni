-- Fix missing GRANT statements on tables created without proper role permissions.
-- Without these, PostgREST (service_role + authenticated) gets "permission denied"
-- even though RLS is enabled — causing silent failures in crons and API routes.

GRANT ALL ON public.gcal_sent_reminders    TO service_role, authenticated;
GRANT ALL ON public.affiliate_conversions  TO service_role, authenticated;
GRANT ALL ON public.affiliates             TO service_role, authenticated;
GRANT ALL ON public.analytics_events       TO service_role, authenticated;
GRANT ALL ON public.audit_logs             TO service_role, authenticated;
GRANT ALL ON public.business_accounts      TO service_role, authenticated;
GRANT ALL ON public.consent_logs           TO service_role, authenticated;
GRANT ALL ON public.credit_transactions    TO service_role, authenticated;
GRANT ALL ON public.credits                TO service_role, authenticated;
GRANT ALL ON public.customer_health        TO service_role, authenticated;
GRANT ALL ON public.feature_flags          TO service_role, authenticated;
GRANT ALL ON public.invoices               TO service_role, authenticated;
GRANT ALL ON public.jobs                   TO service_role, authenticated;
GRANT ALL ON public.leads                  TO service_role, authenticated;
GRANT ALL ON public.nudge_log              TO service_role, authenticated;
GRANT ALL ON public.onboarding_progress    TO service_role, authenticated;
GRANT ALL ON public.predictive_insights    TO service_role, authenticated;
GRANT ALL ON public.referrals              TO service_role, authenticated;
GRANT ALL ON public.request_logs           TO service_role, authenticated;
GRANT ALL ON public.system_limits          TO service_role, authenticated;
GRANT ALL ON public.system_usage           TO service_role, authenticated;
GRANT ALL ON public.task_columns           TO service_role, authenticated;
GRANT ALL ON public.tasks                  TO service_role, authenticated;
GRANT ALL ON public.usage                  TO service_role, authenticated;
GRANT ALL ON public.usage_daily            TO service_role, authenticated;
GRANT ALL ON public.user_memory            TO service_role, authenticated;
GRANT ALL ON public.workspace_billing      TO service_role, authenticated;
GRANT ALL ON public.workspace_members      TO service_role, authenticated;
GRANT ALL ON public.workspaces             TO service_role, authenticated;
