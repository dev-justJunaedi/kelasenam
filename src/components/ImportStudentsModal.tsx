import React, { useState } from 'react';
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { downloadTemplate } from '../utils/templateDownloader';

interface ImportStudentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (file: File) => void;
    isImporting: boolean;
}

export default function ImportStudentsModal({ isOpen, onClose, onImport, isImporting }: ImportStudentsModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
                setError('Hanya file Excel (.xlsx, .xls) yang diperbolehkan.');
                setFile(null);
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleImport = () => {
        if (!file) return;
        onImport(file);
        // Note: We don't close here immediately, we let the parent handle loading state
        // But for UX consistency with Grades, we might want to close or show loading.
        // The parent `Students.tsx` handles "isImporting".
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Import Data Siswa</h2>
                    <button onClick={onClose} disabled={isImporting} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Template Section */}
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-indigo-900">1. Download Template</h3>
                            <p className="text-sm text-indigo-600">Gunakan template ini untuk data siswa.</p>
                        </div>
                        <button
                            onClick={downloadTemplate}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-lg border border-indigo-200 font-medium hover:bg-indigo-50 shadow-sm"
                        >
                            <Download size={18} />
                            Template
                        </button>
                    </div>

                    {/* Upload Section */}
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-indigo-400 transition-colors bg-gray-50/50">
                        <Upload className="w-12 h-12 text-gray-400 mb-3" />
                        <label className="cursor-pointer">
                            <span className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-shadow shadow-sm">
                                Pilih File Excel
                            </span>
                            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} disabled={isImporting} />
                        </label>
                        <p className="text-sm text-gray-500 mt-2">atau drag & drop file ke sini</p>
                        {file && (
                            <div className="mt-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                <FileSpreadsheet size={16} />
                                <span className="font-medium">{file.name}</span>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    {file && !error && (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg text-sm">
                            <CheckCircle size={18} />
                            File siap diimport.
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isImporting}
                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={!file || isImporting}
                        className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-2"
                    >
                        {isImporting ? 'Mengimport...' : 'Import Data'}
                    </button>
                </div>
            </div>
        </div>
    );
}
