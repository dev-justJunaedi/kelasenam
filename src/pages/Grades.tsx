// Force HMR update
import { useState, useEffect, useRef, useCallback } from 'react';
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
    const [activeCell, setActiveCell] = useState<{row: number, col: number} | null>(null);

    // Refs for Excel-like navigation
    const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
    const tableRef = useRef<HTMLDivElement>(null);

    // Modal States
    const [selectedStudent, setSelectedStudent] = useState<StudentWithGrades | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Register input ref
    const registerInput = useCallback((key: string, el: HTMLInputElement | null) => {
        if (el) {
            inputRefs.current.set(key, el);
        } else {
            inputRefs.current.delete(key);
        }
    }, []);

    const handleScoreChange = useCallback((studentId: string, subject: string, value: string | number | null) => {
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
    }, []);

    // Focus a specific cell
    const focusCell = useCallback((row: number, col: number) => {
        if (row < 0 || row >= students.length) return;
        if (col < 0 || col >= SUBJECTS.length) return;

        const key = `${students[row].id}-${SUBJECTS[col]}`;
        const input = inputRefs.current.get(key);
        if (input) {
            input.focus();
            input.select();
            setActiveCell({row, col});
            
            // Scroll cell into view if needed
            input.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
    }, [students]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
        const numRows = students.length;
        const numCols = SUBJECTS.length;

        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                focusCell(rowIndex - 1, colIndex);
                break;
            case 'ArrowDown':
                e.preventDefault();
                focusCell(rowIndex + 1, colIndex);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                focusCell(rowIndex, colIndex - 1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                focusCell(rowIndex, colIndex + 1);
                break;
            case 'Tab':
                e.preventDefault();
                if (e.shiftKey) {
                    // Shift+Tab: move backward
                    if (colIndex > 0) {
                        focusCell(rowIndex, colIndex - 1);
                    } else if (rowIndex > 0) {
                        focusCell(rowIndex - 1, numCols - 1);
                    }
                } else {
                    // Tab: move forward
                    if (colIndex < numCols - 1) {
                        focusCell(rowIndex, colIndex + 1);
                    } else if (rowIndex < numRows - 1) {
                        focusCell(rowIndex + 1, 0);
                    }
                }
                break;
            case 'Enter':
                e.preventDefault();
                if (e.shiftKey) {
                    // Shift+Enter: move up
                    focusCell(rowIndex - 1, colIndex);
                } else {
                    // Enter: move down
                    focusCell(rowIndex + 1, colIndex);
                }
                break;
            case 'Home':
                e.preventDefault();
                focusCell(rowIndex, 0);
                break;
            case 'End':
                e.preventDefault();
                focusCell(rowIndex, numCols - 1);
                break;
        }
    }, [students.length, focusCell]);

    // Handle paste from clipboard (Excel-like) - works at table level
    const handleTablePaste = useCallback((e: React.ClipboardEvent) => {
        // Only handle paste if we're inside the table and have an active cell
        if (!activeCell || !tableRef.current?.contains(e.target as Node)) return;
        
        e.preventDefault();
        const text = e.clipboardData.getData('text');
        
        if (!text) return;
        
        // Parse pasted data (tab-separated columns, newline-separated rows like Excel)
        // Excel uses \r\n for newlines, but we handle both \r\n and \n
        const rows = text.split(/\r\n|\n/).filter(row => row.trim() !== '');
        const data = rows.map(row => row.split('\t'));
        
        if (data.length === 0) return;
        
        let changesMade = false;
        const startRow = activeCell.row;
        const startCol = activeCell.col;
        
        // Apply data to cells
        data.forEach((rowData, rowOffset) => {
            const targetRow = startRow + rowOffset;
            if (targetRow >= students.length) return;
            
            rowData.forEach((value, colOffset) => {
                const targetCol = startCol + colOffset;
                if (targetCol >= SUBJECTS.length) return;
                
                const trimmedValue = value.trim();
                if (trimmedValue === '') return;
                
                const numValue = Number(trimmedValue);
                if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                    handleScoreChange(students[targetRow].id, SUBJECTS[targetCol], numValue);
                    changesMade = true;
                }
            });
        });
        
        if (changesMade) {
            setHasChanges(true);
        }
    }, [activeCell, students, handleScoreChange]);

    // Handle copy to clipboard
    const handleTableCopy = useCallback((e: React.ClipboardEvent) => {
        if (!activeCell || !tableRef.current?.contains(e.target as Node)) return;
        
        e.preventDefault();
        const student = students[activeCell.row];
        const subject = SUBJECTS[activeCell.col];
        const score = student.grades[subject]?.knowledge_score;
        
        if (score !== null && score !== undefined) {
            e.clipboardData.setData('text/plain', String(score));
        }
    }, [activeCell, students]);

    const loadData = useCallback(async () => {
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
    }, [selectedLevel, selectedSemester]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Reset active cell when clicking outside the table
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (tableRef.current && !tableRef.current.contains(e.target as Node)) {
                setActiveCell(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                            onClick={() => setSelectedLevel(4)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-l-md transition-colors ${selectedLevel === 4 ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            Kelas 4
                        </button>
                        <button
                            onClick={() => setSelectedLevel(5)}
                            className={`px-4 py-1.5 text-sm font-medium transition-colors ${selectedLevel === 5 ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
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

            {/* Excel-like Grid */}
            <div 
                ref={tableRef}
                onPaste={handleTablePaste}
                onCopy={handleTableCopy}
                className="bg-white border border-slate-200 rounded-xl shadow-lg ring-1 ring-black/5 overflow-hidden flex flex-col h-[calc(100vh-280px)]"
            >
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
                                {students.map((student, rowIndex) => {
                                    // Average is now pre-calculated in fetchGrades to include ALL semesters (4-1, 4-2, 5-1, 5-2, 6-1, 6-2)
                                    const average = student.cumulative_average;
                                    const isRowActive = activeCell?.row === rowIndex;

                                    return (
                                        <tr key={student.id} className={`hover:bg-slate-50/50 transition-colors group/row ${isRowActive ? 'bg-indigo-50/30' : ''}`}>
                                            <td className={`p-3 border-r border-slate-200 sticky left-0 z-10 font-medium text-slate-700 group-hover/row:bg-slate-50 transition-colors ${isRowActive ? 'bg-indigo-50/50' : 'bg-white'}`}>
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
                                            {SUBJECTS.map((subject, colIndex) => {
                                                const grade = student.grades[subject];
                                                const score = grade?.knowledge_score;
                                                const cellKey = `${student.id}-${subject}`;
                                                const isActive = activeCell?.row === rowIndex && activeCell?.col === colIndex;

                                                return (
                                                    <td key={cellKey} className={`p-0 border-r border-slate-200 text-center relative transition-colors ${isActive ? 'bg-indigo-50' : ''} ${isRowActive && !isActive ? 'bg-indigo-50/20' : ''}`}>
                                                        <input
                                                            ref={(el) => registerInput(cellKey, el)}
                                                            type="text"
                                                            inputMode="numeric"
                                                            value={score ?? ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val === '' || /^\d*$/.test(val)) {
                                                                    const num = val === '' ? null : Number(val);
                                                                    if (num === null || (num >= 0 && num <= 100)) {
                                                                        handleScoreChange(student.id, subject, num);
                                                                    }
                                                                }
                                                            }}
                                                            onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                                                            onFocus={() => setActiveCell({row: rowIndex, col: colIndex})}
                                                            className={`w-full h-full p-2 text-center bg-transparent focus:bg-indigo-50 focus:ring-2 focus:ring-inset focus:ring-indigo-500 outline-none transition-all font-mono cursor-cell
                                                                ${score === null ? 'placeholder-slate-200' : 'font-medium text-slate-900'}
                                                                ${score !== null && (score < 75) ? 'text-red-900 bg-red-50' : ''}
                                                                ${isActive ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-50' : ''}
                                                            `}
                                                            placeholder="-"
                                                        />
                                                    </td>
                                                );
                                            })}
                                            <td className={`p-3 text-center font-bold sticky right-0 z-10 shadow-[-4px_0_4px_-2px_rgba(0,0,0,0.05)] border-l border-slate-200 transition-colors ${isRowActive ? 'bg-indigo-50/50' : 'bg-slate-50'}`}>
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
