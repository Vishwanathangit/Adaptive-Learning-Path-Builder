import React from 'react';
import { useStore } from '../store/useStore';
import { Layers, Info, CheckCircle2, X } from 'lucide-react';

interface ComponentSidebarProps {
  onClose?: () => void;
}

export const ComponentSidebar: React.FC<ComponentSidebarProps> = ({ onClose }) => {
  const { activePath, addNode, isSimulating, components, selectNode } = useStore();

  // Calculate a staggered position so nodes don't stack on top of each other
  const getNextPosition = () => {
    if (!activePath) return { x: 300, y: 150 };
    const contentNodes = activePath.nodes.filter((n) => n.type !== 'start' && n.type !== 'end');
    const count = contentNodes.length;
    const col = count % 3;
    const row = Math.floor(count / 3);
    return { x: 260 + col * 300, y: 180 + row * 130 };
  };

  const handleAddComponent = (type: 'unit' | 'assessment', title: string) => {
    if (isSimulating || !activePath) return;
    addNode({
      type: type,
      label: title,
      position: getNextPosition(),
      componentId: null
    });
  };

  const handleAddApiComponent = (comp: any) => {
    if (isSimulating || !activePath) return;

    // If this component is already on the canvas, select it instead of duplicating
    const existing = activePath.nodes.find((n) => n.componentId === comp.id);
    if (existing) {
      selectNode(existing.id);
      return;
    }

    addNode({
      type: comp.type,
      label: comp.title,
      position: getNextPosition(),
      componentId: comp.id
    });
  };

  const handleDragStart = (e: React.DragEvent, type: 'unit' | 'assessment', title: string) => {
    if (isSimulating) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', JSON.stringify({
      type: type,
      label: title,
      componentId: null
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragStartApiComponent = (e: React.DragEvent, comp: any) => {
    if (isSimulating) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', JSON.stringify({
      type: comp.type,
      label: comp.title,
      componentId: comp.id
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside className="w-[300px] border-r border-border-main bg-bg-panel flex flex-col h-full shrink-0 select-none">
      <div className="p-5 border-b border-border-main flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Add Components</h2>
          <p className="text-xs text-slate-500 mt-1">Drag or click to add to canvas</p>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        )}
      </div>

      <div className="grow overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-border-main">
        {/* Generic Templates Subheader */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Generic Templates</h4>
          <div className="space-y-3">
            {/* Section Card */}
            <div
              draggable={!isSimulating && !!activePath}
              onDragStart={(e) => handleDragStart(e, 'unit', 'New Section')}
              onClick={() => handleAddComponent('unit', 'New Section')}
              className={`border border-slate-200 bg-white rounded-xl p-3.5 flex gap-3.5 items-center cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-sm transition-all ${
                (!activePath || isSimulating) ? 'opacity-60 pointer-events-none' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-[#3B82F6] flex items-center justify-center shrink-0">
                <div className="w-[18px] h-[18px] border-2 border-white rounded-[4px]"></div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-800">Section</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-tight">Add a quiz/<br/>assessment section</p>
              </div>
            </div>

            {/* Group Card */}
            <div
              draggable={!isSimulating && !!activePath}
              onDragStart={(e) => handleDragStart(e, 'assessment', 'New Group')}
              onClick={() => handleAddComponent('assessment', 'New Group')}
              className={`border border-slate-200 bg-white rounded-xl p-3.5 flex gap-3.5 items-center cursor-grab active:cursor-grabbing hover:border-purple-400 hover:shadow-sm transition-all ${
                (!activePath || isSimulating) ? 'opacity-60 pointer-events-none' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-[#A855F7] flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-800">Group</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-tight">Group sections for<br/>conditional routing</p>
              </div>
            </div>
          </div>
        </div>

        {/* API Seeded Components Section */}
        <div className="pt-3 border-t border-slate-100">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Available Content</h4>
          {(!components || components.length === 0) ? (
            <p className="text-xs text-slate-400 italic">No available content loaded.</p>
          ) : (
            <div className="space-y-3">
              {components.map((comp) => {
                const isAssessment = comp.type === 'assessment';
                const isOnCanvas = activePath?.nodes.some((n) => n.componentId === comp.id) ?? false;
                return (
                  <div
                    key={comp.id}
                    draggable={!isSimulating && !!activePath && !isOnCanvas}
                    onDragStart={(e) => handleDragStartApiComponent(e, comp)}
                    onClick={() => handleAddApiComponent(comp)}
                    className={`relative border rounded-xl p-3 flex flex-col gap-2.5 transition-all ${
                      isOnCanvas
                        ? 'border-emerald-300 bg-emerald-50 cursor-pointer hover:border-emerald-400 hover:shadow-sm'
                        : 'border-slate-200 bg-white cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-sm'
                    } ${
                      (!activePath || isSimulating) ? 'opacity-60 pointer-events-none' : ''
                    }`}
                  >
                    {/* Already-on-canvas indicator */}
                    {isOnCanvas && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                    )}

                    <div className="flex gap-2.5 items-center">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isAssessment ? 'bg-[#A855F7]' : 'bg-[#3B82F6]'
                      }`}>
                        {isAssessment ? (
                          <Layers className="w-4 h-4 text-white" />
                        ) : (
                          <div className="w-[14px] h-[14px] border-2 border-white rounded-[3px]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pr-4">
                        <h3 className="text-xs font-bold text-slate-850 truncate" title={comp.title}>
                          {comp.title}
                        </h3>
                        <span className={`inline-block text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border mt-0.5 ${
                          isAssessment 
                            ? 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200' 
                            : 'bg-violet-50 text-violet-600 border-violet-200'
                        }`}>
                          {comp.type}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-slate-500 leading-normal line-clamp-2">
                      {comp.shortDescription}
                    </p>
                    
                    <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-100 pt-2 mt-1">
                      <span>Duration: <strong>{comp.approximateDurationMinutes} min</strong></span>
                      {isAssessment ? (
                        <span>Max Score: <strong>{comp.metadata?.assessment?.maxScore || 100}</strong></span>
                      ) : (
                        <span>Recommended: <strong>{comp.metadata?.unit?.recommendedMinutes || 30}m</strong></span>
                      )}
                    </div>

                    {isOnCanvas && (
                      <div className="text-[9px] text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        On canvas — click to select
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-2 pb-2">
          <div className="h-px bg-slate-200 w-full" />
        </div>

        {/* How it works */}
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[#1E40AF] mb-3">
            <Info className="w-4 h-4" />
            <h4 className="text-sm font-semibold">How it works:</h4>
          </div>
          <ul className="text-xs text-[#1E40AF] space-y-2.5 list-none">
            <li className="flex gap-2 leading-relaxed">
              <span className="text-[#3B82F6] mt-px">&bull;</span>
              <span>Add <strong>Sections</strong> to create modules</span>
            </li>
            <li className="flex gap-2 leading-relaxed">
              <span className="text-[#3B82F6] mt-px">&bull;</span>
              <span>Use <strong>Groups</strong> for multiple sections where only one will be shown</span>
            </li>
            <li className="flex gap-2 leading-relaxed">
              <span className="text-[#3B82F6] mt-px">&bull;</span>
              <span>Set conditions based on previous section scores</span>
            </li>
            <li className="flex gap-2 leading-relaxed">
              <span className="text-[#3B82F6] mt-px">&bull;</span>
              <span>System automatically routes learners based on performance</span>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
};
