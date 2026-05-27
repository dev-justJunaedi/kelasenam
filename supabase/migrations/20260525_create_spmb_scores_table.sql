-- Create SPMB Scores Table (for Preview SPMB)
create table public.spmb_scores (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  student_id uuid references public.students(id) on delete cascade not null,
  ranking_position int, -- Peringkat nilai (1, 2, 3, dst)
  ranking_weight numeric(5, 2), -- Bobot peringkat (320, 310, 300, dst)
  tka_bahasa_indonesia numeric(5, 2), -- Nilai TKA Bahasa Indonesia
  tka_matematika numeric(5, 2), -- Nilai TKA Matematika
  tka_average numeric(5, 2), -- Rata-rata TKA (dihitung otomatis)
  rapor_average numeric(5, 2), -- Rata-rata Rapor NR (dihitung otomatis)
  final_score numeric(5, 2), -- Nilai Akhir NA (dihitung otomatis)
  unique(student_id)
);

-- Enable RLS
alter table public.spmb_scores enable row level security;
create policy "Enable all access for all users" on public.spmb_scores for all using (true) with check (true);