
import { LayoutDashboard, Users, FileSpreadsheet, GraduationCap, Menu, X, School } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const navItems = [
        { to: "/", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/students", icon: Users, label: "Data Peserta" },
        { to: "/grades", icon: FileSpreadsheet, label: "Rekap Nilai Rapor" },
        { to: "/diploma", icon: GraduationCap, label: "Nilai Ijazah" },
    ];

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shadow-sm z-10 transition-all duration-300">
                <div className="p-6 flex items-center gap-3 border-b border-slate-100">
                    <div className="bg-blue-600 p-2 rounded-lg text-white">
                        <School size={24} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-tight text-slate-800">SDN Pondok Ranji 01</h1>
                        <p className="text-xs text-slate-500 font-medium">Sistem Data Kelas 6</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? "bg-blue-50 text-blue-700 font-semibold shadow-sm"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`
                            }
                        >
                            <item.icon size={20} className="group-hover:scale-110 transition-transform duration-200" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Tahun Pelajaran</p>
                        <p className="font-semibold text-sm text-slate-700">2025 / 2026</p>
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-64 bg-white z-30 transform transition-transform duration-300 md:hidden shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="p-6 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                            <School size={20} />
                        </div>
                        <span className="font-bold text-slate-800">Menu Utama</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="text-slate-500 hover:bg-slate-100 p-1 rounded-full">
                        <X size={20} />
                    </button>
                </div>
                <nav className="p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setIsSidebarOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                                    ? "bg-blue-50 text-blue-700 font-semibold"
                                    : "text-slate-600 hover:bg-slate-50"
                                }`
                            }
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header - Mobile Only */}
                <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 justify-between z-10 sticky top-0">
                    <button onClick={toggleSidebar} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-slate-800">Dashboard</span>
                    <div className="w-8" />
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-auto p-4 md:p-8 relative">
                    {/* Background Decor */}
                    <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-50/50 to-transparent -z-10" />

                    <div className="max-w-7xl mx-auto space-y-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
