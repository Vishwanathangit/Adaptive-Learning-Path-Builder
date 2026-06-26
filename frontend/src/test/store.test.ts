/**
 * useStore — unit tests for all synchronous store actions.
 *
 * Strategy: reset the store before each test, then exercise one
 * action at a time and assert the resulting state slice.
 * Async actions (loadComponents, saveActivePath, …) are tested
 * separately in store.async.test.ts with vi.mock on the api module.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store/useStore';
import { makePath, makeNode, makeEdge } from './fixtures';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Reset store to a clean slate between every test */
const resetStore = () =>
  useStore.setState({
    components: [],
    learningPaths: [],
    activePath: null,
    selectedNodeId: null,
    selectedEdgeId: null,
    isDirty: false,
    isLoading: false,
    error: null,
    isSimulating: false,
    simulationState: {
      currentNodeId: null,
      metrics: { score: 50, score_range: 50, passed: true, completion: true },
      visitedNodeIds: [],
      evaluationError: null,
    },
  });

// ─── createNewPath ─────────────────────────────────────────────────────────────
describe('createNewPath', () => {
  beforeEach(resetStore);

  it('sets an activePath with start and end nodes', () => {
    useStore.getState().createNewPath();
    const { activePath } = useStore.getState();

    expect(activePath).not.toBeNull();
    expect(activePath!.name).toBe('Untitled Learning Path');
    expect(activePath!.status).toBe('draft');

    const nodeTypes = activePath!.nodes.map((n) => n.type);
    expect(nodeTypes).toContain('start');
    expect(nodeTypes).toContain('end');
  });

  it('marks the store as dirty', () => {
    useStore.getState().createNewPath();
    expect(useStore.getState().isDirty).toBe(true);
  });

  it('clears any previous selection', () => {
    useStore.setState({ selectedNodeId: 'old', selectedEdgeId: 'old-edge' });
    useStore.getState().createNewPath();
    const { selectedNodeId, selectedEdgeId } = useStore.getState();
    expect(selectedNodeId).toBeNull();
    expect(selectedEdgeId).toBeNull();
  });

  it('stops simulation when creating a new path', () => {
    useStore.setState({ isSimulating: true });
    useStore.getState().createNewPath();
    expect(useStore.getState().isSimulating).toBe(false);
  });
});

// ─── addNode ──────────────────────────────────────────────────────────────────
describe('addNode', () => {
  beforeEach(() => {
    resetStore();
    useStore.setState({ activePath: makePath() });
  });

  it('appends a node to activePath.nodes', () => {
    const before = useStore.getState().activePath!.nodes.length;
    useStore.getState().addNode({ type: 'unit', label: 'New Unit', position: { x: 0, y: 0 }, componentId: null });
    const after = useStore.getState().activePath!.nodes.length;
    expect(after).toBe(before + 1);
  });

  it('generates a non-empty id for each new node', () => {
    useStore.getState().addNode({ type: 'unit', label: 'A', position: { x: 0, y: 0 }, componentId: null });
    useStore.getState().addNode({ type: 'unit', label: 'B', position: { x: 0, y: 0 }, componentId: null });
    const nodes = useStore.getState().activePath!.nodes.filter((n) => n.type === 'unit');
    nodes.forEach((n) => expect(n.id).toBeTruthy());
    expect(nodes.length).toBeGreaterThanOrEqual(2);
  });

  it('auto-selects the newly added node', () => {
    useStore.getState().addNode({ type: 'unit', label: 'Auto-select', position: { x: 0, y: 0 }, componentId: null });
    const { activePath, selectedNodeId } = useStore.getState();
    const lastNode = activePath!.nodes.at(-1)!;
    expect(selectedNodeId).toBe(lastNode.id);
  });

  it('does nothing when there is no activePath', () => {
    useStore.setState({ activePath: null });
    useStore.getState().addNode({ type: 'unit', label: 'X', position: { x: 0, y: 0 }, componentId: null });
    expect(useStore.getState().activePath).toBeNull();
  });
});

