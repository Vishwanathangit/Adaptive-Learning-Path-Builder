/**
 * Test helpers & shared fixtures used across all test files.
 */
import type { LearningPath, LearningComponent, CanvasNode, CanvasEdge } from '../types';

// ─── Fixture Factories ───────────────────────────────────────────────────────

export const makeNode = (overrides: Partial<CanvasNode> = {}): CanvasNode => ({
  id: `node-${Math.random().toString(36).slice(2, 7)}`,
  type: 'unit',
  label: 'Test Node',
  position: { x: 100, y: 100 },
  componentId: null,
  ...overrides,
});

export const makeEdge = (overrides: Partial<CanvasEdge> = {}): CanvasEdge => ({
  id: `edge-${Math.random().toString(36).slice(2, 7)}`,
  sourceNodeId: 'node-start',
  targetNodeId: 'node-end',
  isDefault: true,
  priority: 1,
  conditions: { operator: 'AND', rules: [] },
  ...overrides,
});

export const makePath = (overrides: Partial<LearningPath> = {}): LearningPath => ({
  id: 'lp-test-001',
  name: 'Test Learning Path',
  description: 'A test path',
  status: 'draft',
  version: 1,
  canvas: { zoom: 1, offsetX: 0, offsetY: 0 },
  nodes: [
    makeNode({ id: 'node-start', type: 'start', label: 'Start' }),
    makeNode({ id: 'node-end',   type: 'end',   label: 'End'   }),
  ],
  edges: [],
  ...overrides,
});

export const makeComponent = (overrides: Partial<LearningComponent> = {}): LearningComponent => ({
  id: 'cmp-001',
  title: 'Sample Component',
  shortDescription: 'A short description',
  type: 'unit',
  approximateDurationMinutes: 30,
  metadata: { unit: { recommendedMinutes: 30 } },
  ...overrides,
});
