import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Student } from '../types/student';

interface StudentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (student: Partial<Student>) => void;
    student?: Student | null;
    mode: 'add' | 'edit';
}

export default function StudentFormModal({ isOpen, onClose, onSubmit, student, mode }: StudentFormModalProps) {
    const [formData, setFormData] = useState<Partial<Student>>({
        exam_number: '',
        nisn: '',
        nis: '',
        kode_par: '01',
        kode_abs: '',
        name: '',
        gender: 'L',
        birth_place: '',
        birth_date: '',
        father_name: '',
        mother_name: '',
        nik: '',
        nkk: ''
    });

    useEffect(() => {
        if (student && mode === 'edit') {
            setFormData(student);
        } else {
            setFormData({
                exam_number: '',
                nisn: '',
                nis: '',
                kode_par: '01',
                kode_abs: '',
                name: '',
                gender: 'L',
                birth_place: '',
                birth_date: '',
                father_name: '',
                mother_name: '',
                nik: '',
                nkk: ''
            });
        }
    }, [student, mode, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">
                        {mode === 'add' ? 'Tambah Siswa Baru' : 'Edit Data Siswa'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="p-6 space-y-6">
                        {/* Identitas Peserta */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                                Identitas Peserta
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Nomor Peserta
                                    </label>
                                    <input
                                        type="text"
                                        name="exam_number"
                                        value={formData.exam_number}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        placeholder="04-0291-0001-8"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        NISN <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="nisn"
                                        value={formData.nisn}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        placeholder="0085182706"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        NIS <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="nis"
                                        value={formData.nis}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        placeholder="1415.1.002"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Kode Par</label>
                                        <input
                                            type="text"
                                            name="kode_par"
                                            value={formData.kode_par}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            placeholder="01"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Kode Abs</label>
                                        <input
                                            type="text"
                                            name="kode_abs"
                                            value={formData.kode_abs}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            placeholder="01"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Data Pribadi */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                                Data Pribadi
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Nama Lengkap <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        placeholder="Nama Lengkap Siswa"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Jenis Kelamin <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        required
                                    >
                                        <option value="L">Laki-laki</option>
                                        <option value="P">Perempuan</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Tempat Lahir <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="birth_place"
                                        value={formData.birth_place}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        placeholder="Jakarta"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Tanggal Lahir <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="birth_date"
                                        value={formData.birth_date || ''}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Data Orang Tua */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                                Data Orang Tua
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Nama Ayah <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="father_name"
                                        value={formData.father_name}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        placeholder="Nama Ayah Lengkap"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Nama Ibu <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="mother_name"
                                        value={formData.mother_name}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        placeholder="Nama Ibu Lengkap"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Data Dokumen */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                                Data Dokumen
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        NIK <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="nik"
                                        value={formData.nik}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        placeholder="3674051103080003"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        NKK <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="nkk"
                                        value={formData.nkk}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        placeholder="3674051009120042"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 px-6 py-4 flex gap-3 justify-end border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-white transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm shadow-blue-200"
                        >
                            {mode === 'add' ? 'Tambah Siswa' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
