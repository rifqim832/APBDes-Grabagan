import React from 'react';
import { Eye, Download, Printer, Trash2 } from 'lucide-react';

const ActionButtons = ({ onPreview, onDownload, onPrint, onDelete }) => (
    <div className="flex justify-end gap-1.5">
        <button onClick={onPreview} title="Preview" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all active:scale-90 border border-transparent hover:border-blue-100">
            <Eye size={17} />
        </button>
        <button onClick={onDownload} title="Download" className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all active:scale-90 border border-transparent hover:border-emerald-100">
            <Download size={17} />
        </button>
        <button onClick={onPrint} title="Cetak" className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all active:scale-90 border border-transparent hover:border-rose-100">
            <Printer size={17} />
        </button>
        {onDelete && (
            <button onClick={onDelete} title="Hapus" className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-90 border border-transparent hover:border-red-100">
                <Trash2 size={17} />
            </button>
        )}
    </div>
);

export default ActionButtons;
