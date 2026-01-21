const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

async function testParser() {
    try {
        const filePath = path.join(__dirname, '../public/Template_Import_Siswa.xlsx');
        const buffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        console.log("Total rows in JSON:", jsonData.length);

        // --- Logic copied and adapted from excelParser.ts ---
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
            const row = jsonData[i];
            if (!row) continue;
            const rowStr = row.map(cell => String(cell).toLowerCase());

            if (rowStr.includes('nisn') && (rowStr.includes('nama peserta') || rowStr.includes('nama'))) {
                headerRowIndex = i;
                console.log("Header found at index:", i);
                break;
            }
        }

        const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 1;
        console.log("Start parsing from row:", startRow);

        let colMap = {
            no: 0, no_peserta: 1, nisn: 2, nis: 3, kode_par: 4, kode_abs: 5, nama: 6,
            gender: 7, tmp_lahir: 8, tgl_lahir: 9, ayah: 10, ibu: 11, nik: 12, nkk: 13
        };

        if (headerRowIndex !== -1) {
            const headerRow = jsonData[headerRowIndex];
            headerRow.forEach((cell, index) => {
                const val = String(cell).toLowerCase().trim();
                if (val === 'no') colMap.no = index;
                if (val.includes('peserta') && val.includes('nomor')) colMap.no_peserta = index;
                if (val === 'nisn') colMap.nisn = index;
                if (val.includes('nama') && (val.includes('peserta') || val.includes('siswa'))) colMap.nama = index;
                // ... (simplified mapping for test)
            });
        }

        let parsedCount = 0;
        for (let i = startRow; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;

            // Log row for debug
            // console.log(`Row ${i}:`, row);

            if (!row[colMap.nama]) {
                console.log(`Skipping row ${i} because Name is missing`);
                continue;
            }

            if (String(row[colMap.nama]).toLowerCase().includes('nama peserta')) continue;

            parsedCount++;
            console.log(`Parsed row ${i}: ${row[colMap.nama]}`);
        }

        console.log(`✅ Successfully parsed ${parsedCount} students.`);

        if (parsedCount === 0) {
            console.error("❌ FAILED: 0 students parsed.");
            process.exit(1);
        }

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

testParser();
