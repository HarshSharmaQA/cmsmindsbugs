'use client';

import { useState } from 'react';
import { Download, FileText, Archive, ChevronDown } from 'lucide-react';

interface ExportDropdownProps {
    onExportCSV: () => void;
    onExportWithImages: () => void;
    disabled?: boolean;
}

export function ExportDropdown({ onExportCSV, onExportWithImages, disabled = false }: ExportDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="btn-ghost h-10 flex items-center gap-2 px-4 shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
                        <div className="py-1">
                            {/* CSV Export */}
                            <button
                                onClick={() => {
                                    onExportCSV();
                                    setIsOpen(false);
                                }}
                                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left"
                            >
                                <FileText className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">CSV Only</div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        Fast export, data only (no images)
                                    </div>
                                </div>
                            </button>

                            {/* Divider */}
                            <div className="border-t border-gray-100" />

                            {/* ZIP Export with Images */}
                            <button
                                onClick={() => {
                                    onExportWithImages();
                                    setIsOpen(false);
                                }}
                                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left"
                            >
                                <Archive className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">ZIP with Images</div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        Complete export with all screenshots
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* Info Footer */}
                        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                            <p className="text-xs text-gray-600">
                                💡 ZIP export may take longer for projects with many screenshots
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
