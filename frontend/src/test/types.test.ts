/**
 * Pure type / model utility tests.
 *
 * Verifies that the TypeScript types enforce the correct shapes and that
 * the fixture factory helpers produce valid instances.
 */
import { describe, it, expect } from 'vitest';
import { makePath, makeNode, makeEdge, makeComponent } from './fixtures';

describe('fixtures', () => {
  describe('makeNode', () => {
    it('returns a node with required fields', () => {
      const node = makeNode();
      expect(node).toHaveProperty('id');
      expect(node).toHaveProperty('type');
      expect(node).toHaveProperty('label');
      expect(node).toHaveProperty('position');
      expect(node.position).toHaveProperty('x');
      expect(node.position).toHaveProperty('y');
    });

    it('respects overrides', () => {
      const node = makeNode({ type: 'assessment', label: 'Custom' });
      expect(node.type).toBe('assessment');
      expect(node.label).toBe('Custom');
    });
  });

  describe('makeEdge', () => {
    it('returns an edge with required fields', () => {
      const edge = makeEdge();
      expect(edge).toHaveProperty('id');
      expect(edge).toHaveProperty('sourceNodeId');
      expect(edge).toHaveProperty('targetNodeId');
      expect(edge).toHaveProperty('conditions');
      expect(edge.conditions).toHaveProperty('operator');
      expect(edge.conditions).toHaveProperty('rules');
    });

    it('defaults to AND operator with no rules', () => {
      const edge = makeEdge();
      expect(edge.conditions.operator).toBe('AND');
      expect(edge.conditions.rules).toHaveLength(0);
    });
  });

  describe('makePath', () => {
    it('returns a path with start and end nodes by default', () => {
      const path = makePath();
      const types = path.nodes.map((n) => n.type);
      expect(types).toContain('start');
      expect(types).toContain('end');
    });

    it('has empty edges by default', () => {
      const path = makePath();
      expect(path.edges).toHaveLength(0);
    });

    it('respects node overrides', () => {
      const customNodes = [makeNode({ id: 'n1', type: 'unit', label: 'Only Node' })];
      const path = makePath({ nodes: customNodes });
      expect(path.nodes).toHaveLength(1);
      expect(path.nodes[0].id).toBe('n1');
    });
  });

  describe('makeComponent', () => {
    it('returns a component with required fields', () => {
      const comp = makeComponent();
      expect(comp).toHaveProperty('id');
      expect(comp).toHaveProperty('title');
      expect(comp).toHaveProperty('type');
      expect(comp).toHaveProperty('approximateDurationMinutes');
      expect(['unit', 'assessment']).toContain(comp.type);
    });
  });
});

// ─── Edge condition / ConditionRule shape tests ───────────────────────────────
describe('ConditionRule', () => {
  it('makeEdge accepts between range rules', () => {
    const edge = makeEdge({
      conditions: {
        operator: 'AND',
        rules: [
          {
            id: 'r1',
            sourceType: 'assessment',
            sourceNodeId: 'node-1',
            metric: 'score_range',
            operator: 'between',
            range: { min: 0, max: 49, minInclusive: true, maxInclusive: true },
          },
        ],
      },
    });
    expect(edge.conditions.rules[0].operator).toBe('between');
    expect(edge.conditions.rules[0].range?.max).toBe(49);
  });

  it('makeEdge accepts eq boolean rules', () => {
    const edge = makeEdge({
      conditions: {
        operator: 'AND',
        rules: [
          {
            id: 'r2',
            sourceType: 'assessment',
            sourceNodeId: 'node-1',
            metric: 'passed',
            operator: 'eq',
            value: true,
          },
        ],
      },
    });
    expect(edge.conditions.rules[0].value).toBe(true);
  });
});
