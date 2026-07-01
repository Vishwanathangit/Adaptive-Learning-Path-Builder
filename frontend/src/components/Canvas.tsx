import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { CanvasNode, CanvasEdge } from '../types';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize,
  Layers
} from 'lucide-react';

export const Canvas: React.FC = () => {
  const {
    activePath,
    selectedNodeId,
    selectedEdgeId,
    isSimulating,
    simulationState,
    updateNodePosition,
    addEdge,
    selectNode,
    selectEdge,
    clearSelection,
    deleteNode  } = useStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Dragging node state
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Connecting edge state
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Handle keys for deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only trigger delete if not typing in an input/textarea
        if (
          document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA' ||
          document.activeElement?.tagName === 'SELECT'
        ) {
          return;
        }
        if (selectedNodeId) {
          deleteNode(selectedNodeId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, deleteNode]);

  if (!activePath) {
    return (
      <div className="grow bg-bg-main flex flex-col items-center justify-center text-center p-6 border-b border-border-main">
        <div className="w-16 h-16 rounded-2xl bg-node-start-bg border border-node-start-border flex items-center justify-center mb-4 text-node-start">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-text-sub">No Learning Path Active</h3>
        <p className="text-xs text-text-muted max-w-sm mt-1 mb-4">Create a new path or load an existing one from the library to start designing visual logic flows.</p>
      </div>
    );
  }

  // Dimension helpers
  const nodeWidth = 260;
  const nodeHeight = 72;

  const getHandleCoordinates = (node: CanvasNode, handleType: 'input' | 'output') => {
    const x = node.position.x;
    const y = node.position.y;
    
    if (node.type === 'start') {
      return { x: x + 200 / 2, y: y + 44 };
    }
    
    if (node.type === 'end') {
      return { x: x + 200 / 2, y: y }; // Top center input
    }

    if (handleType === 'input') {
      return { x: x + nodeWidth / 2, y: y };
    } else {
      return { x: x + nodeWidth / 2, y: y + nodeHeight };
    }
  };

  // Drag and Drop (from sidebar)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!canvasRef.current || isSimulating) return;

    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      if (!data.type) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      // Map client coords to canvas coordinates, accounting for zoom and offset
      const dropX = (clientX - rect.left - offset.x) / zoom;
      const dropY = (clientY - rect.top - offset.y) / zoom;

      // Adjust to place center of card under mouse
      const finalX = Math.round(dropX - nodeWidth / 2);
      const finalY = Math.round(dropY - nodeHeight / 2);

      useStore.getState().addNode({
        type: data.type,
        label: data.label,
        position: { x: finalX, y: finalY },
        componentId: data.componentId
      });
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  // Canvas Panning
  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && e.target === e.currentTarget) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      clearSelection();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    if (draggedNodeId !== null) {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const dropX = (e.clientX - rect.left - offset.x) / zoom;
      const dropY = (e.clientY - rect.top - offset.y) / zoom;
      
      const newX = Math.round(dropX - dragOffset.x);
      const newY = Math.round(dropY - dragOffset.y);
      
      updateNodePosition(draggedNodeId, { x: newX, y: newY });
      return;
    }

    if (connectingNodeId !== null) {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const dropX = (e.clientX - rect.left - offset.x) / zoom;
      const dropY = (e.clientY - rect.top - offset.y) / zoom;
      setMousePos({ x: dropX, y: dropY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
    if (connectingNodeId !== null) {
      setConnectingNodeId(null);
    }
  };

  // Touch Helpers to convert TouchEvent to coordinates
  const getTouchCoords = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return null;
    const touch = e.touches[0];
    return { clientX: touch.clientX, clientY: touch.clientY };
  };

  // Canvas Panning (Touch)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.target === e.currentTarget) {
      const coords = getTouchCoords(e);
      if (!coords) return;
      setIsPanning(true);
      setPanStart({ x: coords.clientX - offset.x, y: coords.clientY - offset.y });
      clearSelection();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const coords = getTouchCoords(e);
    if (!coords) return;

    if (isPanning) {
      if (e.cancelable) e.preventDefault();
      setOffset({
        x: coords.clientX - panStart.x,
        y: coords.clientY - panStart.y
      });
      return;
    }

    if (draggedNodeId !== null) {
      if (e.cancelable) e.preventDefault();
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const dropX = (coords.clientX - rect.left - offset.x) / zoom;
      const dropY = (coords.clientY - rect.top - offset.y) / zoom;
      
      const newX = Math.round(dropX - dragOffset.x);
      const newY = Math.round(dropY - dragOffset.y);
      
      updateNodePosition(draggedNodeId, { x: newX, y: newY });
      return;
    }

    if (connectingNodeId !== null) {
      if (e.cancelable) e.preventDefault();
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const dropX = (coords.clientX - rect.left - offset.x) / zoom;
      const dropY = (coords.clientY - rect.top - offset.y) / zoom;
      setMousePos({ x: dropX, y: dropY });
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
    if (connectingNodeId !== null) {
      setConnectingNodeId(null);
    }
  };

  const handleNodeTouchStart = (e: React.TouchEvent, node: CanvasNode) => {
    if (isSimulating) return;
    e.stopPropagation();
    selectNode(node.id);

    const coords = getTouchCoords(e);
    if (!coords || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseCanvasX = (coords.clientX - rect.left - offset.x) / zoom;
    const mouseCanvasY = (coords.clientY - rect.top - offset.y) / zoom;

    setDraggedNodeId(node.id);
    setDragOffset({
      x: mouseCanvasX - node.position.x,
      y: mouseCanvasY - node.position.y
    });
  };

  const handleConnectStartTouch = (e: React.TouchEvent, node: CanvasNode) => {
    if (isSimulating) return;
    e.stopPropagation();
    setConnectingNodeId(node.id);
    const coords = getHandleCoordinates(node, 'output');
    setMousePos(coords);
  };

  const handleConnectEndTouch = (e: React.TouchEvent, targetNode: CanvasNode) => {
    if (isSimulating) return;
    e.stopPropagation();
    if (connectingNodeId !== null && connectingNodeId !== targetNode.id) {
      addEdge({
        sourceNodeId: connectingNodeId,
        targetNodeId: targetNode.id,
        isDefault: activePath.edges.filter((edge) => edge.sourceNodeId === connectingNodeId).length === 0,
        priority: activePath.edges.filter((edge) => edge.sourceNodeId === connectingNodeId).length + 1,
        conditions: { operator: 'AND', rules: [] }
      });
    }
    setConnectingNodeId(null);
  };

  // Node Drag Start
  const handleNodeMouseDown = (e: React.MouseEvent, node: CanvasNode) => {
    if (isSimulating) return;
    e.stopPropagation();
    selectNode(node.id);

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseCanvasX = (e.clientX - rect.left - offset.x) / zoom;
    const mouseCanvasY = (e.clientY - rect.top - offset.y) / zoom;

    setDraggedNodeId(node.id);
    setDragOffset({
      x: mouseCanvasX - node.position.x,
      y: mouseCanvasY - node.position.y
    });
  };

  // Connection Drag handles
  const handleConnectStart = (e: React.MouseEvent, node: CanvasNode) => {
    if (isSimulating) return;
    e.stopPropagation();
    setConnectingNodeId(node.id);
    const coords = getHandleCoordinates(node, 'output');
    setMousePos(coords);
  };

  const handleConnectEnd = (e: React.MouseEvent, targetNode: CanvasNode) => {
    if (isSimulating) return;
    e.stopPropagation();
    if (connectingNodeId !== null && connectingNodeId !== targetNode.id) {
      // Connect outgoing handle of connectingNodeId to incoming handle of targetNode
      addEdge({
        sourceNodeId: connectingNodeId,
        targetNodeId: targetNode.id,
        isDefault: activePath.edges.filter((edge) => edge.sourceNodeId === connectingNodeId).length === 0,
        priority: activePath.edges.filter((edge) => edge.sourceNodeId === connectingNodeId).length + 1,
        conditions: { operator: 'AND', rules: [] }
      });
    }
    setConnectingNodeId(null);
  };

  // Zoom actions
  const zoomIn = () => setZoom(z => Math.min(z + 0.15, 2.0));
  const zoomOut = () => setZoom(z => Math.max(z - 0.15, 0.5));

  // Edge drawing logic
  const drawBezier = (x1: number, y1: number, x2: number, y2: number) => {
    const cp1x = x1 + (x2 - x1) * 0.45;
    const cp2x = x1 + (x2 - x1) * 0.55;
    return `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`;
  };

  // Check if edge is part of simulation path
  const isEdgeSimVisited = (edge: CanvasEdge) => {
    if (!isSimulating) return false;
    const visited = simulationState.visitedNodeIds;
    // Find index of source
    const srcIndex = visited.indexOf(edge.sourceNodeId);
    if (srcIndex === -1) return false;
    // Target should follow immediately
    return visited[srcIndex + 1] === edge.targetNodeId;
  };

  const hasContentNodes = activePath.nodes.some(n => n.type === 'unit' || n.type === 'assessment');

  return (
    <div
      ref={canvasRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseDown={handleBackgroundMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`grow bg-bg-main overflow-hidden relative cursor-grab active:cursor-grabbing select-none border-b border-border-main ${
        isPanning && 'cursor-grabbing'
      }`}
      style={{
        backgroundImage: `radial-gradient(circle, var(--border-main) 1px, transparent 1px)`,
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${offset.x}px ${offset.y}px`
      }}
    >
      {/* Zoom / Navigation HUD */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
        <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden h-9">
          <button
            onClick={zoomOut}
            className="px-2.5 h-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition border-r border-slate-200"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[13px] font-medium text-slate-600 select-none w-[52px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="px-2.5 h-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition border-l border-slate-200"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(err => console.error(err));
            } else if (document.exitFullscreen) {
              document.exitFullscreen();
            }
          }}
          className="hidden md:flex w-9 h-9 items-center justify-center bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg shadow-sm transition"
          title="Toggle Fullscreen"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* Connection Mode Indicator */}
      {connectingNodeId && (
        <div className="absolute top-4 left-4 bg-node-start-bg/60 backdrop-blur border border-node-start-border text-node-start text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg z-30 animate-pulse">
          Connecting edge... Click destination input handle
        </div>
      )}

      {/* Main Transform Container */}
      <div
        className="absolute inset-0 pointer-events-none origin-top-left"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`
        }}
      >
        {/* SVG Connectors Container */}
        <svg className="w-full h-full absolute inset-0 overflow-visible">
          <defs>
            <marker
              id="arrow-default"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--text-muted)" />
            </marker>
            <marker
              id="arrow-conditional"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#A855F7" />
            </marker>
            <marker
              id="arrow-selected"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--color-rose)" />
            </marker>
            <marker
              id="arrow-sim"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--color-amber)" />
            </marker>
          </defs>

          {/* Render Connections */}
          {activePath.edges.map((edge) => {
            const sourceNode = activePath.nodes.find((n) => n.id === edge.sourceNodeId);
            const targetNode = activePath.nodes.find((n) => n.id === edge.targetNodeId);

            if (!sourceNode || !targetNode) return null;
            if (targetNode.type === 'end' && !hasContentNodes) return null;

            const start = getHandleCoordinates(sourceNode, 'output');
            const end = getHandleCoordinates(targetNode, 'input');
            const dStr = drawBezier(start.x, start.y, end.x, end.y);

            const isSelected = selectedEdgeId === edge.id;
            const isSimActive = isEdgeSimVisited(edge);

            // Progression edges are solid slate; conditional branch edges from Group nodes are dotted purple.
            const isConditionalBranch = !edge.isDefault || sourceNode.type === 'assessment';
            
            let strokeColor = isConditionalBranch ? '#C084FC' : 'var(--text-muted)';
            let strokeWidth = 2.5;
            let strokeDasharray = isConditionalBranch ? '4,4' : 'none';

            if (isSelected) {
              strokeColor = 'var(--color-rose)';
              strokeWidth = 3.5;
            } else if (isSimActive) {
              strokeColor = 'var(--color-amber)';
              strokeWidth = 4.0;
            }

            return (
              <g key={edge.id} className="pointer-events-auto cursor-pointer">
                {/* Thick invisible click handler line */}
                <path
                  d={dStr}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={16}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isSimulating) selectEdge(edge.id);
                  }}
                />
                {/* Visual line */}
                <path
                  d={dStr}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  className={`transition-all duration-200 ${isSimActive && 'animate-[dash_2s_linear_infinite]'} `}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isSimulating) selectEdge(edge.id);
                  }}
                />
                
                {/* Edge Label for Priority or Conditions count */}
                {!edge.isDefault && (
                  <foreignObject
                    x={(start.x + end.x) / 2 - 16}
                    y={(start.y + end.y) / 2 - 10}
                    width={32}
                    height={20}
                    className="overflow-visible pointer-events-none"
                  >
                    <div className={`flex items-center justify-center rounded px-1.5 py-0.5 text-[9px] font-bold border shadow-md ${
                      isSimActive
                        ? 'bg-node-amber-bg text-node-amber border-node-amber-border'
                        : isSelected
                          ? 'bg-node-rose-bg text-node-rose border-node-rose-border'
                          : 'bg-white text-slate-500 border-slate-200'
                    }`}>
                      {edge.priority}
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}

          {/* Render Temp Drag Edge */}
          {connectingNodeId && (
            <path
              d={drawBezier(
                getHandleCoordinates(
                  activePath.nodes.find((n) => n.id === connectingNodeId)!, 
                  'output'
                ).x,
                getHandleCoordinates(
                  activePath.nodes.find((n) => n.id === connectingNodeId)!, 
                  'output'
                ).y,
                mousePos.x,
                mousePos.y
              )}
              fill="none"
              stroke="var(--border-focus)"
              strokeWidth={2}
              strokeDasharray="4,4"
            />
          )}
        </svg>

        {/* HTML Render Cards Container */}
        <div className="absolute inset-0">
          {activePath.nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isSimCurrent = isSimulating && simulationState.currentNodeId === node.id;
            const isSimVisited = isSimulating && simulationState.visitedNodeIds.includes(node.id);

            // Convert types for UI



            if (node.type === 'start') {
              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  onTouchStart={(e) => handleNodeTouchStart(e, node)}
                  className={`absolute bg-[#ECFDF5] border-[1.5px] border-[#10B981] rounded-lg shadow-sm flex items-center px-3 gap-2.5 cursor-grab active:cursor-grabbing select-none pointer-events-auto transition-all duration-150 ${isSelected ? 'ring-2 ring-[#10B981]/20' : ''} ${isSimCurrent ? 'ring-4 ring-[#10B981]/30 shadow-2xl scale-105' : ''}`}
                  style={{
                    width: `200px`,
                    height: `44px`,
                    left: `${node.position.x}px`,
                    top: `${node.position.y}px`,
                  }}
                >
                  <div className="w-[18px] h-[18px] rounded-[4px] bg-[#10B981] flex items-center justify-center shrink-0">
                    <div className="w-[12px] h-[12px] border-[1.5px] border-white rounded-full"></div>
                  </div>
                  <span className="text-[13px] font-medium text-[#065F46] whitespace-nowrap">
                    Start Assessment
                  </span>
                  
                  {/* Bottom Connection Handle */}
                  <div
                    onMouseDown={(e) => handleConnectStart(e, node)}
                    onTouchStart={(e) => handleConnectStartTouch(e, node)}
                    className="absolute left-1/2 bottom-[-5px] -translate-x-1/2 w-[10px] h-[10px] rounded-full border-[1.5px] border-white bg-[#10B981] cursor-crosshair hover:scale-125 transition shadow-sm z-20"
                    title="Drag output connection"
                  />
                </div>
              );
            }

            if (node.type === 'end') {
              if (!hasContentNodes) return null;
              
              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  onTouchStart={(e) => handleNodeTouchStart(e, node)}
                  className={`absolute bg-white border-[1.5px] border-slate-300 rounded-lg shadow-sm flex items-center px-3 gap-2.5 cursor-grab active:cursor-grabbing select-none pointer-events-auto transition-all duration-150 ${isSelected ? 'ring-2 ring-slate-400/20' : ''}`}
                  style={{
                    width: `200px`,
                    height: `44px`,
                    left: `${node.position.x}px`,
                    top: `${node.position.y}px`,
                  }}
                >
                  <div className="w-[18px] h-[18px] rounded-[4px] bg-slate-500 flex items-center justify-center shrink-0">
                    <div className="w-[10px] h-[10px] border-[1.5px] border-white rounded-full flex items-center justify-center">
                      <div className="w-[2.5px] h-[2.5px] bg-white rounded-full"></div>
                    </div>
                  </div>
                  <span className="text-[13px] font-medium text-slate-700 whitespace-nowrap">
                    Complete Assessment
                  </span>
                  
                  {/* Top Connection Handle */}
                  <div
                    onMouseUp={(e) => handleConnectEnd(e, node)}
                    onTouchEnd={(e) => handleConnectEndTouch(e, node)}
                    className="absolute left-1/2 top-[-5px] -translate-x-1/2 w-[10px] h-[10px] rounded-full border-[1.5px] border-white bg-slate-500 cursor-crosshair hover:scale-125 transition shadow-sm z-20"
                    title="Connect input handle"
                  />
                </div>
              );
            }

            const isUnit = node.type === 'unit';
            const isGroup = node.type === 'assessment';
            
            const baseBg = isUnit ? 'bg-[#EFF6FF]' : 'bg-[#FAF5FF]'; 
            const baseBorder = isUnit ? 'border-[#60A5FA]' : 'border-[#C084FC]'; 
            const iconBg = isUnit ? 'bg-[#3B82F6]' : 'bg-[#A855F7]'; 
            const titleColor = isUnit ? 'text-[#1E40AF]' : 'text-[#6B21A8]'; 
            const subtitleColor = isUnit ? 'text-[#64748B]' : 'text-[#9333EA]'; 
            
            const ringColor = isUnit ? 'ring-blue-400' : 'ring-purple-400';
            const selectedStyle = isSelected ? `ring-2 ring-opacity-50 ${ringColor}` : '';
            
            let simStyle = '';
            if (isSimCurrent) {
              simStyle = 'border-node-amber ring-4 ring-node-amber/30 shadow-2xl scale-105';
            } else if (isSimVisited) {
              simStyle = 'opacity-80';
            }

            const cardClasses = `absolute ${baseBg} border-[1.5px] ${baseBorder} rounded-xl shadow-sm flex items-center p-3 gap-3 transition-all duration-150 group select-none pointer-events-auto cursor-grab active:cursor-grabbing ${selectedStyle} ${simStyle}`;

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                onTouchStart={(e) => handleNodeTouchStart(e, node)}
                className={cardClasses}
                style={{
                  width: `${nodeWidth}px`,
                  height: `${nodeHeight}px`,
                  left: `${node.position.x}px`,
                  top: `${node.position.y}px`,
                }}
              >
                {/* Input Connection Handle (Top) */}
                <div
                  onMouseUp={(e) => handleConnectEnd(e, node)}
                  onTouchEnd={(e) => handleConnectEndTouch(e, node)}
                  className={`absolute top-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-[1.5px] border-white ${baseBorder.replace('border-', 'bg-')} flex items-center justify-center cursor-crosshair hover:scale-125 transition shadow-sm z-20`}
                  title="Connect input handle"
                />

                {/* Output Connection Handle (Bottom) */}
                <div
                  onMouseDown={(e) => handleConnectStart(e, node)}
                  onTouchStart={(e) => handleConnectStartTouch(e, node)}
                  className={`absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-[1.5px] border-white ${baseBorder.replace('border-', 'bg-')} flex items-center justify-center cursor-crosshair hover:scale-125 transition shadow-sm z-20`}
                  title="Drag output connection"
                />

                {/* Icon */}
                <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
                  {isUnit ? (
                    <div className="w-[14px] h-[14px] border-2 border-white rounded-[3px]"></div>
                  ) : (
                    <Layers className="w-[18px] h-[18px] text-white" />
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col min-w-0 grow justify-center pt-0.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${titleColor} truncate leading-tight`}>
                      {node.label}
                    </span>
                    {isGroup && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-[#F3E8FF] text-[#9333EA] px-1.5 py-0.5 rounded">
                        Group
                      </span>
                    )}
                    {isSimCurrent && (
                      <span className="flex h-2 w-2 relative shrink-0 ml-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-node-amber opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-node-amber"></span>
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] ${subtitleColor} truncate mt-0.5 leading-tight`}>
                    {isUnit ? '22 questions • 35 minutes' : 'Adaptive based on Module 1 performance'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
