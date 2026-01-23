// Force HMR update
import { useState, useEffect } from 'react';
import { Save, Filter, RefreshCw, Pencil, Upload } from 'lucide-react';
import { SUBJECTS, fetchGrades, saveBulkGrades } from '../lib/grades';
import type { StudentWithGrades, Grade } from '../lib/grades';
import StudentGradeModal from '../components/StudentGradeModal';
import ImportGradesModal from '../components/ImportGradesModal';

export default function Grades() {
    const [selectedLevel, setSelectedLevel] = useState<number>(6);
    const [selectedSemester, setSelectedSemester] = useState<number>(1);
    const [students, setStudents] = useState<StudentWithGrades[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Modal States
    const [selectedStudent, setSelectedStudent] = useState<StudentWithGrades | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, [selectedLevel, selectedSemester]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchGrades(selectedLevel, selectedSemester);
            setStudents(data);
            setHasChanges(false);
        } catch (err: any) {
            console.error('Error fetching grades:', err);
            setError('Failed to load grades. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = (studentId: string, subject: string, value: string | number | null) => {
        const numValue = value === '' ? null : Number(value);

        if (numValue !== null && (numValue < 0 || numValue > 100)) return;

        setStudents(prev => prev.map(student => {
            if (student.id !== studentId) return student;

            return {
                ...student,
                grades: {
                    ...student.grades,
                    [subject]: {
                        ...student.grades[subject],
                        knowledge_score: numValue
                    }
                }
            };
        }));
        setHasChanges(true);
    };

    const handleBatchUpdate = (studentId: string, updates: Record<string, number | null>) => {
        setStudents(prev => prev.map(student => {
            if (student.id !== studentId) return student;

            const newGrades = { ...student.grades };
            Object.entries(updates).forEach(([subject, score]) => {
                if (newGrades[subject]) {
                    newGrades[subject] = {
                        ...newGrades[subject],
                        knowledge_score: score
                    };
                }
            });

            return {
                ...student,
                grades: newGrades
            };
        }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!hasChanges) return;

        setSaving(true);
        setError(null);
        try {
            const allGrades: Grade[] = students.flatMap(s => Object.values(s.grades));
            await saveBulkGrades(allGrades);
            setHasChanges(false);
        } catch (err: any) {
            console.error('Error saving grades:', err);
            setError('Failed to save changes. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleImportFromExcel = (data: any[]) => {
        // Logic to match excel rows to students
        // We match by NISN (preferred) or Name (fuzzy or exact)

        let matchCount = 0;

        setStudents(prevStudents => {
            const newStudents = [...prevStudents];

            data.forEach(row => {
                const nisn = row['NISN'] ? String(row['NISN']) : null;
                const name = row['Nama'] ? String(row['Nama']).toLowerCase().trim() : null;

                // Find student
                const studentIndex = newStudents.findIndex(s => {
                    if (nisn && s.nisn === nisn) return true;
                    if (name && s.name.toLowerCase().trim() === name) return true;
                    return false;
                });

                if (studentIndex !== -1) {
                    matchCount++;
                    const student = newStudents[studentIndex];
                    const newGrades = { ...student.grades };

                    SUBJECTS.forEach(subject => {
                        const scoreVal = row[subject];
                        if (scoreVal !== undefined) {
                            const num = Number(scoreVal);
                            if (!isNaN(num) && num >= 0 && num <= 100) {
                                newGrades[subject] = {
                                    ...newGrades[subject],
                                    knowledge_score: num
                                };
                            }
                        }
                    });
                    newStudents[studentIndex] = { ...student, grades: newGrades };
                }
            });

            return newStudents;
        });

        if (matchCount > 0) {
            setHasChanges(true);
            alert(`Berhasil mengimport data untuk ${matchCount} siswa. Jangan lupa klik Simpan.`);
        } else {
            alert('Tidak ada siswa yang cocok dengan data Excel (Cek NISN/Nama).');
        }
    };

    const openEditModal = (student: StudentWithGrades) => {
        setSelectedStudent(student);
        setIsEditModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Rekap Nilai Rapor</h1>
                    <p className="text-slate-500">Input dan kelola nilai rapor siswa</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-medium shadow-sm hover:bg-slate-50 transition-all"
                    >
                        <Upload size={18} />
                        Import Excel
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold shadow-sm transition-all ${hasChanges
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md hover:scale-105'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        {saving ? <RefreshCw className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                        <span>{saving ? 'Saving...' : 'Simpan Perubahan'}</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-slate-600 mr-2">
                    <Filter size={20} />
                    <span className="font-medium">Filter:</span>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-lg border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500 px-2 uppercase">Kelas</span>
                    <div className="flex bg-white rounded-md shadow-sm">
                        <button
                            onClick={() => setSelectedLevel(5)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-l-md transition-colors ${selectedLevel === 5 ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            Kelas 5
                        </button>
                        <button
                            onClick={() => setSelectedLevel(6)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-r-md transition-colors ${selectedLevel === 6 ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            Kelas 6
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-lg border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500 px-2 uppercase">Semester</span>
                    <div className="flex bg-white rounded-md shadow-sm">
                        <button
                            onClick={() => setSelectedSemester(1)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-l-md transition-colors ${selectedSemester === 1 ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            Semester 1
                        </button>
                        <button
                            onClick={() => setSelectedSemester(2)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-r-md transition-colors ${selectedSemester === 2 ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            Semester 2
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center justify-between">
                    <p>{error}</p>
                    <button onClick={loadData} className="text-sm font-semibold hover:underline">Retry</button>
                </div>
            )}

            {/* Main Grid */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-lg ring-1 ring-black/5 overflow-hidden flex flex-col h-[calc(100vh-280px)]">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="overflow-auto flex-1 relative">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-slate-50 text-slate-600 sticky top-0 z-20 shadow-sm">
                                <tr>
                                    <th className="font-bold p-4 border-b border-r border-slate-200 min-w-[250px] sticky left-0 bg-slate-50 z-30">
                                        Nama Siswa
                                    </th>
                                    {SUBJECTS.map((subject, idx) => (
                                        <th key={idx} className="font-bold border-b border-r border-slate-200 text-center min-w-[80px] px-2 py-3">
                                            <div className="line-clamp-2 text-xs" title={subject}>
                                                {subject}
                                            </div>
                                        </th>
                                    ))}
                                    <th className="font-bold p-4 border-b border-slate-200 text-center min-w-[80px] bg-slate-100 z-30 sticky right-0 shadow-[-4px_0_4px_-2px_rgba(0,0,0,0.05)]">
                                        Rata-rata
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.map((student) => {
                                    // Average is now pre-calculated in fetchGrades to include ALL semesters (5-1, 5-2, 6-1, 6-2)
                                    const average = student.cumulative_average;

                                    return (
                                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group/row">
                                            <td className="p-3 border-r border-slate-200 sticky left-0 bg-white z-10 font-medium text-slate-700 group-hover/row:bg-slate-50">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span>{student.name}</span>
                                                        <span className="text-xs text-slate-400 font-normal">{student.nisn || '-'}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => openEditModal(student)}
                                                        className="opacity-0 group-hover/row:opacity-100 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        title="Edit Nilai Siswa"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                            {SUBJECTS.map((subject) => {
                                                const grade = student.grades[subject];
                                                const score = grade?.knowledge_score;

                                                return (
                                                    <td key={`${student.id}-${subject}`} className="p-1 border-r border-slate-200 text-center relative group">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={score ?? ''}
                                                            onChange={(e) => handleScoreChange(student.id, subject, e.target.value)}
                                                            className={`w-full h-full p-2 text-center bg-transparent focus:bg-indigo-50 focus:ring-2 focus:ring-inset focus:ring-indigo-500 outline-none transition-all font-mono
                                                                ${score === null ? 'placeholder-slate-200' : 'font-medium text-slate-900'}
                                                                ${score !== null && (score < 75) ? 'text-red-900 bg-red-50' : ''}
                                                            `}
                                                            placeholder="-"
                                                        />
                                                    </td>
                                                );
                                            })}
                                            <td className="p-3 text-center font-bold bg-slate-50 sticky right-0 z-10 shadow-[-4px_0_4px_-2px_rgba(0,0,0,0.05)] border-l border-slate-200">
                                                {average !== null ? (
                                                    <span className={average < 75 ? 'text-red-600' : 'text-slate-700'}>
                                                        {average.toFixed(2)}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {students.length === 0 && (
                                    <tr>
                                        <td colSpan={SUBJECTS.length + 2} className="p-8 text-center text-slate-500">
                                            Tidak ada data siswa ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            <StudentGradeModal
                student={selectedStudent}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleBatchUpdate}
            />

            <ImportGradesModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImportFromExcel}
                currentClassLevel={selectedLevel}
                currentSemester={selectedSemester}
            />
        </div>
    );
}
