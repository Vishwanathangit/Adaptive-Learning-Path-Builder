import React from 'react';
import { useStore } from '../store/useStore';
import { 
  PlayCircle, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2 
} from 'lucide-react';

export const Simulator: React.FC = () => {
  const {
    activePath,
    simulationState,
    isSimulating,
    setSimulationMetric,
    stepSimulation,
    stopSimulation,
    components,
    isLoading
  } = useStore();

  if (!isSimulating || !activePath) return null;

  const { currentNodeId, metrics, visitedNodeIds, evaluationError } = simulationState;
  
  const currentNode = activePath.nodes.find((n) => n.id === currentNodeId);
  const associatedComp = components.find((c) => c.id === currentNode?.componentId);

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    setSimulationMetric('score', val);
    setSimulationMetric('score_range', val);
  };

  const handlePassedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSimulationMetric('passed', e.target.checked);
  };

  const handleCompletionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSimulationMetric('completion', e.target.checked);
  };

  return (
    <aside className="w-80 border-l border-border-main bg-bg-panel flex flex-col h-full shrink-0 select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-border-main bg-amber-50/55 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PlayCircle className="w-4 h-4 text-amber-600 animate-pulse" />
          <h2 className="text-xs font-bold text-amber-700 tracking-wider uppercase">Path Simulator</h2>
        </div>
        <button
          onClick={stopSimulation}
          className="text-[10px] font-bold text-slate-500 hover:text-slate-800 border border-slate-200 px-2 py-0.5 rounded transition hover:bg-slate-50"
        >
          Exit
        </button>
      </div>

      {/* Simulator Body */}
      <div className="grow overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-border-main">
        
        {/* 1. CURRENT NODE DETAILS */}
        {currentNode && (
          <div className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-border-main">
            <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider block">
              Current Location
            </span>
            
            <div className="flex items-center gap-1.5">
              <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${
                currentNode.type === 'start'
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : currentNode.type === 'end'
                    ? 'bg-slate-50 text-slate-600 border-slate-200'
                    : currentNode.type === 'unit'
                      ? 'bg-blue-50 text-blue-600 border-blue-200'
                      : 'bg-purple-50 text-purple-600 border-purple-200'
              }`}>
                {currentNode.type}
              </span>
              <span className="text-xs font-bold text-text-main truncate">
                {currentNode.label}
              </span>
            </div>

            {associatedComp && (
              <div className="text-[10px] text-text-sub leading-normal border-t border-border-main pt-2 mt-2">
                <span className="text-[8.5px] text-text-muted block font-bold uppercase tracking-wider mb-0.5">Content Component</span>
                <span className="font-semibold text-text-main">{associatedComp.title}</span>
                <p className="text-text-muted mt-0.5">{associatedComp.shortDescription}</p>
              </div>
            )}

            {currentNode.type === 'start' && (
              <p className="text-[10px] text-text-muted leading-normal border-t border-border-main pt-2 mt-2">
                This is the entry point of the learning path. Set metrics below and click step to start routing.
              </p>
            )}
            
            {currentNode.type === 'end' && (
              <div className="flex items-center gap-2 text-[10px] text-emerald-600 leading-normal border-t border-border-main pt-2 mt-2 bg-emerald-50/30 p-1.5 rounded-lg border border-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-medium">Target end state reached successfully!</span>
              </div>
            )}
          </div>
        )}

        {/* 2. LEARNER METRICS INPUTS */}
        <div className="space-y-4">
          <span className="text-[10px] text-text-muted font-bold tracking-wider uppercase block border-b border-border-main pb-1.5">
            Learner Metrics
          </span>

          {/* Score metric (Slider) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-sub font-semibold">Test Score</span>
              <span className="font-mono text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {metrics.score}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={metrics.score ?? 50}
              onChange={handleScoreChange}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
            />
            <p className="text-[9px] text-text-muted leading-normal">
              Applies to Assessment rules using `score` or `score_range` metrics.
            </p>
          </div>

          {/* Assessment Passed status */}
          <div className="flex items-center justify-between bg-slate-50/50 border border-border-main p-2.5 rounded-lg text-xs">
            <div className="flex flex-col">
              <span className="text-text-sub font-semibold">Passed Assessment</span>
              <span className="text-[9px] text-text-muted">Is the assessment passed?</span>
            </div>
            <input
              type="checkbox"
              checked={metrics.passed ?? true}
              onChange={handlePassedChange}
              className="w-4 h-4 rounded text-amber-650 focus:ring-amber-500 border-slate-300 bg-white cursor-pointer"
            />
          </div>

          {/* Unit Completion status */}
          <div className="flex items-center justify-between bg-slate-50/50 border border-border-main p-2.5 rounded-lg text-xs">
            <div className="flex flex-col">
              <span className="text-text-sub font-semibold">Completed Unit</span>
              <span className="text-[9px] text-text-muted font-normal">Is the remedial unit complete?</span>
            </div>
            <input
              type="checkbox"
              checked={metrics.completion ?? true}
              onChange={handleCompletionChange}
              className="w-4 h-4 rounded text-amber-650 focus:ring-amber-500 border-slate-300 bg-white cursor-pointer"
            />
          </div>
        </div>

        {/* 3. SIMULATOR ACTIONS & OUTPUT */}
        {currentNode?.type !== 'end' && (
          <div className="space-y-2">
            <button
              onClick={stepSimulation}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-amber-600/10 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>Evaluate Next Step</span>
            </button>
          </div>
        )}

        {/* Evaluation Error Warnings */}
        {evaluationError && (
          <div className="flex gap-2 bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl text-[11px] leading-normal font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{evaluationError}</span>
          </div>
        )}

        {/* 4. VISITED TIMELINE */}
        <div className="space-y-3">
          <span className="text-[10px] text-text-muted font-bold tracking-wider uppercase block border-b border-border-main pb-1.5">
            Step Timeline
          </span>

          <div className="space-y-1 relative pl-4 before:content-[''] before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {visitedNodeIds.map((vId, idx) => {
              const node = activePath.nodes.find((n) => n.id === vId);
              if (!node) return null;
              const isLast = idx === visitedNodeIds.length - 1;

              return (
                <div key={`${vId}-${idx}`} className="flex items-center gap-2.5 py-1 text-xs relative">
                  {/* Timeline point */}
                  <div className={`w-3.5 h-3.5 rounded-full border border-white flex items-center justify-center absolute left-[-14.5px] z-10 ${
                    isLast 
                      ? 'bg-amber-500 ring-2 ring-amber-500/20' 
                      : 'bg-slate-300'
                  }`}>
                    {isLast && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                  </div>

                  <span className={`text-[11px] font-semibold truncate ${
                    isLast ? 'text-text-main font-bold' : 'text-text-muted'
                  }`}>
                    {node.label}
                  </span>
                  
                  {isLast && (
                    <span className="text-[8px] bg-amber-50 border border-amber-200 text-amber-700 font-bold px-1 py-0.5 rounded leading-none ml-auto shrink-0">
                      Active
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </aside>
  );
};
