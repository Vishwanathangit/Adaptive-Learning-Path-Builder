import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { Navbar } from './components/Navbar';
import { ComponentSidebar } from './components/ComponentSidebar';
import { Canvas } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Simulator } from './components/Simulator';
import { PathListModal } from './components/PathListModal';
import { AlertCircle } from 'lucide-react';

function App() {
  const { 
    loadComponents, 
    loadLearningPaths, 
    activePath, 
    createNewPath,
    isSimulating, 
    error
  } = useStore();

  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);

  useEffect(() => {
    // Initial data seeding load
    loadComponents();
    loadLearningPaths();
  }, [loadComponents, loadLearningPaths]);

  return (
    <div className="flex flex-col h-screen bg-bg-main text-text-main font-sans overflow-hidden">
      {/* Top Navigation */}
      <Navbar onOpenLoadModal={() => setIsLoadModalOpen(true)} />

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Side: Drag/Click Library components */}
        <ComponentSidebar />

        {/* Center: Canvas grid layout */}
        {activePath ? (
          <Canvas />
        ) : (
          <div className="grow flex flex-col items-center justify-center text-center p-6 relative bg-bg-main">
            {/* Grid dotted styling background */}
            <div className="absolute inset-0 pointer-events-none opacity-40" style={{
              backgroundImage: 'radial-gradient(circle, var(--border-main) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />
            
            <div className="z-10 max-w-sm space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-node-start-bg border border-node-start-border flex items-center justify-center text-node-start">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-text-sub">Start Path Design</h2>
              <p className="text-xs text-text-muted leading-relaxed">
                Build an adaptive course pathway by loading a saved path template or starting a fresh path from scratch.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={createNewPath}
                  className="px-4 py-2 bg-border-focus hover:bg-border-focus/80 font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/15 transition text-white"
                >
                  Create New Path
                </button>
                <button
                  onClick={() => setIsLoadModalOpen(true)}
                  className="px-4 py-2 bg-bg-panel-hover hover:bg-bg-panel-hover/80 font-semibold rounded-xl text-xs transition"
                >
                  Load Saved Path
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Right Side: Properties Panel or Progression Simulator */}
        {isSimulating ? <Simulator /> : <PropertiesPanel />}
      </div>

      {/* Global error banner notifications */}
      {error && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 bg-node-rose-bg/95 backdrop-blur border border-node-rose-border text-node-rose py-3 px-4 rounded-xl shadow-xl shadow-slate-950/50 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <AlertCircle className="w-4 h-4 text-node-rose shrink-0" />
          <span className="text-xs font-medium leading-normal">{error}</span>
          <button 
            onClick={() => useStore.setState({ error: null })} 
            className="text-[10px] text-text-muted hover:text-text-sub ml-2 font-bold px-1"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Modal Dialog: Pathway Selector */}
      <PathListModal 
        isOpen={isLoadModalOpen} 
        onClose={() => setIsLoadModalOpen(false)} 
      />
    </div>
  );
}

export default App;