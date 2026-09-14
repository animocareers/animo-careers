-- Add a Supabase Storage object key for the organization's logo. The app
-- resolves this to a public URL at render time via
-- supabase.storage.from(<bucket>).getPublicUrl(key) — see
-- application_attachments.storage_key for the same pattern.
--
-- No RLS changes needed: RLS is row-level, not column-level, so
-- organizations' existing select/update policies already cover this column.

alter table organizations
  add column logo_storage_key text;
