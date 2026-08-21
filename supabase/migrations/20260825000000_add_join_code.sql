-- Add join_code to courses (code referenced /join/[code] but column never existed)
alter table public.courses add column if not exists join_code text unique;
update public.courses set join_code = 'cs3330-f26' where code = 'CS 3330' and join_code is null;
