-- Trigger functions used by public.contacts (BEFORE UPDATE) and
-- public.rate_limits (AFTER INSERT). Must exist before the CREATE TRIGGER
-- statements in the baseline schema fire.

CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM rate_limits WHERE timestamp < NOW() - INTERVAL '1 hour';
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_contacts_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
