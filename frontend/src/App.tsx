import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { Navbar } from './components/Navbar';
import { ComponentSidebar } from './components/ComponentSidebar';
import { Canvas } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Simulator } from './components/Simulator';
import { PathListModal } from './components/PathListModal';
import { AlertCircle, Sliders, Menu } from 'lucide-react';

function App() {
  const { 
    loadComponents, 
    loadLearningPaths, 
    activePath, 
    createNewPath,
    isSimulating, 
    selectedNodeId,
    selectedEdgeId,
    error
  } = useStore();

  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  useEffect(() => {
    // Initial data seeding load
    loadComponents();
    loadLearningPaths();
  }, [loadComponents, loadLearningPaths]);

  // Automatically open properties panel when selection changes or simulation starts
  useEffect(() => {
    if (selectedNodeId || selectedEdgeId || isSimulating) {
      setIsRightSidebarOpen(true);
    }
  }, [selectedNodeId, selectedEdgeId, isSimulating]);

  return (
    <div className="flex flex-col h-screen bg-bg-main text-text-main font-sans overflow-hidden">
      {/* Top Navigation */}
      <Navbar onOpenLoadModal={() => setIsLoadModalOpen(true)} />

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Side Drawer / Sidebar */}
        {isLeftSidebarOpen && (
          <div 
            className="lg:hidden absolute inset-0 bg-slate-950/40 backdrop-blur-xs z-30 transition-opacity"
            onClick={() => setIsLeftSidebarOpen(false)}
          />
        )}
        <div className={`
          absolute lg:static top-0 bottom-0 left-0 z-40 h-full
          transition-transform duration-300 ease-in-out
          ${isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <ComponentSidebar onClose={() => setIsLeftSidebarOpen(false)} />
        </div>

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
            
            <div className="z-10 max-w-sm space-y-4 px-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-node-start-bg border border-node-start-border flex items-center justify-center text-node-start">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-text-sub">Start Path Design</h2>
              <p className="text-xs text-text-muted leading-relaxed">
                Build an adaptive course pathway by loading a saved path template or starting a fresh path from scratch.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={createNewPath}
                  className="w-full sm:w-auto px-4 py-2 bg-border-focus hover:bg-border-focus/80 font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/15 transition text-white"
                >
                  Create New Path
                </button>
                <button
                  onClick={() => setIsLoadModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-bg-panel-hover hover:bg-bg-panel-hover/80 font-semibold rounded-xl text-xs transition"
                >
                  Load Saved Path
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Right Side Drawer / Panel */}
        {isRightSidebarOpen && (
          <div 
            className="lg:hidden absolute inset-0 bg-slate-950/40 backdrop-blur-xs z-30 transition-opacity"
            onClick={() => setIsRightSidebarOpen(false)}
          />
        )}
        <div className={`
          absolute lg:static top-0 bottom-0 right-0 z-40 h-full
          transition-transform duration-300 ease-in-out
          ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          {isSimulating ? (
            <Simulator onClose={() => setIsRightSidebarOpen(false)} />
          ) : (
            <PropertiesPanel onClose={() => setIsRightSidebarOpen(false)} />
          )}
        </div>
      </div>

      {/* Floating Panel Toggle Buttons for Mobile/Tablet */}
      {activePath && !isLeftSidebarOpen && !isRightSidebarOpen && (
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white/95 backdrop-blur border border-slate-200 p-1.5 rounded-full shadow-lg">
          <button
            onClick={() => {
              setIsLeftSidebarOpen(true);
              setIsRightSidebarOpen(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
              isLeftSidebarOpen 
                ? 'bg-[#020617] text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Menu className="w-3.5 h-3.5" />
            Library
          </button>
          
          <div className="w-px h-4 bg-slate-200" />
          
          <button
            onClick={() => {
              setIsRightSidebarOpen(true);
              setIsLeftSidebarOpen(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
              isRightSidebarOpen 
                ? 'bg-[#020617] text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Properties
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Global error banner notifications */}
      {error && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 bg-node-rose-bg/95 backdrop-blur border border-node-rose-border text-node-rose py-3 px-4 rounded-xl shadow-xl shadow-slate-950/50 max-w-xs sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
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