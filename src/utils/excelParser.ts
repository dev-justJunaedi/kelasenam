
import * as XLSX from 'xlsx';
import type { Student } from '../types/student';

// Helper to format date to YYYY-MM-DD
const formatDate = (val: any): string | null => {
    if (!val) return null;
    if (val instanceof Date) {
        return val.toISOString().split('T')[0];
    }
    // Handle potential numeric string (Excel serial) if cellDates failed or mixed
    if (typeof val === 'number') {
        const date = new Date((val - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
    }
    return String(val);
};

export const parseExcel = (file: File): Promise<Student[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
                const sheetName = workbook.SheetNames[0]; // Assume first sheet
                const sheet = workbook.Sheets[sheetName];

                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                const students: Student[] = [];

                // Find header row by looking for key columns "NISN" and "Nama Peserta" (or "Nama")
                let headerRowIndex = -1;
                for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
                    const row: any = jsonData[i];
                    // Convert row to string array for searching
                    const rowStr = row.map((cell: any) => String(cell).toLowerCase());

                    if (rowStr.includes('nisn') && (rowStr.includes('nama peserta') || rowStr.includes('nama'))) {
                        headerRowIndex = i;
                        break;
                    }
                }

                // If header found, start from next row. If not, default to index 1 (assuming row 0 is header)
                const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 1;

                // Identify column indices if header found
                let colMap = {
                    no: 0,
                    no_peserta: 1,
                    nisn: 2,
                    nis: 3,
                    kode_par: 4,
                    kode_abs: 5,
                    nama: 6,
                    gender: 7,
                    tmp_lahir: 8,
                    tgl_lahir: 9,
                    ayah: 10,
                    ibu: 11,
                    nik: 12,
                    nkk: 13
                };

                if (headerRowIndex !== -1) {
                    const headerRow: any = jsonData[headerRowIndex];
                    headerRow.forEach((cell: any, index: number) => {
                        const val = String(cell).toLowerCase().trim();
                        if (val === 'no') colMap.no = index;
                        if (val.includes('peserta') && val.includes('nomor')) colMap.no_peserta = index;
                        if (val === 'nisn') colMap.nisn = index;
                        if (val === 'nis') colMap.nis = index;
                        if (val.includes('par')) colMap.kode_par = index;
                        if (val.includes('abs')) colMap.kode_abs = index;
                        if (val.includes('nama') && (val.includes('peserta') || val.includes('siswa'))) colMap.nama = index;
                        else if (val === 'nama') colMap.nama = index;
                        if (val === 'l/p' || val === 'jk' || val === 'jenis kelamin') colMap.gender = index;
                        if (val.includes('tempat') && val.includes('lahir')) colMap.tmp_lahir = index;
                        if (val.includes('tanggal') && val.includes('lahir')) colMap.tgl_lahir = index;
                        if (val.includes('ayah')) colMap.ayah = index;
                        if (val.includes('ibu')) colMap.ibu = index;
                        if (val === 'nik') colMap.nik = index;
                        if (val === 'nkk') colMap.nkk = index;
                    });
                }

                for (let i = startRow; i < jsonData.length; i++) {
                    const row: any = jsonData[i];
                    if (!row || row.length === 0) continue;

                    // Safety check: Needs Name
                    if (!row[colMap.nama]) continue;

                    // Skip header-like rows that might appear again
                    if (String(row[colMap.nama]).toLowerCase().includes('nama peserta')) continue;

                    const student: Student = {
                        id: crypto.randomUUID(),
                        exam_number: row[colMap.no_peserta]?.toString() || '',
                        nisn: row[colMap.nisn]?.toString() || '',
                        nis: row[colMap.nis]?.toString() || '',
                        kode_par: row[colMap.kode_par]?.toString() || '01',
                        kode_abs: row[colMap.kode_abs]?.toString() || '',
                        name: row[colMap.nama]?.toString() || '',
                        gender: row[colMap.gender]?.toString() === 'P' ? 'P' : 'L', // Default to L if not P
                        birth_place: row[colMap.tmp_lahir]?.toString() || '',
                        birth_date: formatDate(row[colMap.tgl_lahir]),
                        father_name: row[colMap.ayah]?.toString() || '',
                        mother_name: row[colMap.ibu]?.toString() || '',
                        nik: row[colMap.nik]?.toString() || '',
                        nkk: row[colMap.nkk]?.toString() || ''
                    };

                    students.push(student);
                }

                resolve(students);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};
