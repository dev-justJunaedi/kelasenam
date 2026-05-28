import { useState, useEffect, useCallback } from 'react';
import { Save, RefreshCw, Calculator, Trophy, BookOpen, AlertCircle, Info, Users, Wand2 } from 'lucide-react';
import { fetchSPMBData, saveSPMBScore, SPMB_SEMESTERS, getRankingWeight } from '../lib/spmb';
import type { StudentWithSPMB, SPMBScore } from '../lib/spmb';

export default function PreviewSPMB() {
    const [students, setStudents] = useState<StudentWithSPMB[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    // Calculate ranking automatically based on raporAverage (NR)
    const calculateAutoRanking = useCallback((studentList: StudentWithSPMB[]): StudentWithSPMB[] => {
        // Sort by raporAverage descending (null values go to bottom)
        const sorted = [...studentList].sort((a, b) => {
            if (a.raporAverage === null && b.raporAverage === null) return 0;
            if (a.raporAverage === null) return 1;
            if (b.raporAverage === null) return -1;
            return b.raporAverage - a.raporAverage;
        });

        // Assign ranking and calculate weight
        return sorted.map((student, index) => {
            const rank = student.raporAverage !== null ? index + 1 : null;
            const rankingWeight = rank !== null ? getRankingWeight(rank) : null;
            const na = (student.raporAverage !== null && rankingWeight !== null && student.nhtka !== null)
                ? (student.raporAverage + rankingWeight + student.nhtka) / 3
                : null;

            return {
                ...student,
                spmb: {
                    ...student.spmb,
                    student_id: student.id,
                    ranking_position: rank,
                    ranking_weight: rankingWeight,
                    tka_bahasa_indonesia: student.spmb?.tka_bahasa_indonesia ?? null,
                    tka_matematika: student.spmb?.tka_matematika ?? null,
                    tka_average: student.spmb?.tka_average ?? null,
                    rapor_average: student.raporAverage,
                    final_score: na
                } as SPMBScore,
                nbp: rankingWeight,
                na
            };
        });
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchSPMBData();
            // Calculate auto ranking on load
            const rankedData = calculateAutoRanking(data);
            setStudents(rankedData);
            setHasChanges(false);
        } catch (err: any) {
            console.error('Error fetching SPMB data:', err);
            setError('Gagal memuat data SPMB. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetRanking = () => {
        const rankedData = calculateAutoRanking(students);
        setStudents(rankedData);
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!hasChanges) return;

        setSaving(true);
        setError(null);
        try {
            // Hanya simpan data ranking (peringkat dan bobot)
            const scoresToSave = students
                .filter(s => s.spmb?.ranking_position !== null)
                .map(s => ({
                    student_id: s.id,
                    ranking_position: s.spmb!.ranking_position,
                    ranking_weight: s.spmb!.ranking_weight,
                    rapor_average: s.raporAverage,
                    final_score: s.na
                }));

            for (const score of scoresToSave) {
                await saveSPMBScore(score as SPMBScore);
            }
            setHasChanges(false);
        } catch (err: any) {
            console.error('Error saving SPMB data:', err);
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
                    <h1 className="text-2xl font-bold text-slate-800">Preview SPMB</h1>
                    <p className="text-slate-500">Preview perhitungan Nilai Akhir jalur prestasi akademik</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowInfo(!showInfo)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-medium shadow-sm hover:bg-slate-50 transition-all"
                    >
                        <Info size={18} />
                        {showInfo ? 'Tutup Info' : 'Lihat Rumus'}
                    </button>

                    <button
                        onClick={handleResetRanking}
                        className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-300 text-amber-700 rounded-xl font-medium shadow-sm hover:bg-amber-100 transition-all"
                        title="Hitung ulang peringkat berdasarkan NR (rata-rata rapor)"
                    >
                        <Wand2 size={18} />
                        Hitung Ranking
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
                        <span>{saving ? 'Menyimpan...' : 'Simpan Data'}</span>
                    </button>
                </div>
            </div>

            {/* Info Panel */}
            {showInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-2 text-blue-800 font-semibold">
                        <Calculator size={20} />
                        <span>Rumus Perhitungan SPMB - Jalur Prestasi Akademik</span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                            <p className="font-medium text-blue-900">Komponen Penilaian:</p>
                            <ul className="space-y-1 text-blue-800 list-disc list-inside">
                                <li><strong>NR</strong> = Nilai Rata-rata Rapor (7 mapel × 5 semester)</li>
                                <li><strong>NBP</strong> = Nilai Bobot Peringkat</li>
                                <li><strong>NHTKA</strong> = Nilai Hasil TKA (B.Indo + MTK) / 2</li>
                                <li><strong>NA</strong> = (NR + NBP + NHTKA) / 3</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <p className="font-medium text-blue-900">Mata Pelajaran (7 Mapel):</p>
                            <ul className="space-y-1 text-blue-800 list-disc list-inside">
                                <li>Pendidikan Agama dan Budi Pekerti</li>
                                <li>Pendidikan Pancasila (PKN)</li>
                                <li>Bahasa Indonesia</li>
                                <li>Matematika</li>
                                <li>IPAS (IPA + IPS)</li>
                                <li>Seni dan Budaya</li>
                                <li>Pendidikan Jasmani dan Kesehatan</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="bg-white/50 rounded-lg p-3 text-xs text-blue-700">
                        <strong>Semester yang dihitung:</strong> Kelas 4 Semester 1, Kelas 4 Semester 2, Kelas 5 Semester 1, Kelas 5 Semester 2, Kelas 6 Semester 1 (total 5 semester)
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center gap-2">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                </div>
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Users size={16} />
                        <span className="text-xs font-medium">Total Siswa</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{students.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <BookOpen size={16} />
                        <span className="text-xs font-medium">Data Rapor Lengkap</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">
                        {students.filter(s => s.raporAverage !== null).length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Trophy size={16} />
                        <span className="text-xs font-medium">Peringkat Otomatis</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">
                        {students.filter(s => s.spmb?.ranking_position !== null).length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Calculator size={16} />
                        <span className="text-xs font-medium">TKA Diisi</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">
                        {students.filter(s => s.spmb?.tka_average !== null).length}
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
                                    <th rowSpan={2} className="font-bold p-4 border-b border-r border-slate-200 min-w-[200px] sticky left-0 bg-slate-50 z-30">
                                        Nama Siswa
                                    </th>
                                    <th colSpan={5} className="font-bold p-3 border-b border-r border-slate-200 text-center bg-indigo-50 text-indigo-800">
                                        Nilai Rapor (NR)
                                    </th>
                                    <th colSpan={2} className="font-bold p-3 border-b border-r border-slate-200 text-center bg-amber-50 text-amber-800">
                                        Peringkat (NBP)
                                    </th>
                                    <th colSpan={2} className="font-bold p-3 border-b border-r border-slate-200 text-center bg-emerald-50 text-emerald-800">
                                        TKA (NHTKA)
                                    </th>
                                    <th rowSpan={2} className="font-bold p-4 border-b border-slate-200 text-center min-w-[100px] bg-slate-100 z-30 sticky right-0">
                                        NA
                                    </th>
                                </tr>
                                <tr>
                                    {/* NR Sub-columns */}
                                    {SPMB_SEMESTERS.map(({ class_level, semester }) => (
                                        <th key={`${class_level}-${semester}`} className="font-semibold p-2 border-b border-r border-slate-200 text-center text-xs min-w-[70px]">
                                            K{class_level}S{semester}
                                        </th>
                                    ))}
                                    <th className="font-semibold p-2 border-b border-r border-slate-200 text-center text-xs bg-indigo-100 text-indigo-700 min-w-[70px]">
                                        NR
                                    </th>
                                    
                                    {/* NBP Sub-columns */}
                                    <th className="font-semibold p-2 border-b border-r border-slate-200 text-center text-xs min-w-[80px]">
                                        Peringkat
                                    </th>
                                    <th className="font-semibold p-2 border-b border-r border-slate-200 text-center text-xs bg-amber-100 text-amber-700 min-w-[70px]">
                                        Bobot
                                    </th>
                                    
                                    {/* TKA Sub-columns */}
                                    <th className="font-semibold p-2 border-b border-r border-slate-200 text-center text-xs min-w-[80px]">
                                        B.Indo
                                    </th>
                                    <th className="font-semibold p-2 border-b border-r border-slate-200 text-center text-xs min-w-[80px]">
                                        MTK
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.map((student) => {
                                    const spmb = student.spmb;
                                    
                                    return (
                                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-3 border-r border-slate-200 sticky left-0 bg-white z-10 font-medium text-slate-700">
                                                <div className="flex flex-col">
                                                    <span>{student.name}</span>
                                                    <span className="text-xs text-slate-400 font-normal">{student.nisn || '-'}</span>
                                                </div>
                                            </td>
                                            
                                            {/* Rapor Scores per Semester */}
                                            {SPMB_SEMESTERS.map(({ class_level, semester }) => {
                                                const semKey = `${class_level}-${semester}`;
                                                const scores = student.raporScores[semKey];
                                                const validScores = Object.values(scores).filter(s => s !== null) as number[];
                                                const avg = validScores.length > 0
                                                    ? validScores.reduce((a, b) => a + b, 0) / validScores.length
                                                    : null;
                                                
                                                return (
                                                    <td key={semKey} className="p-2 border-r border-slate-200 text-center">
                                                        {avg !== null ? (
                                                            <span className={`font-mono font-medium ${getScoreColor(avg)}`}>
                                                                {avg.toFixed(1)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            
                                            {/* NR */}
                                            <td className="p-2 border-r border-slate-200 text-center font-bold bg-indigo-50/50">
                                                {student.raporAverage !== null ? (
                                                    <span className={getScoreColor(student.raporAverage)}>
                                                        {student.raporAverage.toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                            
                                            {/* Peringkat (Otomatis berdasarkan NR) */}
                                            <td className="p-2 border-r border-slate-200 text-center font-bold bg-amber-50/30">
                                                <div className="flex items-center justify-center gap-1">
                                                    {student.nbp !== null ? (
                                                        <>
                                                            <span className="text-amber-800 text-lg">{spmb?.ranking_position}</span>
                                                            <span className="text-[10px] bg-amber-200 text-amber-700 px-1 py-0.5 rounded-full font-medium">Auto</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            
                                            {/* Bobot Peringkat */}
                                            <td className="p-2 border-r border-slate-200 text-center font-bold bg-amber-50/50">
                                                {student.nbp !== null ? (
                                                    <span className="text-amber-700">{student.nbp}</span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                            
                                            {/* TKA B.Indo (Read-only dari halaman Nilai TKA) */}
                                            <td className="p-2 border-r border-slate-200 text-center font-medium bg-emerald-50/20">
                                                {spmb?.tka_bahasa_indonesia !== null ? (
                                                    <span className="font-mono text-emerald-800">{spmb?.tka_bahasa_indonesia}</span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                            
                                            {/* TKA MTK (Read-only dari halaman Nilai TKA) */}
                                            <td className="p-2 border-r border-slate-200 text-center font-medium bg-emerald-50/20">
                                                {spmb?.tka_matematika !== null ? (
                                                    <span className="font-mono text-emerald-800">{spmb?.tka_matematika}</span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                            
                                            {/* NA */}
                                            <td className="p-3 text-center font-bold bg-slate-50 sticky right-0 z-10 border-l border-slate-200">
                                                {student.na !== null ? (
                                                    <span className={`text-lg ${getScoreColor(student.na)}`}>
                                                        {student.na.toFixed(2)}
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
                                        <td colSpan={13} className="p-8 text-center text-slate-500">
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