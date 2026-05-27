-- Create TKA Scores Table (Nilai Tes Kemampuan Akademik)
create table public.tka_scores (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  student_id uuid references public.students(id) on delete cascade not null,
  bahasa_indonesia numeric(5, 2), -- Nilai TKA Bahasa Indonesia
  matematika numeric(5, 2), -- Nilai TKA Matematika
  average numeric(5, 2), -- Rata-rata TKA (dihitung otomatis)
  unique(student_id)
);

-- Enable RLS
alter table public.tka_scores enable row level security;
create policy "Enable all access for all users" on public.tka_scores for all using (true) with check (true);