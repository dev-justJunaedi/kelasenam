import React, { useState } from 'react';
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SUBJECTS } from '../lib/grades';

interface ImportGradesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: any[]) => void;
    currentClassLevel: number;
    currentSemester: number;
}

export default function ImportGradesModal({ isOpen, onClose, onImport, currentClassLevel, currentSemester }: ImportGradesModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<any[]>([]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseFile(selectedFile);
        }
    };

    const parseFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);
                setPreview(jsonData);
                setError(null);
            } catch (err) {
                setError('Gagal membaca file Excel. Pastikan format benar.');
                setPreview([]);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleDownloadTemplate = () => {
        // Create template data
        const headers = ['No', 'Nama', 'NISN', ...SUBJECTS];
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template Nilai");
        XLSX.writeFile(wb, `Template_Nilai_Kelas${currentClassLevel}_Sem${currentSemester}.xlsx`);
    };

    const handleImport = () => {
        if (!preview.length) return;

        onImport(preview);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Import Nilai dari Excel</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Template Section */}
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-indigo-900">1. Download Template</h3>
                            <p className="text-sm text-indigo-600">Gunakan template ini untuk mengisi nilai.</p>
                        </div>
                        <button
                            onClick={handleDownloadTemplate}
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
                            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} />
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

                    {preview.length > 0 && !error && (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg text-sm">
                            <CheckCircle size={18} />
                            {preview.length} baris data ditemukan siap diimport.
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">
                        Batal
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={!preview.length}
                        className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                    >
                        Import Data
                    </button>
                </div>
            </div>
        </div>
    );
}
