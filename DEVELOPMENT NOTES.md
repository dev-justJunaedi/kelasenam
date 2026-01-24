# DEVELOPMENT NOTES

**Project**: SDN Pondok Ranji 01 - Data Kelas 6 Dashboard
**Last Updated**: 2026-01-21

## 🚀 Progress Update

### ✅ Completed
- **Project Initialization**:
  - Initialized React + Vite + TypeScript project.
  - Installed and configured Tailwind CSS (light theme).
  - Adopted strict type checking with TypeScript.
  - Set up `lucide-react` for iconography.
  
- **Core Architecture**:
  - Implemented responsive `DashboardLayout` with sidebar navigation.
  - Configured mobile-friendly menu structure.
  - Set up Supabase Client (`src/lib/supabase.ts`) and environment variable structure.

- **Feature: Data Peserta Ujian (DNT)**:
  - Created `Student` type definition matching the school's DNT format.
  - Implemented `StudentTable` component with all required columns (NISN, NIK, etc.).
  - **✨ NEW: Full Database Integration (Supabase)**:
    - ✅ **Real-time Data**: Fetching data directly from Supabase.
    - ✅ **CRUD Operations**: Insert, Update, Delete connected to live DB.
    - ✅ **Schema Handling**: Implemented data sanitization to handle schema mismatches (e.g. missing columns) gracefully.
  - **✨ NEW: Advanced Features**:
    - ✅ **Export to Excel**: Download data siswa dengan format DNT lengkap.
    - ✅ **Download Template**: Template Excel untuk import data siswa.
    - ✅ **Import from Excel**: Upload & parse dengan `cellDates` support dan fallback format tanggal.
    - ✅ **Smart Parsing**: Handle Excel serial dates (41557) and empty date strings.
    - ✅ **UI Improvements**: 
      - Date Picker native untuk input tanggal lahir.
      - Field 'Nomor Peserta' opsional (tidak wajib diisi).
    - ✅ **Filter**: By gender (L/P) and kode paralel.
    - ✅ **Pagination**: 10 items per page.
    - ✅ **Real-time Search**: Cari berdasarkan nama, NISN, atau nomor peserta.
  - **🔧 Bug Fixes**:
    - ✅ **Import Excel**: Fixed "0 data" issue (header detection).
    - ✅ **Date Parser**: Fixed `invalid input syntax` by supporting null dates and Excel serial numbers.

- **Feature: Authentication & User Roles**:
  - Implemented Supabase Auth (Email/Password).
  - Created `Login` page and protected routes (`PrivateRoute`, `RoleRoute`).
  - **User Roles & Access Control (Refactored)**:
    - **Logic Change**: Moved from `kode_par` to `class_name` for more readable mapping.
    - `admin`: Restricted access to Grade 6 classes only (6 A, 6 B, 6 C, 6 D).
    - `guru`: Restricted access based on assigned `class_name` in profile (e.g. '6 A').
  - **Security (RLS)**:
    - Strict Row Level Security on `students` and `grades`.
    - ✅ **Fix**: Enabled RLS on `students` table (previously inactive).
    - Policies ensure users only access data relevant to their role and class assignment.
  - **Profile Management**:
    - Created `profiles` table to store user roles and metadata.
    - Added `class_name` to profiles for direct mapping.
    - Added trigger to automatically create profile on signup.

- **Feature: Rekap Nilai Rapor (Grades)**:
  - **Grid Interface**: 
    - Input knowledge scores for 10 standardized subjects.
    - Filter by Class Level (5/6) and Semester (1/2).
    - Status highlighting (Red if score < 75).
  - **Advanced Inputs**:
    - **Modal Input**: Focus mode to input all subject scores for a specific student.
    - **Excel Import**: Import scores for 10 subjects via Excel template (matches by NISN/Name).
  - **Calculations**:
    - **Cumulative Average**: Shows real-time average of ALL entered grades across all semesters for a student (2 decimal places).
    - Sticky columns for Name and Average for better readability.

- **Feature: Dashboard (Home)**:
  - **Real Data Integration**:
    - Displays total student count from DB.
    - Displays global average score from DB.
    - Personalized greeting based on time of day and user name.

### 🚧 In Progress / Planned
- **Feature: Pengolahan Nilai Ijazah**:
  - Implement calculation logic for final scores.
  - Create export/print view for diplomas.

## 📂 Database Schema
The database schema has been designed and moved to:
`supabase/migrations/20250102_initial_schema.sql`
Recent migrations:
- `20260121_create_profiles_table.sql`: Auth profiles.
- `refactor_roles_to_classname`: Switched from kode_par to class_name.
- `restrict_admin_view`: Limited admin view to Grade 6 classes.

## 📝 Usage Notes
- Run `npm run dev` to start the development server.
- Place Supabase credentials in `.env` (check `.env.example`).
- **Role Setup**: To restrict a Guru, update their `class_name` in the `profiles` table:
  `UPDATE profiles SET class_name = '6 A' WHERE email = 'guru@example.com';`