// ─── deleteNode ───────────────────────────────────────────────────────────────
describe('deleteNode', () => {
  beforeEach(() => {
    resetStore();
    const node = makeNode({ id: 'node-unit-1', type: 'unit' });
    const path = makePath({ nodes: [makeNode({ id: 'node-start', type: 'start' }), makeNode({ id: 'node-end', type: 'end' }), node] });
    useStore.setState({ activePath: path, selectedNodeId: 'node-unit-1' });
  });

  it('removes the node from the canvas', () => {
    useStore.getState().deleteNode('node-unit-1');
    const ids = useStore.getState().activePath!.nodes.map((n) => n.id);
    expect(ids).not.toContain('node-unit-1');
  });

  it('also removes edges connected to the deleted node', () => {
    const edge = makeEdge({ id: 'e1', sourceNodeId: 'node-start', targetNodeId: 'node-unit-1' });
    useStore.setState((s) => ({ activePath: { ...s.activePath!, edges: [edge] } }));
    useStore.getState().deleteNode('node-unit-1');
    expect(useStore.getState().activePath!.edges).toHaveLength(0);
  });

  it('clears selectedNodeId when deleting the currently selected node', () => {
    useStore.getState().deleteNode('node-unit-1');
    expect(useStore.getState().selectedNodeId).toBeNull();
  });

  it('does NOT delete start/end nodes', () => {
    useStore.getState().deleteNode('node-start');
    useStore.getState().deleteNode('node-end');
    const ids = useStore.getState().activePath!.nodes.map((n) => n.id);
    expect(ids).toContain('node-start');
    expect(ids).toContain('node-end');
  });
});

// ─── updateNodeLabel ──────────────────────────────────────────────────────────
describe('updateNodeLabel', () => {
  beforeEach(() => {
    resetStore();
    const path = makePath({ nodes: [makeNode({ id: 'node-1', label: 'Old Label' })] });
    useStore.setState({ activePath: path });
  });

  it('updates the label of the target node', () => {
    useStore.getState().updateNodeLabel('node-1', 'New Label');
    const node = useStore.getState().activePath!.nodes.find((n) => n.id === 'node-1');
    expect(node?.label).toBe('New Label');
  });

  it('marks the store as dirty', () => {
    useStore.setState({ isDirty: false });
    useStore.getState().updateNodeLabel('node-1', 'Changed');
    expect(useStore.getState().isDirty).toBe(true);
  });
});

// ─── updateNodePosition ───────────────────────────────────────────────────────
describe('updateNodePosition', () => {
  beforeEach(() => {
    resetStore();
    const path = makePath({ nodes: [makeNode({ id: 'node-1', position: { x: 0, y: 0 } })] });
    useStore.setState({ activePath: path });
  });

  it('updates the position of the target node', () => {
    useStore.getState().updateNodePosition('node-1', { x: 250, y: 350 });
    const node = useStore.getState().activePath!.nodes.find((n) => n.id === 'node-1');
    expect(node?.position).toEqual({ x: 250, y: 350 });
  });
});

// ─── addEdge ──────────────────────────────────────────────────────────────────
describe('addEdge', () => {
  beforeEach(() => {
    resetStore();
    const path = makePath({
      nodes: [
        makeNode({ id: 'node-start', type: 'start' }),
        makeNode({ id: 'node-unit', type: 'unit' }),
        makeNode({ id: 'node-end', type: 'end' }),
      ],
    });
    useStore.setState({ activePath: path });
  });

  it('adds a new edge to the path', () => {
    useStore.getState().addEdge({ sourceNodeId: 'node-start', targetNodeId: 'node-unit', isDefault: true, priority: 1, conditions: { operator: 'AND', rules: [] } });
    expect(useStore.getState().activePath!.edges).toHaveLength(1);
  });

  it('returns false and does not add a self-loop edge', () => {
    const result = useStore.getState().addEdge({ sourceNodeId: 'node-start', targetNodeId: 'node-start', isDefault: true, priority: 1, conditions: { operator: 'AND', rules: [] } });
    expect(result).toBe(false);
    expect(useStore.getState().activePath!.edges).toHaveLength(0);
  });

  it('returns false and does not add a duplicate edge', () => {
    const edgeSpec = { sourceNodeId: 'node-start', targetNodeId: 'node-unit', isDefault: true, priority: 1, conditions: { operator: 'AND' as const, rules: [] } };
    useStore.getState().addEdge(edgeSpec);
    const result = useStore.getState().addEdge(edgeSpec);
    expect(result).toBe(false);
    expect(useStore.getState().activePath!.edges).toHaveLength(1);
  });

  it('assigns non-empty ids to each edge', () => {
    useStore.getState().addEdge({ sourceNodeId: 'node-start', targetNodeId: 'node-unit', isDefault: true, priority: 1, conditions: { operator: 'AND', rules: [] } });
    useStore.getState().addEdge({ sourceNodeId: 'node-unit', targetNodeId: 'node-end', isDefault: true, priority: 1, conditions: { operator: 'AND', rules: [] } });
    const edges = useStore.getState().activePath!.edges;
    expect(edges.length).toBeGreaterThanOrEqual(2);
    edges.forEach((e) => expect(e.id).toBeTruthy());
  });
});

