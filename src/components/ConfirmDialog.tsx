import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    onConfirm,
    onCancel,
    variant = 'danger'
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            bg: 'bg-rose-50',
            text: 'text-rose-600',
            button: 'bg-rose-600 hover:bg-rose-700'
        },
        warning: {
            bg: 'bg-amber-50',
            text: 'text-amber-600',
            button: 'bg-amber-600 hover:bg-amber-700'
        },
        info: {
            bg: 'bg-blue-50',
            text: 'text-blue-600',
            button: 'bg-blue-600 hover:bg-blue-700'
        }
    };

    const styles = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${styles.bg}`}>
                            <AlertTriangle className={styles.text} size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                            <p className="text-slate-600">{message}</p>
                        </div>
                        <button
                            onClick={onCancel}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="bg-slate-50 px-6 py-4 flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-white transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 ${styles.button} text-white rounded-lg font-medium transition-colors shadow-sm`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
