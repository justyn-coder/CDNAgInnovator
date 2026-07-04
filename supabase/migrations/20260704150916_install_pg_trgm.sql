-- Enable pg_trgm in the extensions schema so the programs_name_trgm_idx
-- index on public.programs can reference extensions.gin_trgm_ops.
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
