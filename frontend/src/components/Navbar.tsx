import React from 'react';
import { useStore } from '../store/useStore';
import { 
  Save, 
  Play, 
  Eye,
  FolderOpen
} from 'lucide-react';

interface NavbarProps {
  onOpenLoadModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLoadModal }) => {
  const {
    isDirty,
    isLoading,
    isSimulating,
    saveActivePath,
    startSimulation,
    stopSimulation
  } = useStore();

  return (
    <header className="bg-bg-panel border-b border-border-main px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between sticky top-0 z-50 gap-2">
      {/* Brand & Subtitle */}
      <div className="flex flex-col min-w-0">
        <span className="font-bold text-text-main text-sm sm:text-base md:text-lg tracking-tight truncate">
          <span className="inline sm:hidden">Path Builder</span>
          <span className="hidden sm:inline">Adaptive Learning Path Builder</span>
        </span>
        <span className="text-[10px] md:text-xs text-text-muted mt-0.5 truncate hidden sm:block">
          Create conditional quiz flows with adaptive sections
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        <button className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[#020617] text-white text-xs sm:text-sm font-semibold shadow-sm transition hover:bg-[#0f172a]">
          Builder
        </button>

        <button
          onClick={onOpenLoadModal}
          className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#020617] hover:bg-slate-50 transition"
          title="Open Saved Path"
        >
          <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden md:inline">Open Path</span>
        </button>

        <button 
          onClick={isSimulating ? stopSimulation : startSimulation}
          className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${isSimulating ? 'text-[#020617] bg-slate-100' : 'text-slate-600 hover:text-[#020617] hover:bg-slate-50'}`}
          title="Toggle Simulation Preview"
        >
          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden md:inline">Preview</span>
        </button>

        <div className="hidden md:block w-px h-5 bg-slate-200 mx-0.5" />

        <button
          onClick={saveActivePath}
          disabled={isLoading || !isDirty}
          className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
            isDirty 
              ? 'text-slate-600 hover:text-[#020617] hover:bg-slate-50' 
              : 'text-slate-400 cursor-not-allowed'
          }`}
          title="Save Path Draft"
        >
          <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden md:inline">Save Draft</span>
        </button>

        <button
          className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[#020617] hover:bg-[#0f172a] text-white text-xs sm:text-sm font-semibold transition shadow-sm sm:ml-1"
          title="Publish learning path"
        >
          <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden md:inline">Publish</span>
        </button>
      </div>
    </header>
  );
};
