import * as XLSX from 'xlsx';
import type { Student } from '../types/student';

export function exportStudentsToExcel(students: Student[], filename: string = 'Data_Siswa.xlsx') {
    // Prepare data for export
    const exportData = students.map((student, index) => ({
        'No': index + 1,
        'Nomor Peserta': student.exam_number,
        'NISN': student.nisn,
        'NIS': student.nis,
        'Kode Par': student.kode_par || '01',
        'Kode Abs': student.kode_abs || (index + 1).toString().padStart(2, '0'),
        'Nama Peserta': student.name,
        'L/P': student.gender,
        'Tempat Lahir': student.birth_place,
        'Tanggal Lahir': student.birth_date,
        'Nama Ayah': student.father_name,
        'Nama Ibu': student.mother_name,
        'NIK': student.nik,
        'NKK': student.nkk
    }));

    // Create a new workbook
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = [
        { wch: 5 },  // No
        { wch: 18 }, // Nomor Peserta
        { wch: 12 }, // NISN
        { wch: 12 }, // NIS
        { wch: 9 },  // Kode Par
        { wch: 9 },  // Kode Abs
        { wch: 30 }, // Nama Peserta
        { wch: 5 },  // L/P
        { wch: 15 }, // Tempat Lahir
        { wch: 15 }, // Tanggal Lahir
        { wch: 25 }, // Nama Ayah
        { wch: 25 }, // Nama Ibu
        { wch: 18 }, // NIK
        { wch: 18 }  // NKK
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');

    // Generate and download file
    XLSX.writeFile(wb, filename);
}
