
import { useState, useEffect } from 'react';
import StudentTable from '../components/StudentTable';
import StudentFormModal from '../components/StudentFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import ImportStudentsModal from '../components/ImportStudentsModal';
import type { Student } from '../types/student';
import { Search, Download, Plus, Filter, Upload, Loader2 } from 'lucide-react';
import { parseExcel } from '../utils/excelParser';
import { exportStudentsToExcel } from '../utils/excelExporter';
import { supabase } from '../lib/supabase';

export default function Students() {
    const [searchTerm, setSearchTerm] = useState("");
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [isImporting, setIsImporting] = useState(false);

    // Modal States
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; student: Student | null }>({
        isOpen: false,
        student: null
    });

    // Filters
    const [showFilter, setShowFilter] = useState(false);
    const [filterGender, setFilterGender] = useState<'all' | 'L' | 'P'>('all');
    const [filterKodePar, setFilterKodePar] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Fetch students from Supabase
    const fetchStudents = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;

            if (data) {
                setStudents(data as unknown as Student[]);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
            alert('Gagal mengambil data siswa. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    // Import Handler
    const handleImportFile = async (file: File) => {
        setIsImporting(true);
        try {
            const parsedStudents = await parseExcel(file);

            // Sanitize data (remove fields not in DB yet)
            const sanitizedStudents = parsedStudents.map(s => {
                const { kode_par, kode_abs, no_urut, id, ...rest } = s;
                return rest;
            });

            // Bulk insert
            const { error } = await supabase.from('students').insert(sanitizedStudents).select();

            if (error) throw error;

            await fetchStudents(); // Refresh data
            setIsImportModalOpen(false); // Close modal on success
            alert(`Berhasil mengimport ${parsedStudents.length} data siswa!`);
        } catch (error: any) {
            console.error("Import error:", error);
            alert(`Gagal mengimport data: ${error.message || 'Unknown error'}`);
        } finally {
            setIsImporting(false);
        }
    };

    // Export Handler
    const handleExport = () => {
        const dataToExport = filterGender === 'all' && filterKodePar === 'all'
            ? students
            : filteredStudents;

        exportStudentsToExcel(dataToExport);
    };

    // Add student handler
    const handleAddStudent = () => {
        setModalMode('add');
        setSelectedStudent(null);
        setIsFormModalOpen(true);
    };

    // Edit student handler  
    const handleEditStudent = (student: Student) => {
        setModalMode('edit');
        setSelectedStudent(student);
        setIsFormModalOpen(true);
    };

    // Delete student handler
    const handleDeleteStudent = (student: Student) => {
        setDeleteConfirm({ isOpen: true, student });
    };

    const confirmDelete = async () => {
        if (deleteConfirm.student) {
            try {
                const { error } = await supabase
                    .from('students')
                    .delete()
                    .eq('id', deleteConfirm.student.id);

                if (error) throw error;

                setStudents(prev => prev.filter(s => s.id !== deleteConfirm.student!.id));
                setDeleteConfirm({ isOpen: false, student: null });
            } catch (error: any) {
                console.error('Error deleting student:', error);
                alert(`Gagal menghapus siswa: ${error.message}`);
            }
        }
    };

    // Submit form handler (Add/Edit)
    const handleFormSubmit = async (studentData: Partial<Student>) => {
        try {
            if (modalMode === 'add') {
                const { id, kode_par, kode_abs, no_urut, ...dataToInsert } = studentData;

                const { data, error } = await supabase
                    .from('students')
                    .insert(dataToInsert)
                    .select()
                    .single();

                if (error) throw error;

                if (data) {
                    setStudents(prev => [...prev, data as unknown as Student]);
                }
            } else {
                const { id, kode_par, kode_abs, no_urut, ...dataToUpdate } = studentData;
                const { error } = await supabase
                    .from('students')
                    .update(dataToUpdate)
                    .eq('id', selectedStudent!.id);

                if (error) throw error;

                setStudents(prev => prev.map(s =>
                    s.id === selectedStudent?.id ? { ...s, ...studentData } as Student : s
                ));
            }
            setIsFormModalOpen(false); // Close modal on success
        } catch (error: any) {
            console.error('Error saving student:', error);
            alert(`Gagal menyimpan data: ${error.message}`);
        }
    };

    // Filter students
    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (student.nisn && student.nisn.includes(searchTerm)) ||
            (student.exam_number && student.exam_number.includes(searchTerm));

        const matchesGender = filterGender === 'all' || student.gender === filterGender;
        const studentKodePar = student.kode_par || '01';
        const matchesKodePar = filterKodePar === 'all' || studentKodePar === filterKodePar;

        return matchesSearch && matchesGender && matchesKodePar;
    });

    // Pagination
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

    const handleFilterChange = () => {
        setCurrentPage(1);
    };

    const uniqueKodePar = Array.from(new Set(students.map(s => s.kode_par || '01'))).sort();

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Data Peserta Ujian (DNS dan DNT)</h1>
                    <p className="text-slate-500 mt-1">Kelola data siswa peserta ujian kelas 6.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium hover:bg-slate-50 shadow-sm transition-all"
                    >
                        <Upload size={18} />
                        <span className="hidden md:inline">Import Excel</span>
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium hover:bg-slate-50 shadow-sm transition-all"
                    >
                        <Download size={18} />
                        <span className="hidden md:inline">Export</span>
                    </button>
                    <button
                        onClick={handleAddStudent}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm shadow-blue-200 transition-all active:scale-95"
                    >
                        <Plus size={18} />
                        <span>Tambah Siswa</span>
                    </button>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cari berdasarkan nama, NISN, atau nomor peserta..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                handleFilterChange();
                            }}
                        />
                    </div>
                    <button
                        onClick={() => setShowFilter(!showFilter)}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all ${showFilter
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Filter size={18} />
                        Filter
                        {(filterGender !== 'all' || filterKodePar !== 'all') && (
                            <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                                {(filterGender !== 'all' ? 1 : 0) + (filterKodePar !== 'all' ? 1 : 0)}
                            </span>
                        )}
                    </button>
                </div>

                {/* Filter Panel */}
                {showFilter && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-900">Filter Data</h3>
                            <button
                                onClick={() => {
                                    setFilterGender('all');
                                    setFilterKodePar('all');
                                    handleFilterChange();
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Reset Filter
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Jenis Kelamin</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setFilterGender('all');
                                            handleFilterChange();
                                        }}
                                        className={`flex-1 px-3 py-2 rounded-lg border transition-all ${filterGender === 'all'
                                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        Semua
                                    </button>
                                    <button
                                        onClick={() => {
                                            setFilterGender('L');
                                            handleFilterChange();
                                        }}
                                        className={`flex-1 px-3 py-2 rounded-lg border transition-all ${filterGender === 'L'
                                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        Laki-laki
                                    </button>
                                    <button
                                        onClick={() => {
                                            setFilterGender('P');
                                            handleFilterChange();
                                        }}
                                        className={`flex-1 px-3 py-2 rounded-lg border transition-all ${filterGender === 'P'
                                            ? 'bg-pink-50 border-pink-500 text-pink-700'
                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        Perempuan
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Kode Paralel</label>
                                <select
                                    value={filterKodePar}
                                    onChange={(e) => {
                                        setFilterKodePar(e.target.value);
                                        handleFilterChange();
                                    }}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    <option value="all">Semua Paralel</option>
                                    {uniqueKodePar.map(kode => (
                                        <option key={kode} value={kode}>Paralel {kode}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[300px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <p>Memuat data siswa...</p>
                    </div>
                ) : students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <p className="text-lg font-medium text-slate-600">Belum ada data</p>
                        <p className="text-sm">Silakan import data Excel atau tambah siswa baru.</p>
                    </div>
                ) : (
                    <>
                        <StudentTable
                            students={paginatedStudents}
                            onEdit={handleEditStudent}
                            onDelete={handleDeleteStudent}
                        />
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                            <p>
                                Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredStudents.length)} dari {filteredStudents.length} siswa
                                {filteredStudents.length !== students.length && ` (total: ${students.length})`}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </button>
                                <div className="flex items-center gap-1 px-2">
                                    <span className="font-medium text-slate-900">{currentPage}</span>
                                    <span>/</span>
                                    <span>{totalPages || 1}</span>
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={currentPage >= totalPages}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Modals */}
            <StudentFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleFormSubmit}
                student={selectedStudent}
                mode={modalMode}
            />

            <ImportStudentsModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImportFile}
                isImporting={isImporting}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="Hapus Data Siswa"
                message={`Apakah Anda yakin ingin menghapus data siswa "${deleteConfirm.student?.name}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Hapus"
                cancelText="Batal"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm({ isOpen: false, student: null })}
            />
        </div>
    );
}
