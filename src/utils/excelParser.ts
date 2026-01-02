
import * as XLSX from 'xlsx';
import type { Student } from '../types/student';

export const parseExcel = (file: File): Promise<Student[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0]; // Assume first sheet
                const sheet = workbook.Sheets[sheetName];

                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                // Basic mapping logic (skipping header row)
                // We assume specific column order based on the user's screenshot/DNT format
                // Or we can try to map by column headers if they exist
                // For now, let's try to map commonly used DNT formats
                // Row 0 is usually header

                const students: Student[] = [];

                // Start from row 1 (index 1) assuming row 0 is header
                // If the user's excel structure is complex (like the screenshot with merged cells), 
                // we might need to look for the data start row.

                // Simple 1-1 mapping assumption for MVP, can be refined with user feedback
                // We will look for the first row that looks like data (has an integer sequence in first col)

                let startRow = 1;
                // Simple heuristic: look for a row where the first cell is '1'
                for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
                    const row: any = jsonData[i];
                    if (row && (row[0] == 1 || row[0] == '1')) {
                        startRow = i;
                        break;
                    }
                }

                for (let i = startRow; i < jsonData.length; i++) {
                    const row: any = jsonData[i];
                    if (!row || row.length === 0) continue;

                    // Map columns roughly based on DNT standard order observed in screenshot:
                    // No | No Peserta | NISN | NIS | Kode Par | Kode Abs | Nama | L/P | Tmp Lahir | Tgl Lahir | Nama Ayah | Nama Ibu | NIK | NKK

                    if (!row[2] || !row[6]) continue; // Skip if no NISN or Name (safety check)

                    const student: Student = {
                        id: crypto.randomUUID(), // Temp ID
                        exam_number: row[1]?.toString() || '',
                        nisn: row[2]?.toString() || '',
                        nis: row[3]?.toString() || '',
                        kode_par: row[4]?.toString() || '01',
                        kode_abs: row[5]?.toString() || '',
                        name: row[6]?.toString() || '',
                        gender: row[7]?.toString() === 'L' ? 'L' : 'P', // row[7] is L/P
                        birth_place: row[8]?.toString() || '',
                        birth_date: row[9]?.toString() || '', // Need to handle Excel date format if it's not string
                        father_name: row[10]?.toString() || '',
                        mother_name: row[11]?.toString() || '',
                        nik: row[12]?.toString() || '',
                        nkk: row[13]?.toString() || ''
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
