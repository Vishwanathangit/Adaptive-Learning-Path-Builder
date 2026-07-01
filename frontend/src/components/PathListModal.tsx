import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { FileText, Trash2, X, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

interface PathListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

export const PathListModal: React.FC<PathListModalProps> = ({ isOpen, onClose }) => {
  const { 
    learningPaths, 
    loadLearningPaths, 
    loadPath, 
    deletePath, 
    activePath,
    isLoading 
  } = useStore();

  // Which path id is pending deletion (shows inline confirm row)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast queue
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  useEffect(() => {
    if (isOpen) {
      loadLearningPaths();
      setPendingDeleteId(null);
    }
  }, [isOpen, loadLearningPaths]);

  if (!isOpen) return null;

  const handleSelectPath = async (id: string) => {
    if (pendingDeleteId) return; // don't navigate while confirming delete
    await loadPath(id);
    onClose();
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPendingDeleteId(id);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDeleteId(null);
  };

  const handleConfirmDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await deletePath(id);
      setPendingDeleteId(null);
      showToast('success', `"${name}" deleted successfully.`);
    } catch {
      showToast('error', 'Failed to delete the learning path. Please try again.');
      setPendingDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Toast Stack — rendered outside modal backdrop so it floats above everything */}
      <div className="fixed bottom-6 right-6 z-100 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            {toast.message}
          </div>
        ))}
      </div>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
        {/* Modal Container */}
        <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-blue-500 shrink-0" />
              <h2 className="text-sm sm:text-base font-bold text-slate-800 truncate">Load Saved Learning Paths</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List Body */}
          <div className="grow overflow-y-auto p-4 sm:p-6 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
            {isLoading && !isDeleting ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-xs text-slate-500 font-semibold">Loading pathways...</span>
              </div>
            ) : (!Array.isArray(learningPaths) || learningPaths.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 gap-2">
                <AlertTriangle className="w-8 h-8 text-slate-300" />
                <span className="text-xs font-semibold text-slate-600">No pathways found</span>
                <span className="text-[11px] text-slate-400 max-w-xs">Create and save a new learning path, and it will appear here.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {learningPaths.map((path) => (
                  <div key={path.id} className="flex flex-col">
                    <div
                      onClick={() => handleSelectPath(path.id)}
                      className={`group border rounded-xl p-3.5 sm:p-4 flex items-center justify-between cursor-pointer transition-all duration-200 ${
                        pendingDeleteId === path.id
                          ? 'border-rose-300 bg-rose-50/40 rounded-b-none'
                          : activePath?.id === path.id
                          ? 'border-blue-500 bg-blue-50/30'
                          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex flex-col gap-1 pr-3 sm:pr-4 min-w-0">
                        <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 truncate">
                          {path.name}
                        </span>
                        <span className="text-[10px] text-slate-500 line-clamp-1">
                          {path.description || 'No description provided'}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                            path.status === 'published'
                              ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                              : 'text-amber-600 bg-amber-50 border-amber-200'
                          }`}>
                            {path.status}
                          </span>
                          {path.version && (
                            <span className="text-[9px] text-slate-400">v{path.version}</span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDeleteClick(e, path.id)}
                        className={`p-2 rounded-lg border transition shrink-0 ${
                          pendingDeleteId === path.id
                            ? 'text-rose-600 bg-rose-100 border-rose-200'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-transparent hover:border-rose-100'
                        }`}
                        title="Delete Pathway"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Inline confirm row — slides in below the card */}
                    {pendingDeleteId === path.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="border border-t-0 border-rose-200 bg-rose-50 rounded-b-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-1 duration-150"
                      >
                        <div className="flex items-center gap-2 text-rose-700 min-w-0">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[11px] font-medium truncate sm:whitespace-normal">
                            Delete <strong>"{path.name}"</strong>? This cannot be undone.
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                          <button
                            onClick={handleCancelDelete}
                            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={(e) => handleConfirmDelete(e, path.id, path.name)}
                            disabled={isDeleting}
                            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 transition flex items-center gap-1.5"
                          >
                            {isDeleting && (
                              <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            )}
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
