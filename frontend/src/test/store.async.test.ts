/**
 * Async store actions — tests for API-integrated actions.
 * The `../api` module is fully mocked so no network calls occur.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStore } from '../store/useStore';
import { makePath, makeComponent } from './fixtures';

// ─── Mock the API module ──────────────────────────────────────────────────────
vi.mock('../api', () => ({
  api: {
    getComponents: vi.fn(),
    getAllLearningPaths: vi.fn(),
    getLearningPath: vi.fn(),
    saveLearningPath: vi.fn(),
    deleteLearningPath: vi.fn(),
    evaluateNextNode: vi.fn(),
  },
}));

import { api } from '../api';
const mockApi = api as unknown as Record<string, ReturnType<typeof vi.fn>>;

// ─── Reset store helper ───────────────────────────────────────────────────────
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

// ─── loadComponents ───────────────────────────────────────────────────────────
describe('loadComponents', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('populates components on success', async () => {
    const comp = makeComponent();
    mockApi.getComponents.mockResolvedValue({ items: [comp], totalCount: 1 });
    await useStore.getState().loadComponents();
    expect(useStore.getState().components).toHaveLength(1);
    expect(useStore.getState().components[0].id).toBe(comp.id);
  });

  it('sets error on failure', async () => {
    mockApi.getComponents.mockRejectedValue(new Error('Network error'));
    await useStore.getState().loadComponents();
    expect(useStore.getState().error).toBe('Network error');
    expect(useStore.getState().isLoading).toBe(false);
  });

  it('sets isLoading to false after success', async () => {
    mockApi.getComponents.mockResolvedValue({ items: [], totalCount: 0 });
    await useStore.getState().loadComponents();
    expect(useStore.getState().isLoading).toBe(false);
  });
});

// ─── loadLearningPaths ────────────────────────────────────────────────────────
describe('loadLearningPaths', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('populates learningPaths on success', async () => {
    const path = makePath();
    mockApi.getAllLearningPaths.mockResolvedValue([path]);
    await useStore.getState().loadLearningPaths();
    expect(useStore.getState().learningPaths).toHaveLength(1);
  });

  it('stores error message on failure', async () => {
    mockApi.getAllLearningPaths.mockRejectedValue(new Error('Server down'));
    await useStore.getState().loadLearningPaths();
    expect(useStore.getState().error).toMatch('Server down');
  });
});

// ─── loadPath ─────────────────────────────────────────────────────────────────
describe('loadPath', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('sets activePath from the API response', async () => {
    const path = makePath({ id: 'lp-loaded' });
    mockApi.getLearningPath.mockResolvedValue(path);
    await useStore.getState().loadPath('lp-loaded');
    expect(useStore.getState().activePath?.id).toBe('lp-loaded');
  });

  it('ensures nodes/edges default to empty arrays if missing from response', async () => {
    const path = { id: 'lp-partial', name: 'Partial', description: '', status: 'draft', canvas: { zoom: 1, offsetX: 0, offsetY: 0 } } as any;
    mockApi.getLearningPath.mockResolvedValue(path);
    await useStore.getState().loadPath('lp-partial');
    const { activePath } = useStore.getState();
    expect(Array.isArray(activePath?.nodes)).toBe(true);
    expect(Array.isArray(activePath?.edges)).toBe(true);
  });

  it('stops simulation on load', async () => {
    useStore.setState({ isSimulating: true });
    mockApi.getLearningPath.mockResolvedValue(makePath());
    await useStore.getState().loadPath('any');
    expect(useStore.getState().isSimulating).toBe(false);
  });
});

// ─── saveActivePath ───────────────────────────────────────────────────────────
describe('saveActivePath', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('saves and updates activePath with backend response', async () => {
    const original = makePath({ id: 'lp-1', name: 'Original' });
    const saved    = makePath({ id: 'lp-1', name: 'Saved by Backend', version: 2 });
    useStore.setState({ activePath: original, isDirty: true });
    mockApi.saveLearningPath.mockResolvedValue(saved);
    await useStore.getState().saveActivePath();
    expect(useStore.getState().activePath?.name).toBe('Saved by Backend');
    expect(useStore.getState().isDirty).toBe(false);
  });

  it('adds the path to learningPaths list when it is new (not in list yet)', async () => {
    const path  = makePath({ id: 'lp-new' });
    const saved = makePath({ id: 'lp-new', name: 'Persisted' });
    useStore.setState({ activePath: path, learningPaths: [] });
    mockApi.saveLearningPath.mockResolvedValue(saved);
    await useStore.getState().saveActivePath();
    expect(useStore.getState().learningPaths).toHaveLength(1);
  });

  it('updates the existing entry in learningPaths instead of duplicating', async () => {
    const path  = makePath({ id: 'lp-exist' });
    const saved = makePath({ id: 'lp-exist', name: 'Updated' });
    useStore.setState({ activePath: path, learningPaths: [makePath({ id: 'lp-exist', name: 'Old' })] });
    mockApi.saveLearningPath.mockResolvedValue(saved);
    await useStore.getState().saveActivePath();
    expect(useStore.getState().learningPaths).toHaveLength(1);
    expect(useStore.getState().learningPaths[0].name).toBe('Updated');
  });

  it('does nothing if there is no activePath', async () => {
    await useStore.getState().saveActivePath();
    expect(mockApi.saveLearningPath).not.toHaveBeenCalled();
  });
});

// ─── deletePath ───────────────────────────────────────────────────────────────
describe('deletePath', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('removes the path from learningPaths', async () => {
    const path = makePath({ id: 'lp-del' });
    useStore.setState({ learningPaths: [path] });
    mockApi.deleteLearningPath.mockResolvedValue(undefined);
    await useStore.getState().deletePath('lp-del');
    expect(useStore.getState().learningPaths).toHaveLength(0);
  });

  it('clears activePath if the deleted path was active', async () => {
    const path = makePath({ id: 'lp-active' });
    useStore.setState({ learningPaths: [path], activePath: path });
    mockApi.deleteLearningPath.mockResolvedValue(undefined);
    await useStore.getState().deletePath('lp-active');
    expect(useStore.getState().activePath).toBeNull();
  });

  it('keeps activePath if a different path was deleted', async () => {
    const active  = makePath({ id: 'lp-keep' });
    const toDelete = makePath({ id: 'lp-del2' });
    useStore.setState({ learningPaths: [active, toDelete], activePath: active });
    mockApi.deleteLearningPath.mockResolvedValue(undefined);
    await useStore.getState().deletePath('lp-del2');
    expect(useStore.getState().activePath?.id).toBe('lp-keep');
  });
});

// ─── stepSimulation ───────────────────────────────────────────────────────────
describe('stepSimulation', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
    const path = makePath({
      nodes: [
        { id: 'node-start', type: 'start',  label: 'Start',  position: { x: 0, y: 0 }, componentId: null },
        { id: 'node-unit',  type: 'unit',   label: 'Unit 1', position: { x: 0, y: 100 }, componentId: null },
        { id: 'node-end',   type: 'end',    label: 'End',    position: { x: 0, y: 200 }, componentId: null },
      ],
    });
    useStore.setState({
      activePath: path,
      isSimulating: true,
      simulationState: {
        currentNodeId: 'node-start',
        metrics: { score: 80, score_range: 80, passed: true, completion: true },
        visitedNodeIds: ['node-start'],
        evaluationError: null,
      },
    });
  });

  it('advances to the next node returned by the API', async () => {
    mockApi.evaluateNextNode.mockResolvedValue({ nextNodeId: 'node-unit' });
    await useStore.getState().stepSimulation();
    expect(useStore.getState().simulationState.currentNodeId).toBe('node-unit');
  });

  it('appends the next node to visitedNodeIds', async () => {
    mockApi.evaluateNextNode.mockResolvedValue({ nextNodeId: 'node-unit' });
    await useStore.getState().stepSimulation();
    expect(useStore.getState().simulationState.visitedNodeIds).toContain('node-unit');
  });

  it('sets evaluationError when no nextNodeId is returned', async () => {
    mockApi.evaluateNextNode.mockResolvedValue({ nextNodeId: null });
    await useStore.getState().stepSimulation();
    expect(useStore.getState().simulationState.evaluationError).toBeTruthy();
  });

  it('sets evaluationError on API failure', async () => {
    mockApi.evaluateNextNode.mockRejectedValue({ response: { data: { message: 'Condition unmet' } } });
    await useStore.getState().stepSimulation();
    expect(useStore.getState().simulationState.evaluationError).toContain('Condition unmet');
  });

  it('does nothing if currentNode is an end node', async () => {
    useStore.setState((s) => ({
      simulationState: { ...s.simulationState!, currentNodeId: 'node-end' },
    }));
    await useStore.getState().stepSimulation();
    expect(mockApi.evaluateNextNode).not.toHaveBeenCalled();
    expect(useStore.getState().simulationState.evaluationError).toMatch(/end/i);
  });
});
