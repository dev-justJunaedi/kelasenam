import { useState, useEffect, useRef, useCallback } from 'react';
import { Save, RefreshCw, BookOpen, Calculator } from 'lucide-react';
import { fetchTKAData, saveBulkTKAScores } from '../lib/tka';
import type { StudentWithTKA, TKAScore } from '../lib/tka';

const TKA_FIELDS: ('bahasa_indonesia' | 'matematika')[] = ['bahasa_indonesia', 'matematika'];

export default function TKA() {
    const [students, setStudents] = useState<StudentWithTKA[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [activeCell, setActiveCell] = useState<{row: number, col: number} | null>(null);

    const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
    const tableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchTKAData();
            setStudents(data);
            setHasChanges(false);
        } catch (err: any) {
            console.error('Error fetching TKA data:', err);
            setError('Gagal memuat data TKA. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    }, []);

    const registerInput = useCallback((key: string, el: HTMLInputElement | null) => {
        if (el) {
            inputRefs.current.set(key, el);
        } else {
            inputRefs.current.delete(key);
        }
    }, []);

    const focusCell = useCallback((row: number, col: number) => {
        if (row < 0 || row >= students.length) return;
        if (col < 0 || col >= TKA_FIELDS.length) return;

        const key = `${students[row].id}-${TKA_FIELDS[col]}`;
        const input = inputRefs.current.get(key);
        if (input) {
            input.focus();
            input.select();
            setActiveCell({row, col});
            input.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
    }, [students]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
        const numRows = students.length;
        const numCols = TKA_FIELDS.length;

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
                    if (colIndex > 0) {
                        focusCell(rowIndex, colIndex - 1);
                    } else if (rowIndex > 0) {
                        focusCell(rowIndex - 1, numCols - 1);
                    }
                } else {
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
                    focusCell(rowIndex - 1, colIndex);
                } else {
                    focusCell(rowIndex + 1, colIndex);
                }
                break;
        }
    }, [students.length, focusCell]);

    const handleTablePaste = useCallback((e: React.ClipboardEvent) => {
        if (!activeCell || !tableRef.current?.contains(e.target as Node)) return;
        
        e.preventDefault();
        const text = e.clipboardData.getData('text');
        
        if (!text) return;
        
        const rows = text.split(/\r\n|\n/).filter(row => row.trim() !== '');
        const data = rows.map(row => row.split('\t'));
        
        if (data.length === 0) return;
        
        let changesMade = false;
        const startRow = activeCell.row;
        const startCol = activeCell.col;
        
        data.forEach((rowData, rowOffset) => {
            const targetRow = startRow + rowOffset;
            if (targetRow >= students.length) return;
            
            rowData.forEach((value, colOffset) => {
                const targetCol = startCol + colOffset;
                if (targetCol >= TKA_FIELDS.length) return;
                
                const trimmedValue = value.trim();
                if (trimmedValue === '') return;
                
                const numValue = Number(trimmedValue);
                if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                    handleScoreChange(students[targetRow].id, TKA_FIELDS[targetCol], numValue);
                    changesMade = true;
                }
            });
        });
        
        if (changesMade) {
            setHasChanges(true);
        }
    }, [activeCell, students]);

    const handleTableCopy = useCallback((e: React.ClipboardEvent) => {
        if (!activeCell || !tableRef.current?.contains(e.target as Node)) return;
        
        e.preventDefault();
        const student = students[activeCell.row];
        const field = TKA_FIELDS[activeCell.col];
        const score = student.tka?.[field];
        
        if (score !== null && score !== undefined) {
            e.clipboardData.setData('text/plain', String(score));
        }
    }, [activeCell, students]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (tableRef.current && !tableRef.current.contains(e.target as Node)) {
                setActiveCell(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleScoreChange = (studentId: string, field: 'bahasa_indonesia' | 'matematika', value: string | number | null) => {
        const numValue = value === '' ? null : Number(value);
        
        if (numValue !== null && (numValue < 0 || numValue > 100)) return;

        setStudents(prev => prev.map(student => {
            if (student.id !== studentId) return student;

            const tkaBI = field === 'bahasa_indonesia' ? numValue : (student.tka?.bahasa_indonesia ?? null);
            const tkaMTK = field === 'matematika' ? numValue : (student.tka?.matematika ?? null);
            
            const average = (tkaBI !== null && tkaMTK !== null)
                ? (tkaBI + tkaMTK) / 2
                : null;

            return {
                ...student,
                tka: {
                    ...student.tka,
                    student_id: studentId,
                    [field]: numValue,
                    bahasa_indonesia: tkaBI,
                    matematika: tkaMTK,
                    average: average
                } as TKAScore
            };
        }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!hasChanges) return;

        setSaving(true);
        setError(null);
        try {
            const scoresToSave = students
                .filter(s => s.tka && (s.tka.bahasa_indonesia !== null || s.tka.matematika !== null))
                .map(s => s.tka!);

            await saveBulkTKAScores(scoresToSave);
            setHasChanges(false);
        } catch (err: any) {
            console.error('Error saving TKA data:', err);
            setError('Gagal menyimpan data. Silakan coba lagi.');
        } finally {
            setSaving(false);
        }
    };

    const getScoreColor = (score: number | null) => {
        if (score === null) return 'text-slate-400';
        if (score >= 80) return 'text-green-600';
        if (score >= 70) return 'text-blue-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const subjectLabels = {
        bahasa_indonesia: 'Bahasa Indonesia',
        matematika: 'Matematika'
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Input Nilai TKA</h1>
                    <p className="text-slate-500">Input nilai Tes Kemampuan Akademik (Bahasa Indonesia & Matematika)</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold shadow-sm transition-all ${hasChanges
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md hover:scale-105'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        {saving ? <RefreshCw className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                        <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center gap-2">
                    <BookOpen size={20} />
                    <p>{error}</p>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <BookOpen size={16} />
                        <span className="text-xs font-medium">Total Siswa</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{students.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <BookOpen size={16} />
                        <span className="text-xs font-medium">B.Indonesia Diisi</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">
                        {students.filter(s => s.tka?.bahasa_indonesia !== null).length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <BookOpen size={16} />
                        <span className="text-xs font-medium">Matematika Diisi</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">
                        {students.filter(s => s.tka?.matematika !== null).length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Calculator size={16} />
                        <span className="text-xs font-medium">Rata-rata Diisi</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">
                        {students.filter(s => s.tka?.average !== null).length}
                    </p>
                </div>
            </div>

            <div 
                ref={tableRef}
                onPaste={handleTablePaste}
                onCopy={handleTableCopy}
                className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden flex flex-col"
            >
                {loading ? (
                    <div className="flex-1 flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="overflow-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-slate-50 text-slate-600 sticky top-0 z-20 shadow-sm">
                                <tr>
                                    <th className="font-bold p-4 border-b border-r border-slate-200 min-w-[250px] sticky left-0 bg-slate-50 z-30">
                                        Nama Siswa
                                    </th>
                                    {TKA_FIELDS.map((field) => (
                                        <th key={field} className="font-bold border-b border-r border-slate-200 text-center min-w-[150px] px-2 py-3">
                                            {subjectLabels[field]}
                                        </th>
                                    ))}
                                    <th className="font-bold p-4 border-b border-slate-200 text-center min-w-[100px] bg-slate-100 z-30 sticky right-0">
                                        Rata-rata
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.map((student, rowIndex) => {
                                    const tka = student.tka;
                                    const isRowActive = activeCell?.row === rowIndex;
                                    
                                    return (
                                        <tr key={student.id} className={`hover:bg-slate-50/50 transition-colors ${isRowActive ? 'bg-indigo-50/30' : ''}`}>
                                            <td className={`p-3 border-r border-slate-200 sticky left-0 z-10 font-medium text-slate-700 transition-colors ${isRowActive ? 'bg-indigo-50/50' : 'bg-white'}`}>
                                                <div className="flex flex-col">
                                                    <span>{student.name}</span>
                                                    <span className="text-xs text-slate-400 font-normal">{student.nisn || '-'}</span>
                                                </div>
                                            </td>
                                            
                                            {TKA_FIELDS.map((field, colIndex) => {
                                                const score = tka?.[field] ?? null;
                                                const cellKey = `${student.id}-${field}`;
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
                                                                        handleScoreChange(student.id, field, num);
                                                                    }
                                                                }
                                                            }}
                                                            onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                                                            onFocus={() => setActiveCell({row: rowIndex, col: colIndex})}
                                                            className={`w-full h-full p-3 text-center bg-transparent focus:bg-indigo-50 focus:ring-2 focus:ring-inset focus:ring-indigo-500 outline-none transition-all font-mono cursor-cell
                                                                ${score === null ? 'placeholder-slate-200' : 'font-medium text-slate-900'}
                                                                ${score !== null && (score < 75) ? 'text-red-900 bg-red-50' : ''}
                                                                ${isActive ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-50' : ''}
                                                            `}
                                                            placeholder="-"
                                                        />
                                                    </td>
                                                );
                                            })}
                                            
                                            <td className={`p-3 text-center font-bold sticky right-0 z-10 border-l border-slate-200 transition-colors ${isRowActive ? 'bg-indigo-50/50' : 'bg-slate-50'}`}>
                                                {tka?.average !== null && tka?.average !== undefined ? (
                                                    <span className={`text-lg ${getScoreColor(tka.average)}`}>
                                                        {tka.average.toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                
                                {students.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-500">
                                            Tidak ada data siswa ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}