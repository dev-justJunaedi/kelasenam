import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Sample data untuk template
const sampleData = [
    {
        'No': 1,
        'Nomor Peserta': '04-0291-0001-8',
        'NISN': '0085182706',
        'NIS': '1415.1.002',
        'Kode Par': '01',
        'Kode Abs': '01',
        'Nama Peserta': 'Adhnan Tridzikrianto',
        'L/P': 'L',
        'Tempat Lahir': 'Cilacap',
        'Tanggal Lahir': '11 Maret 2008',
        'Nama Ayah': 'Nuryanto',
        'Nama Ibu': 'Tri Yuliyanti',
        'NIK': '3674051103080003',
        'NKK': '3674051009120042'
    },
    {
        'No': 2,
        'Nomor Peserta': '04-0291-0002-7',
        'NISN': '0083197116',
        'NIS': '1415.1.003',
        'Kode Par': '01',
        'Kode Abs': '02',
        'Nama Peserta': 'Afrina Diana Cahya Ningsih',
        'L/P': 'P',
        'Tempat Lahir': 'Jakarta',
        'Tanggal Lahir': '21 April 2008',
        'Nama Ayah': 'Sugiyono',
        'Nama Ibu': 'Murniyati',
        'NIK': '3674056104080002',
        'NKK': '3674052201102772'
    },
    {
        'No': '',
        'Nomor Peserta': '',
        'NISN': '',
        'NIS': '',
        'Kode Par': '01',
        'Kode Abs': '',
        'Nama Peserta': '',
        'L/P': '',
        'Tempat Lahir': '',
        'Tanggal Lahir': '',
        'Nama Ayah': '',
        'Nama Ibu': '',
        'NIK': '',
        'NKK': ''
    }
];

// Create workbook
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(sampleData);

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

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');

// Ensure public directory exists
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// Write file
const outputPath = path.join(publicDir, 'Template_Import_Siswa.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`✅ Template berhasil dibuat di: ${outputPath}`);
