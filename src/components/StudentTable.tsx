
import { Edit, Trash2 } from 'lucide-react';
import type { Student } from '../types/student';

interface StudentTableProps {
    students: Student[];
    onEdit?: (student: Student) => void;
    onDelete?: (student: Student) => void;
}

export default function StudentTable({ students, onEdit, onDelete }: StudentTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th scope="col" className="px-4 py-3 w-12 text-center">No</th>
                        <th scope="col" className="px-4 py-3">Nomor Peserta</th>
                        <th scope="col" className="px-4 py-3">NISN</th>
                        <th scope="col" className="px-4 py-3">NIS</th>
                        <th scope="col" className="px-2 py-3 text-center">Kode Par</th>
                        <th scope="col" className="px-2 py-3 text-center">Kode Abs</th>
                        <th scope="col" className="px-4 py-3">Nama Peserta</th>
                        <th scope="col" className="px-2 py-3 text-center">L/P</th>
                        <th scope="col" className="px-4 py-3">Tempat Lahir</th>
                        <th scope="col" className="px-4 py-3">Tanggal Lahir</th>
                        <th scope="col" className="px-4 py-3">Nama Ayah</th>
                        <th scope="col" className="px-4 py-3">Nama Ibu</th>
                        <th scope="col" className="px-4 py-3">NIK</th>
                        <th scope="col" className="px-4 py-3">NKK</th>
                        <th scope="col" className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {students.length === 0 ? (
                        <tr>
                            <td colSpan={15} className="px-4 py-8 text-center text-slate-400">
                                Tidak ada data siswa
                            </td>
                        </tr>
                    ) : (
                        students.map((student, index) => (
                            <tr key={student.id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 text-center font-medium text-slate-900">{index + 1}</td>
                                <td className="px-4 py-3 font-mono text-xs">{student.exam_number}</td>
                                <td className="px-4 py-3 font-mono text-xs">{student.nisn}</td>
                                <td className="px-4 py-3 font-mono text-xs">{student.nis}</td>
                                <td className="px-2 py-3 text-center">{student.kode_par || '01'}</td>
                                <td className="px-2 py-3 text-center">{student.kode_abs || (index + 1).toString().padStart(2, '0')}</td>
                                <td className="px-4 py-3 font-medium text-slate-900">{student.name}</td>
                                <td className="px-2 py-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${student.gender === 'L' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                                        }`}>
                                        {student.gender}
                                    </span>
                                </td>
                                <td className="px-4 py-3">{student.birth_place}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{student.birth_date}</td>
                                <td className="px-4 py-3">{student.father_name}</td>
                                <td className="px-4 py-3">{student.mother_name}</td>
                                <td className="px-4 py-3 font-mono text-xs">{student.nik}</td>
                                <td className="px-4 py-3 font-mono text-xs">{student.nkk}</td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => onEdit?.(student)} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => onDelete?.(student)} className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors" title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
