
import { Users, GraduationCap, Trophy, ArrowUpRight } from 'lucide-react';

export default function Home() {
    const stats = [
        { label: "Total Siswa", value: "0", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Siswa Lulus", value: "0%", icon: GraduationCap, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Rata-rata Nilai", value: "0.0", icon: Trophy, color: "text-amber-600", bg: "bg-amber-50" },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Selamat Datang, Admin</h1>
                <p className="text-slate-500 mt-1">Ringkasan data siswa kelas 6 tahun ajaran ini.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                            <h3 className="text-3xl font-bold text-slate-800 mt-1">{stat.value}</h3>
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
