
import { useState, useEffect } from 'react';
import { Users, GraduationCap, Trophy, ArrowUpRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
    const { user, role } = useAuth();
    const [stats, setStats] = useState([
        { label: "Total Siswa", value: "0", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Siswa Lulus", value: "-", icon: GraduationCap, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Rata-rata Nilai", value: "0.0", icon: Trophy, color: "text-amber-600", bg: "bg-amber-50" },
    ]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);

            // 1. Fetch Total Students
            const { count: studentCount, error: studentError } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true });

            if (studentError) throw studentError;

            // 2. Fetch Grades for Average
            // We want the average of all knowledge_scores in the system
            const { data: gradesData, error: gradesError } = await supabase
                .from('grades')
                .select('knowledge_score');

            if (gradesError) throw gradesError;

            let averageScore = 0;
            if (gradesData && gradesData.length > 0) {
                const validScores = gradesData // Filter nulls first
                    .map(g => g.knowledge_score)
                    .filter(s => s !== null) as number[];

                if (validScores.length > 0) {
                    const total = validScores.reduce((acc, curr) => acc + curr, 0);
                    averageScore = total / validScores.length;
                }
            }

            // Update stats
            setStats([
                {
                    label: "Total Siswa",
                    value: studentCount?.toString() || "0",
                    icon: Users,
                    color: "text-blue-600",
                    bg: "bg-blue-50"
                },
                {
                    label: "Siswa Lulus",
                    value: "0", // Defaulting to 0 for now as we don't have graduation logic
                    icon: GraduationCap,
                    color: "text-emerald-600",
                    bg: "bg-emerald-50"
                },
                {
                    label: "Rata-rata Nilai",
                    value: averageScore.toFixed(2),
                    icon: Trophy,
                    color: "text-amber-600",
                    bg: "bg-amber-50"
                },
            ]);

        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Selamat Pagi";
        if (hour < 15) return "Selamat Siang";
        if (hour < 18) return "Selamat Sore";
        return "Selamat Malam";
    };

    const displayName = user?.email?.split('@')[0] || role || 'Admin'; // Fallback to email prefix or role

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                    {getGreeting()}, <span className="capitalize">{displayName}</span>
                </h1>
                <p className="text-slate-500 mt-1">Ringkasan data siswa kelas 6 tahun ajaran ini.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                            {loading ? (
                                <div className="h-9 w-24 bg-slate-100 animate-pulse rounded mt-1"></div>
                            ) : (
                                <h3 className="text-3xl font-bold text-slate-800 mt-1">{stat.value}</h3>
                            )}
                        </div>
                        <div className={`p-4 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                            <stat.icon size={28} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[300px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800">Aktivitas Terbaru</h3>
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                            Lihat Semua <ArrowUpRight size={16} />
                        </button>
                    </div>
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                        <p>Belum ada aktivitas</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[300px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800">Statistik Nilai</h3>
                    </div>
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                        <p>Grafik akan muncul disini</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
