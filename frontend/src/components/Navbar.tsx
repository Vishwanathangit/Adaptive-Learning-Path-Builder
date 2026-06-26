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
    <header className="bg-bg-panel border-b border-border-main px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      {/* Brand & Subtitle */}
      <div className="flex flex-col">
        <span className="font-bold text-text-main text-lg tracking-tight">Adaptive Learning Path Builder</span>
        <span className="text-sm text-text-muted mt-0.5">Create conditional quiz flows with adaptive sections</span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 shrink-0">
        <button className="px-5 py-2 rounded-lg bg-[#020617] text-white text-sm font-semibold shadow-sm transition hover:bg-[#0f172a]">
          Builder
        </button>

        <button
          onClick={onOpenLoadModal}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-[#020617] hover:bg-slate-50 transition"
        >
          <FolderOpen className="w-4 h-4" />
          Open Path
        </button>

        <button 
          onClick={isSimulating ? stopSimulation : startSimulation}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition ${isSimulating ? 'text-[#020617] bg-slate-100' : 'text-slate-600 hover:text-[#020617]'}`}
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <button
          onClick={saveActivePath}
          disabled={isLoading || !isDirty}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition ${
            isDirty 
              ? 'text-slate-600 hover:text-[#020617] hover:bg-slate-50' 
              : 'text-slate-400 cursor-not-allowed'
          }`}
        >
          <Save className="w-4 h-4" />
          Save Draft
        </button>

        <button
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#020617] hover:bg-[#0f172a] text-white text-sm font-semibold transition shadow-sm ml-2"
        >
          <Play className="w-4 h-4" />
          Publish
        </button>
      </div>
    </header>
  );
};
