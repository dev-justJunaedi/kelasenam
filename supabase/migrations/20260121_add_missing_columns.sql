-- Add missing columns to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS kode_par text,
ADD COLUMN IF NOT EXISTS kode_abs text,
ADD COLUMN IF NOT EXISTS no_urut text;

-- Optional: Add comment
COMMENT ON COLUMN public.students.kode_par IS 'Kode Paralel (e.g. 01, 02)';
COMMENT ON COLUMN public.students.kode_abs IS 'Kode Absen / Nomor Urut Absen';
