
import { useState, useRef } from 'react';
import StudentTable from '../components/StudentTable';
import type { Student } from '../types/student';
import { Search, Download, Plus, Filter, Upload } from 'lucide-react';
import { parseExcel } from '../utils/excelParser';

export default function Students() {
    const [searchTerm, setSearchTerm] = useState("");
    const [students, setStudents] = useState<Student[]>([
        {
            id: "1",
            exam_number: "04-0291-0001-8",
            nisn: "0085182706",
            nis: "1415.1.002",
            kode_par: "01",
            kode_abs: "01",
            name: "Adhnan Tridzikrianto",
            gender: "L",
            birth_place: "Cilacap",
            birth_date: "11 Maret 2008",
            father_name: "Nuryanto",
            mother_name: "Tri Yuliyanti",
            nik: "3674051103080003",
            nkk: "3674051009120042"
        },
        {
            id: "2",
            exam_number: "04-0291-0002-7",
            nisn: "0083197116",
            nis: "1415.1.003",
            kode_par: "01",
            kode_abs: "02",
            name: "Afrina Diana Cahya Ningsih",
            gender: "P",
            birth_place: "Jakarta",
            birth_date: "21 April 2008",
            father_name: "Sugiyono",
            mother_name: "Murniyati",
            nik: "3674056104080002",
            nkk: "3674052201102772"
        },
        {
            id: "3",
            exam_number: "04-0291-0003-6",
            nisn: "0088389034",
            nis: "1415.1.004",
            kode_par: "01",
            kode_abs: "03",
            name: "Ahmad Nurzakky",
            gender: "L",
            birth_place: "Salatiga",
            birth_date: "17 Mei 2008",
            father_name: "Muhamad Ihsan",
            mother_name: "Eka Fathonah",
            nik: "3674051705080002",
            nkk: "3674053005110027"
        }
    ]);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const parsedStudents = await parseExcel(file);
            // In a real app, we would perform a bulk insert to Supabase here
            // const { error } = await supabase.from('students').insert(parsedStudents);

            // For now, update local state
            setStudents(prev => [...prev, ...parsedStudents]);
            alert(`Berhasil mengimport ${parsedStudents.length} data siswa!`);
        } catch (error) {
            console.error("Import error:", error);
            alert("Gagal mengimport data. Pastikan format Excel sesuai.");
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.nisn.includes(searchTerm) ||
        student.exam_number.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Data Peserta Ujian (DNT)</h1>
                    <p className="text-slate-500 mt-1">Kelola data siswa peserta ujian kelas 6.</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".xlsx, .xls"
                    />
                    <button
                        onClick={handleImportClick}
                        disabled={isImporting}
                        className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50"
                    >
                        <Upload size={18} />
                        <span className="hidden md:inline">{isImporting ? 'Importing...' : 'Import Excel'}</span>
                    </button>
                    <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium hover:bg-slate-50 shadow-sm transition-all">
                        <Download size={18} />
                        <span className="hidden md:inline">Export</span>
                    </button>
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm shadow-blue-200 transition-all active:scale-95">
                        <Plus size={18} />
                        <span>Tambah Siswa</span>
                    </button>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Cari berdasarkan nama, NISN, atau nomor peserta..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
                    <Filter size={18} />
                    Filter
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <StudentTable
                    students={filteredStudents}
                    onEdit={(s) => console.log('Edit', s)}
                    onDelete={(s) => console.log('Delete', s)}
                />
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                    <p>Menampilkan {filteredStudents.length} dari {students.length} siswa</p>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50" disabled>Previous</button>
                        <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50" disabled>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
