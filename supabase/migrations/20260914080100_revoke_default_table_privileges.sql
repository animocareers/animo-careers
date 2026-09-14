-- Defensively undoes the `alter default privileges ... grant ... to
-- authenticated` from 20260914072245_grant_authenticated_table_privileges.sql
-- in case this database already had that migration applied before that file
-- was edited to remove it. A no-op if it was never applied.
--
-- That default would have granted authenticated CRUD on every future public
-- table the instant it's created, ahead of RLS ever being enabled on it -
-- a migration that forgets RLS would leave the new table wide open instead
-- of failing closed. Future migrations must grant privileges explicitly,
-- after enabling RLS, per-table.

alter default privileges in schema public
  revoke select, insert, update, delete on tables from authenticated;
