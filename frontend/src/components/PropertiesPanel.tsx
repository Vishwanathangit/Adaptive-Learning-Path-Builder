import React from 'react';
import { useStore } from '../store/useStore';
import { Trash2, Plus, Info, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PropertiesPanelProps {
  onClose?: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ onClose }) => {
  const {
    activePath,
    selectedNodeId,
    selectedEdgeId,
    updateNodeLabel,
    deleteNode,
    addEdge,
    updateEdge,
    deleteEdge,
    isSimulating
  } = useStore();

  if (!activePath) return null;

  const selectedNode = activePath.nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = activePath.edges.find((e) => e.id === selectedEdgeId);

  const incomingEdges = activePath?.edges.filter((e) => e.targetNodeId === selectedNodeId) || [];
  const availableSourceNodes = activePath?.nodes.filter((n) => n.id !== selectedNodeId && n.type !== 'end') || [];

  const handleAddCondition = () => {
    if (!selectedNodeId || availableSourceNodes.length === 0) return;
    
    const defaultSource = availableSourceNodes[0];
    
    addEdge({
      sourceNodeId: defaultSource.id,
      targetNodeId: selectedNodeId,
      isDefault: false,
      priority: incomingEdges.length + 1,
      conditions: {
        operator: 'AND',
        rules: [
          {
            id: `rule-${Date.now()}`,
            sourceType: defaultSource.type as any,
            sourceNodeId: defaultSource.id,
            metric: 'score',
            operator: 'lt',
            value: 50
          }
        ]
      }
    } as any);
  };

  // 1. NODE PROPERTIES RENDER
  if (selectedNode) {
    const isSpecialNode = selectedNode.id === 'node-start' || selectedNode.id === 'node-end';
    
    // Convert 'unit' -> 'Section', 'assessment' -> 'Group' for UI
    const uiType = selectedNode.type === 'unit' ? 'Section' : 
                   selectedNode.type === 'assessment' ? 'Group' : 
                   selectedNode.type;

    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNodeLabel(selectedNode.id, e.target.value);
    };

    return (
      <aside className="w-[320px] border-l border-border-main bg-bg-panel flex flex-col h-full shrink-0 select-none">
        <div className="p-5 border-b border-border-main flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-text-main">Properties</h2>
            <p className="text-xs text-text-muted capitalize">{uiType}</p>
          </div>
          <div className="flex items-center gap-1">
            {!isSpecialNode && (
              <button 
                onClick={() => deleteNode(selectedNode.id)}
                disabled={isSimulating}
                className="text-node-rose hover:text-node-rose/80 transition p-2 hover:bg-node-rose-bg rounded-lg"
                title="Delete Component"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {onClose && (
              <button 
                onClick={onClose} 
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition"
                title="Close properties"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="grow overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-border-main">
          {/* Label */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-main block">Label</label>
            <input 
              type="text"
              className="w-full bg-bg-main border border-border-main rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-border-focus transition"
              value={selectedNode.label}
              onChange={handleLabelChange}
              disabled={isSimulating}
            />
          </div>
          
          {/* Description (mock) */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-main block">Description</label>
            <textarea 
              className="w-full bg-bg-main border border-border-main rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-border-focus transition min-h-[80px] resize-none"
              placeholder="Enter description"
              disabled={isSimulating}
            />
          </div>

          {/* Section Details (mock) */}
          {(selectedNode.type === 'unit' || selectedNode.type === 'assessment') && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-text-main block">
                {uiType} Details
              </label>
              <div className="flex gap-3">
                <div className="space-y-1.5 flex-1">
                  <label className="text-xs text-text-muted font-medium block">Questions</label>
                  <input type="number" className="w-full bg-bg-main border border-border-main rounded-lg px-3 py-1.5 text-sm text-text-main focus:outline-none focus:border-border-focus" placeholder="0" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <label className="text-xs text-text-muted font-medium block">Duration (min)</label>
                  <input type="number" className="w-full bg-bg-main border border-border-main rounded-lg px-3 py-1.5 text-sm text-text-main focus:outline-none focus:border-border-focus" placeholder="0" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-text-muted font-medium block">Difficulty</label>
                <Select>
                  <SelectTrigger className="w-full h-9 bg-bg-main border border-border-main rounded-lg px-3 text-sm text-text-muted cursor-pointer hover:bg-slate-50 transition-colors focus:ring-1 focus:ring-border-focus focus:border-border-focus">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy" className="focus:bg-blue-600 focus:text-white cursor-pointer text-sm">Easy</SelectItem>
                    <SelectItem value="medium" className="focus:bg-blue-600 focus:text-white cursor-pointer text-sm">Medium</SelectItem>
                    <SelectItem value="hard" className="focus:bg-blue-600 focus:text-white cursor-pointer text-sm">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Assignment Conditions */}
          {(selectedNode.type === 'unit' || selectedNode.type === 'assessment') && (
            <div className="space-y-3 pt-4 border-t border-border-main">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-text-main">Assignment Conditions</label>
                <button 
                  onClick={handleAddCondition}
                  disabled={isSimulating}
                  className="text-xs font-semibold text-text-main hover:text-border-focus flex items-center gap-1 transition disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              <p className="text-[10px] text-text-muted leading-tight">Define when this section should be shown to learners</p>

              {incomingEdges.map((edge, index) => {
                const rule = edge.conditions?.rules?.[0] || { operator: 'lt', value: 50, sourceNodeId: edge.sourceNodeId };
                
                return (
                  <div key={edge.id} className="bg-bg-main border border-border-main rounded-lg p-3.5 space-y-3 relative group">
                    <button 
                      onClick={() => deleteEdge(edge.id)}
                      disabled={isSimulating}
                      className="absolute top-2.5 right-2.5 text-text-muted hover:text-node-rose opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-semibold text-text-muted block">Condition {index + 1}</span>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-text-main uppercase tracking-wider block">Source Section</label>
                      <Select 
                        value={edge.sourceNodeId} 
                        onValueChange={(val) => {
                           const newRules = [...(edge.conditions?.rules || [])];
                           if(newRules.length > 0) newRules[0].sourceNodeId = val;
                           updateEdge(edge.id, { sourceNodeId: val, conditions: { ...edge.conditions, rules: newRules } });
                        }}
                      >
                        <SelectTrigger className="w-full h-[32px] bg-white border border-slate-200 rounded-md px-2 py-0 text-xs text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors focus:ring-1 focus:ring-border-focus">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSourceNodes.map(sn => (
                            <SelectItem key={sn.id} value={sn.id} className="focus:bg-blue-600 focus:text-white cursor-pointer text-xs">
                              {sn.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="space-y-1.5 flex-1">
                        <label className="text-[10px] font-semibold text-text-main uppercase tracking-wider block">Operator</label>
                        <Select 
                          value={rule.operator}
                          onValueChange={(val) => {
                            const newRules = [...(edge.conditions?.rules || [])];
                            if(newRules.length > 0) newRules[0].operator = val as any;
                            updateEdge(edge.id, { conditions: { ...edge.conditions, rules: newRules } });
                          }}
                        >
                          <SelectTrigger className="w-full h-[32px] bg-white border border-slate-200 rounded-md px-2 py-0 text-xs text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors focus:ring-1 focus:ring-border-focus">
                            <SelectValue placeholder="Select operator" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lt" className="focus:bg-blue-600 focus:text-white cursor-pointer text-xs">Less than (&lt;)</SelectItem>
                            <SelectItem value="lte" className="focus:bg-blue-600 focus:text-white cursor-pointer text-xs">Less than or equal to (&lt;=)</SelectItem>
                            <SelectItem value="gt" className="focus:bg-blue-600 focus:text-white cursor-pointer text-xs">Greater than (&gt;)</SelectItem>
                            <SelectItem value="gte" className="focus:bg-blue-600 focus:text-white cursor-pointer text-xs">Greater than or equal to (&gt;=)</SelectItem>
                            <SelectItem value="eq" className="focus:bg-blue-600 focus:text-white cursor-pointer text-xs">Equals (=)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5 flex-[0.8]">
                        <label className="text-[10px] font-semibold text-text-main uppercase tracking-wider block">Threshold</label>
                        <div className="flex items-center gap-1.5">
                          <input 
                            type="number" 
                            value={rule.value || 0} 
                            onChange={(e) => {
                              const newRules = [...(edge.conditions?.rules || [])];
                              if(newRules.length > 0) newRules[0].value = parseFloat(e.target.value) || 0;
                              updateEdge(edge.id, { conditions: { ...edge.conditions, rules: newRules } });
                            }}
                            disabled={isSimulating}
                            className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-700 focus:border-border-focus focus:outline-none" 
                          />
                          <span className="text-xs font-medium text-text-muted">%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-xs font-medium text-blue-600 mt-1">
                      Show if score {rule.operator === 'lt' ? '<' : rule.operator === 'lte' ? '<=' : rule.operator === 'gt' ? '>' : rule.operator === 'gte' ? '>=' : '='} {rule.value || 0}%
                    </div>
                  </div>
                );
              })}

              {incomingEdges.length === 0 && (
                <div className="text-xs text-text-muted italic py-4 text-center border border-dashed border-border-main rounded-lg">
                  No conditions yet. Click + Add to define rules.
                </div>
              )}
              <div className="pt-2">
                <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-1">Parent Group</span>
                <span className="text-xs font-medium text-text-main">Math Module 2</span>
                <p className="text-[10px] text-text-muted mt-0.5">This section belongs to a group</p>
              </div>

            </div>
          )}
        </div>
      </aside>
    );
  }

  // 2. EDGE PROPERTIES RENDER
  if (selectedEdge) {
    return (
      <aside className="w-[320px] border-l border-border-main bg-bg-panel flex flex-col h-full shrink-0 select-none">
        <div className="p-5 border-b border-border-main flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-text-main">Edge Properties</h2>
            <p className="text-xs text-text-muted">Connection Logic</p>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => deleteEdge(selectedEdge.id)}
              disabled={isSimulating}
              className="text-node-rose hover:text-node-rose/80 transition p-2 hover:bg-node-rose-bg rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {onClose && (
              <button 
                onClick={onClose} 
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition"
                title="Close properties"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="grow overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-border-main">
          {/* Source -> Target Nodes info */}
          <div className="flex items-center justify-between text-xs bg-bg-main p-3 rounded-xl border border-border-main">
            <div>
              <span className="text-[9px] block text-text-muted uppercase font-semibold">Source</span>
              <span className="font-semibold text-text-main">
                {activePath.nodes.find((n) => n.id === selectedEdge.sourceNodeId)?.label}
              </span>
            </div>
            <div className="text-text-muted">→</div>
            <div className="text-right">
              <span className="text-[9px] block text-text-muted uppercase font-semibold">Target</span>
              <span className="font-semibold text-text-main">
                {activePath.nodes.find((n) => n.id === selectedEdge.targetNodeId)?.label}
              </span>
            </div>
          </div>
          
          <div className="bg-bg-main border border-border-main rounded-xl p-4 text-center space-y-2">
            <Info className="w-5 h-5 text-text-muted mx-auto" />
            <p className="text-xs text-text-muted">Edge logic is now primarily configured in the Assignment Conditions of the destination Section node in this visual mockup.</p>
          </div>
        </div>
      </aside>
    );
  }

  // 3. DEFAULT PLACEHOLDER
  return (
    <aside className="w-[320px] border-l border-border-main bg-bg-panel flex flex-col h-full shrink-0 relative justify-center items-center text-center p-8 select-none">
      {onClose && (
        <button 
          onClick={onClose} 
          className="lg:hidden absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition"
          title="Close properties"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <div className="w-14 h-14 rounded-2xl bg-bg-main border border-border-main flex items-center justify-center text-text-muted mb-4 shadow-sm">
        <Info className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">Properties</h3>
      <p className="text-[11px] text-text-muted leading-relaxed mt-2 max-w-[200px]">
        Select any node or connection line on the canvas workspace to configure its properties, rules, and logic filters here.
      </p>
    </aside>
  );
};