// ─── deleteEdge ───────────────────────────────────────────────────────────────
describe('deleteEdge', () => {
  beforeEach(() => {
    resetStore();
    const edge = makeEdge({ id: 'edge-1' });
    const path = makePath({ edges: [edge] });
    useStore.setState({ activePath: path, selectedEdgeId: 'edge-1' });
  });

  it('removes the edge from the path', () => {
    useStore.getState().deleteEdge('edge-1');
    expect(useStore.getState().activePath!.edges).toHaveLength(0);
  });

  it('clears selectedEdgeId when deleting the selected edge', () => {
    useStore.getState().deleteEdge('edge-1');
    expect(useStore.getState().selectedEdgeId).toBeNull();
  });
});

// ─── selectNode / selectEdge / clearSelection ─────────────────────────────────
describe('selection actions', () => {
  beforeEach(resetStore);

  it('selectNode sets selectedNodeId and clears selectedEdgeId', () => {
    useStore.setState({ selectedEdgeId: 'edge-x' });
    useStore.getState().selectNode('node-abc');
    expect(useStore.getState().selectedNodeId).toBe('node-abc');
    expect(useStore.getState().selectedEdgeId).toBeNull();
  });

  it('selectEdge sets selectedEdgeId and clears selectedNodeId', () => {
    useStore.setState({ selectedNodeId: 'node-x' });
    useStore.getState().selectEdge('edge-abc');
    expect(useStore.getState().selectedEdgeId).toBe('edge-abc');
    expect(useStore.getState().selectedNodeId).toBeNull();
  });

  it('clearSelection clears both', () => {
    useStore.setState({ selectedNodeId: 'n', selectedEdgeId: 'e' });
    useStore.getState().clearSelection();
    expect(useStore.getState().selectedNodeId).toBeNull();
    expect(useStore.getState().selectedEdgeId).toBeNull();
  });
});

// ─── Simulation actions ────────────────────────────────────────────────────────
describe('startSimulation', () => {
  beforeEach(() => {
    resetStore();
    const path = makePath({
      nodes: [
        makeNode({ id: 'node-start', type: 'start' }),
        makeNode({ id: 'node-unit-1', type: 'unit' }),
        makeNode({ id: 'node-end',   type: 'end'   }),
      ],
    });
    useStore.setState({ activePath: path });
  });

  it('sets isSimulating to true', () => {
    useStore.getState().startSimulation();
    expect(useStore.getState().isSimulating).toBe(true);
  });

  it('sets currentNodeId to the start node', () => {
    useStore.getState().startSimulation();
    expect(useStore.getState().simulationState.currentNodeId).toBe('node-start');
  });

  it('adds start node to visitedNodeIds', () => {
    useStore.getState().startSimulation();
    expect(useStore.getState().simulationState.visitedNodeIds).toContain('node-start');
  });
});

describe('stopSimulation', () => {
  beforeEach(() => {
    resetStore();
    useStore.setState({ isSimulating: true });
  });

  it('sets isSimulating to false', () => {
    useStore.getState().stopSimulation();
    expect(useStore.getState().isSimulating).toBe(false);
  });

  it('resets visitedNodeIds', () => {
    useStore.setState((s) => ({
      simulationState: { ...s.simulationState, visitedNodeIds: ['a', 'b'] },
    }));
    useStore.getState().stopSimulation();
    expect(useStore.getState().simulationState.visitedNodeIds).toHaveLength(0);
  });
});

describe('setSimulationMetric', () => {
  beforeEach(resetStore);

  it('updates a single metric key', () => {
    useStore.getState().setSimulationMetric('score', 88);
    expect(useStore.getState().simulationState.metrics.score).toBe(88);
  });

  it('does not overwrite other metric keys', () => {
    useStore.getState().setSimulationMetric('score', 42);
    expect(useStore.getState().simulationState.metrics.passed).toBe(true); // still intact
  });
});

// ─── setActivePathField ───────────────────────────────────────────────────────
describe('setActivePathField', () => {
  beforeEach(() => {
    resetStore();
    useStore.setState({ activePath: makePath({ name: 'Original', description: 'Desc', status: 'draft' }) });
  });

  it('updates the name field', () => {
    useStore.getState().setActivePathField('name', 'Updated Name');
    expect(useStore.getState().activePath!.name).toBe('Updated Name');
  });

  it('updates the status field', () => {
    useStore.getState().setActivePathField('status', 'published');
    expect(useStore.getState().activePath!.status).toBe('published');
  });

  it('marks the store as dirty', () => {
    useStore.setState({ isDirty: false });
    useStore.getState().setActivePathField('description', 'New desc');
    expect(useStore.getState().isDirty).toBe(true);
  });
});
