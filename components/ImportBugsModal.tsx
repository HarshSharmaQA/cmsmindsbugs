"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X, Upload, FileText, Download, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface ImportBugsModalProps {
    projectId: Id<"projects">;
    devToken: string | null;
    onClose: () => void;
    onSuccess?: () => void;
}

export function ImportBugsModal({ projectId, devToken, onClose, onSuccess }: ImportBugsModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<{ imported: number; failed: number; errors: string[] } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const importBugs = useMutation(api.import.importBugs);
    const template = useQuery(api.import.getImportTemplate, { projectId, devToken: devToken || undefined });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setResult(null);
        }
    };

    type BugImport = {
        title: string;
        description?: string;
        status?: string;
        priority?: "low" | "medium" | "high" | "critical";
        type?: string;
        category?: string;
        assigneeEmail?: string;
        tags?: string[];
        reporterName?: string;
        reporterEmail?: string;
        browser?: string;
        os?: string;
        url?: string;
        dueDate?: string;
    };

    const parseCSV = (text: string): BugImport[] => {
        const lines = text.trim().split('\n');
        if (lines.length < 2) throw new Error("CSV must have at least a header row and one data row");

        // Parse header - handle quoted headers
        const headerLine = lines[0];
        const headers: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < headerLine.length; i++) {
            const char = headerLine[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                headers.push(current.trim().replace(/^"|"$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        headers.push(current.trim().replace(/^"|"$/g, ''));

        console.log('CSV Headers:', headers);

        // Map CSV headers to our expected field names (case-insensitive)
        const headerMap: Record<string, string> = {};
        headers.forEach((header, index) => {
            const normalized = header.toLowerCase().trim();
            if (normalized.includes('title')) headerMap[index.toString()] = 'title';
            else if (normalized.includes('description')) headerMap[index.toString()] = 'description';
            else if (normalized.includes('status')) headerMap[index.toString()] = 'status';
            else if (normalized.includes('priority')) headerMap[index.toString()] = 'priority';
            else if (normalized.includes('type')) headerMap[index.toString()] = 'type';
            else if (normalized.includes('category')) headerMap[index.toString()] = 'category';
            else if (normalized.includes('tag')) headerMap[index.toString()] = 'tags';
            else if (normalized.includes('assignee')) headerMap[index.toString()] = 'assigneeEmail';
            else if (normalized.includes('reporter') && normalized.includes('name')) headerMap[index.toString()] = 'reporterName';
            else if (normalized.includes('reporter') && normalized.includes('email')) headerMap[index.toString()] = 'reporterEmail';
            else if (normalized.includes('browser')) headerMap[index.toString()] = 'browser';
            else if (normalized.includes('os')) headerMap[index.toString()] = 'os';
            else if (normalized.includes('url')) headerMap[index.toString()] = 'url';
            else if (normalized.includes('due') || normalized.includes('date')) headerMap[index.toString()] = 'dueDate';
        });

        console.log('Header mapping:', headerMap);

        const bugs: BugImport[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;

            // Parse CSV row with proper quote handling
            const values: string[] = [];
            current = '';
            inQuotes = false;

            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim());

            const bug: Record<string, string | string[]> = {};
            let hasTitle = false;

            values.forEach((value, index) => {
                const field = headerMap[index.toString()];
                if (!field) return;

                const cleanValue = value.replace(/^"|"$/g, '').trim();

                if (!cleanValue || cleanValue === '' || cleanValue === 'Unknown') return;

                if (field === 'title') {
                    bug.title = cleanValue;
                    hasTitle = true;
                } else if (field === 'tags') {
                    bug.tags = cleanValue.split(',').map(t => t.trim()).filter(Boolean);
                } else if (field === 'priority') {
                    const p = cleanValue.toLowerCase();
                    if (['low', 'medium', 'high', 'critical'].includes(p)) {
                        bug.priority = p;
                    }
                } else if (field === 'description') {
                    bug.description = cleanValue;
                } else if (field === 'status') {
                    bug.status = cleanValue;
                } else if (field === 'type') {
                    bug.type = cleanValue;
                } else if (field === 'category') {
                    bug.category = cleanValue;
                } else if (field === 'assigneeEmail') {
                    bug.assigneeEmail = cleanValue;
                } else if (field === 'reporterName') {
                    bug.reporterName = cleanValue;
                } else if (field === 'reporterEmail') {
                    bug.reporterEmail = cleanValue;
                } else if (field === 'browser') {
                    bug.browser = cleanValue;
                } else if (field === 'os') {
                    bug.os = cleanValue;
                } else if (field === 'url') {
                    bug.url = cleanValue;
                } else if (field === 'dueDate') {
                    bug.dueDate = cleanValue;
                }
            });

            if (hasTitle) {
                console.log(`Row ${i}: Found bug with title:`, bug.title);
                bugs.push({
                    title: bug.title as string,
                    description: bug.description as string | undefined,
                    status: bug.status as string | undefined,
                    priority: bug.priority as "low" | "medium" | "high" | "critical" | undefined,
                    type: bug.type as string | undefined,
                    category: bug.category as string | undefined,
                    assigneeEmail: bug.assigneeEmail as string | undefined,
                    tags: (bug.tags as string[]) || undefined,
                    reporterName: bug.reporterName as string | undefined,
                    reporterEmail: bug.reporterEmail as string | undefined,
                    browser: bug.browser as string | undefined,
                    os: bug.os as string | undefined,
                    url: bug.url as string | undefined,
                    dueDate: bug.dueDate as string | undefined,
                });
            } else {
                console.log(`Row ${i}: Skipped - no title found. Values:`, values.slice(0, 3));
            }
        }

        console.log(`Parsed ${bugs.length} bugs from CSV`);
        return bugs;
    };

    const handleImport = async () => {
        if (!file) {
            setError("Please select a file");
            return;
        }

        setImporting(true);
        setError(null);
        setResult(null);

        try {
            const text = await file.text();
            let bugs: BugImport[];

            if (file.name.endsWith('.json')) {
                const parsed = JSON.parse(text);
                bugs = Array.isArray(parsed) ? parsed : [parsed];
            } else if (file.name.endsWith('.csv')) {
                bugs = parseCSV(text);
            } else {
                throw new Error("Unsupported file format. Please use .csv or .json");
            }

            if (bugs.length === 0) {
                throw new Error("No valid bugs found in file");
            }

            const result = await importBugs({
                projectId,
                bugs,
                devToken: devToken || undefined,
            });

            setResult(result);
            if (result.imported > 0 && onSuccess) {
                setTimeout(() => {
                    onSuccess();
                }, 2000);
            }
        } catch (err) {
            const error = err as Error;
            setError(error.message || "Failed to import bugs");
        } finally {
            setImporting(false);
        }
    };

    const handleDownloadTemplate = async (format: 'csv' | 'json') => {
        try {
            if (!template) {
                setError("Template not loaded yet");
                return;
            }

            let content: string;
            let filename: string;
            let mimeType: string;

            if (format === 'csv') {
                content = template.csvTemplate;
                filename = 'bug-import-template.csv';
                mimeType = 'text/csv';
            } else {
                content = JSON.stringify(template.jsonTemplate, null, 2);
                filename = 'bug-import-template.json';
                mimeType = 'application/json';
            }

            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            const error = err as Error;
            setError(error.message || "Failed to download template");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                            <Upload className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Import Bugs</h2>
                            <p className="text-sm text-slate-500">Upload CSV or JSON file</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Download Templates */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-4">
                        <div className="flex items-start gap-3 mb-3">
                            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-slate-900 mb-1">Download Template</h3>
                                <p className="text-sm text-slate-600 mb-3">
                                    Start with a template to ensure your data is formatted correctly
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDownloadTemplate('csv')}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-300 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-all shadow-sm"
                                    >
                                        <Download className="w-4 h-4" />
                                        CSV Template
                                    </button>
                                    <button
                                        onClick={() => handleDownloadTemplate('json')}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-300 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-all shadow-sm"
                                    >
                                        <Download className="w-4 h-4" />
                                        JSON Template
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Select File
                        </label>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".csv,.json"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100 file:cursor-pointer cursor-pointer border-2 border-dashed border-slate-300 rounded-xl p-4 hover:border-cyan-400 transition-all"
                            />
                        </div>
                        {file && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                                <FileText className="w-4 h-4" />
                                <span className="font-medium">{file.name}</span>
                                <span className="text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2 duration-200">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <p className="font-semibold text-red-900 mb-1">Import Failed</p>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Success Result */}
                    {result && (
                        <div className={`border-2 rounded-xl p-4 animate-in slide-in-from-top-2 duration-200 ${
                            result.failed > 0 
                                ? 'bg-amber-50 border-amber-200' 
                                : 'bg-green-50 border-green-200'
                        }`}>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className={`w-5 h-5 mt-0.5 shrink-0 ${
                                    result.failed > 0 ? 'text-amber-600' : 'text-green-600'
                                }`} />
                                <div className="flex-1">
                                    <p className={`font-semibold mb-2 ${
                                        result.failed > 0 ? 'text-amber-900' : 'text-green-900'
                                    }`}>
                                        Import Complete
                                    </p>
                                    <div className="space-y-1 text-sm">
                                        <p className="text-green-700">
                                            ✓ Successfully imported: <span className="font-bold">{result.imported}</span> bugs
                                        </p>
                                        {result.failed > 0 && (
                                            <p className="text-red-700">
                                                ✗ Failed: <span className="font-bold">{result.failed}</span> bugs
                                            </p>
                                        )}
                                    </div>
                                    {result.errors.length > 0 && (
                                        <div className="mt-3 p-3 bg-white rounded-lg border border-amber-200">
                                            <p className="text-xs font-semibold text-amber-900 mb-2">Errors:</p>
                                            <ul className="text-xs text-amber-800 space-y-1 max-h-32 overflow-y-auto">
                                                {result.errors.slice(0, 10).map((err, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <span className="text-amber-400">•</span>
                                                        <span>{err}</span>
                                                    </li>
                                                ))}
                                                {result.errors.length > 10 && (
                                                    <li className="text-amber-600 italic">
                                                        ... and {result.errors.length - 10} more errors
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Format Guide */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <h3 className="font-semibold text-slate-900 mb-2 text-sm">Format Requirements</h3>
                        <ul className="text-xs text-slate-600 space-y-1">
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-500 mt-0.5">•</span>
                                <span><span className="font-semibold">Required:</span> title</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-500 mt-0.5">•</span>
                                <span><span className="font-semibold">Optional:</span> description, status, priority, type, category, assigneeEmail, tags, reporterName, reporterEmail, browser, os, url, dueDate</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-500 mt-0.5">•</span>
                                <span><span className="font-semibold">Priorities:</span> low, medium, high, critical</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-500 mt-0.5">•</span>
                                <span><span className="font-semibold">Date format:</span> YYYY-MM-DD or ISO 8601</span>
                            </li>
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={!file || importing}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {importing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Import Bugs
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
