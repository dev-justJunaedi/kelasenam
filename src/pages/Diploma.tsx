import { useState, useEffect, useCallback } from 'react';
import { Save, RefreshCw, BookOpen, Calculator } from 'lucide-react';
import { fetchTKAData, saveBulkTKAScores, TKA_SUBJECTS } from '../lib/tka';
import type { StudentWithTKA, TKAScore } from '../lib/tka';

export default function TKA() {
    const [students, setStudents] = useState<StudentWithTKA[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

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

    const handleScoreChange = (studentId: string, field: 'bahasa_indonesia' | 'matematika', value: string) => {
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

    return (
        <div className="space-y-6">
            {/* Header */}
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

            {/* Statistics Cards */}
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

            {/* Main Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden flex flex-col">
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
                                    {TKA_SUBJECTS.map((subject) => (
                                        <th key={subject.key} className="font-bold border-b border-r border-slate-200 text-center min-w-[150px] px-2 py-3">
                                            {subject.label}
                                        </th>
                                    ))}
                                    <th className="font-bold p-4 border-b border-slate-200 text-center min-w-[100px] bg-slate-100 z-30 sticky right-0">
                                        Rata-rata
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.map((student) => {
                                    const tka = student.tka;
                                    
                                    return (
                                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-3 border-r border-slate-200 sticky left-0 bg-white z-10 font-medium text-slate-700">
                                                <div className="flex flex-col">
                                                    <span>{student.name}</span>
                                                    <span className="text-xs text-slate-400 font-normal">{student.nisn || '-'}</span>
                                                </div>
                                            </td>
                                            
                                            <td className="p-1 border-r border-slate-200">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={tka?.bahasa_indonesia ?? ''}
                                                    onChange={(e) => handleScoreChange(student.id, 'bahasa_indonesia', e.target.value)}
                                                    className="w-full p-3 text-center bg-transparent focus:bg-indigo-50 focus:ring-2 focus:ring-inset focus:ring-indigo-500 outline-none transition-all font-mono font-medium"
                                                    placeholder="-"
                                                />
                                            </td>
                                            
                                            <td className="p-1 border-r border-slate-200">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={tka?.matematika ?? ''}
                                                    onChange={(e) => handleScoreChange(student.id, 'matematika', e.target.value)}
                                                    className="w-full p-3 text-center bg-transparent focus:bg-indigo-50 focus:ring-2 focus:ring-inset focus:ring-indigo-500 outline-none transition-all font-mono font-medium"
                                                    placeholder="-"
                                                />
                                            </td>
                                            
                                            <td className="p-3 text-center font-bold bg-slate-50 sticky right-0 z-10 border-l border-slate-200">
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