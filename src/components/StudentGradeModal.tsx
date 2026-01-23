import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { SUBJECTS } from '../lib/grades';
import type { StudentWithGrades } from '../lib/grades';

interface StudentGradeModalProps {
    student: StudentWithGrades | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (studentId: string, updates: Record<string, number | null>) => void;
}

export default function StudentGradeModal({ student, isOpen, onClose, onSave }: StudentGradeModalProps) {
    // Local state to hold edits before saving
    const [localGrades, setLocalGrades] = useState<Record<string, string>>({});

    // Reset state when student changes or modal opens
    useEffect(() => {
        if (student) {
            const initialGrades: Record<string, string> = {};
            SUBJECTS.forEach(subject => {
                const score = student.grades[subject]?.knowledge_score;
                initialGrades[subject] = score !== null && score !== undefined ? String(score) : '';
            });
            setLocalGrades(initialGrades);
        }
    }, [student, isOpen]);

    if (!isOpen || !student) return null;

    const handleChange = (subject: string, value: string) => {
        setLocalGrades(prev => ({ ...prev, [subject]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const updates: Record<string, number | null> = {};

        SUBJECTS.forEach(subject => {
            const val = localGrades[subject];
            if (val === '') {
                updates[subject] = null;
            } else {
                const num = Number(val);
                if (!isNaN(num) && num >= 0 && num <= 100) {
                    updates[subject] = num;
                }
            }
        });

        onSave(student.id, updates);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{student.name}</h2>
                        <p className="text-sm text-gray-500">NISN: {student.nisn || '-'}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                    {SUBJECTS.map((subject) => (
                        <div key={subject} className="flex items-center gap-4">
                            <label className="flex-1 text-sm font-medium text-gray-700">
                                {subject}
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="-"
                                value={localGrades[subject] || ''}
                                onChange={(e) => handleChange(subject, e.target.value)}
                                className="w-24 p-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>
                    ))}
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all hover:shadow hover:scale-[1.02]"
                    >
                        <Save size={18} />
                        Simpan Nilai
                    </button>
                </div>
            </div>
        </div>
    );
}
