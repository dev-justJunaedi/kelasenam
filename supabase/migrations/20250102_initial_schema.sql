-- Create Students Table
create table public.students (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  nisn text unique,
  nis text,
  exam_number text, -- Nomor Peserta Ujian
  name text not null,
  gender text check (gender in ('L', 'P')),
  birth_place text,
  birth_date date,
  father_name text,
  mother_name text,
  nik text,
  nkk text,
  school_year text, -- e.g., '2025/2026'
  class_name text default '6' -- To distinguish just in case
);

-- Create Grades Table (For Rapor Kelas 5 & 6)
create table public.grades (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  student_id uuid references public.students(id) on delete cascade not null,
  class_level int not null, -- 5 or 6
  semester int not null, -- 1 or 2
  subject text not null, -- e.g., 'PAI', 'PKN', 'Bahasa Indonesia'
  knowledge_score numeric(5, 2), -- Nilai Pengetahuan (KI-3)
  skill_score numeric(5, 2), -- Nilai Keterampilan (KI-4)
  unique(student_id, class_level, semester, subject)
);

-- Create Diploma Scores Table (Nilai Ijazah)
create table public.diploma_scores (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  student_id uuid references public.students(id) on delete cascade not null,
  subject text not null,
  theory_score numeric(5, 2), -- Nilai Ujian Tulis
  practical_score numeric(5, 2), -- Nilai Ujian Praktik
  average_rapor numeric(5, 2), -- Rata-rata Rapor (Calculated or Stored)
  school_exam_score numeric(5, 2), -- Nilai Ujian Sekolah
  final_score numeric(5, 2), -- Nilai Akhir Ijazah
  unique(student_id, subject)
);

-- Create Policy (Row Level Security) - Basic open for MVP
alter table public.students enable row level security;
alter table public.grades enable row level security;
alter table public.diploma_scores enable row level security;

create policy "Enable all access for all users" on public.students for all using (true) with check (true);
create policy "Enable all access for all users" on public.grades for all using (true) with check (true);
create policy "Enable all access for all users" on public.diploma_scores for all using (true) with check (true);
