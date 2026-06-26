/**
 * ComponentSidebar — render & interaction tests.
 *
 * Tests: generic templates, available content list, on-canvas indicator,
 * no-duplicate click behaviour, staggered position, drag disabled when simulating.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentSidebar } from '../components/ComponentSidebar';
import { useStore } from '../store/useStore';
import { makePath, makeComponent } from './fixtures';

vi.mock('../store/useStore', () => ({ useStore: vi.fn() }));
const mockUseStore = useStore as unknown as ReturnType<typeof vi.fn>;

const comp1 = makeComponent({ id: 'cmp-1', title: 'Math Module 1', type: 'unit' });
const comp2 = makeComponent({ id: 'cmp-2', title: 'Advanced Math', type: 'assessment' });

const buildStore = (overrides = {}) => ({
  activePath: makePath(),
  isSimulating: false,
  components: [comp1, comp2],
  addNode: vi.fn(),
  selectNode: vi.fn(),
  ...overrides,
});

describe('ComponentSidebar', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the "Add Components" heading', () => {
    mockUseStore.mockReturnValue(buildStore());
    render(<ComponentSidebar />);
    expect(screen.getByText(/add components/i)).toBeInTheDocument();
  });

  it('renders both generic template cards (Section and Group)', () => {
    mockUseStore.mockReturnValue(buildStore());
    render(<ComponentSidebar />);
    expect(screen.getByText('Section')).toBeInTheDocument();
    expect(screen.getByText('Group')).toBeInTheDocument();
  });

  it('renders available content from the API', () => {
    mockUseStore.mockReturnValue(buildStore());
    render(<ComponentSidebar />);
    expect(screen.getByText('Math Module 1')).toBeInTheDocument();
    expect(screen.getByText('Advanced Math')).toBeInTheDocument();
  });

  it('shows empty-content message when components list is empty', () => {
    mockUseStore.mockReturnValue(buildStore({ components: [] }));
    render(<ComponentSidebar />);
    expect(screen.getByText(/no available content/i)).toBeInTheDocument();
  });

  it('calls addNode when clicking Section template', () => {
    const addFn = vi.fn();
    mockUseStore.mockReturnValue(buildStore({ addNode: addFn }));
    render(<ComponentSidebar />);
    fireEvent.click(screen.getByText('Section').closest('div')!);
    expect(addFn).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'unit', label: 'New Section' })
    );
  });

  it('calls addNode when clicking Group template', () => {
    const addFn = vi.fn();
    mockUseStore.mockReturnValue(buildStore({ addNode: addFn }));
    render(<ComponentSidebar />);
    fireEvent.click(screen.getByText('Group').closest('div')!);
    expect(addFn).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'assessment', label: 'New Group' })
    );
  });

  it('calls addNode with componentId when clicking an API component not on canvas', () => {
    const addFn = vi.fn();
    mockUseStore.mockReturnValue(buildStore({ addNode: addFn }));
    render(<ComponentSidebar />);
    fireEvent.click(screen.getByText('Math Module 1').closest('div')!);
    expect(addFn).toHaveBeenCalledWith(
      expect.objectContaining({ componentId: 'cmp-1', label: 'Math Module 1' })
    );
  });

  it('calls selectNode (not addNode) when clicking a component already on the canvas', () => {
    const addFn    = vi.fn();
    const selectFn = vi.fn();
    const pathWithNode = makePath({
      nodes: [
        { id: 'node-start', type: 'start',  label: 'Start',  position: { x: 0, y: 0 }, componentId: null },
        { id: 'node-end',   type: 'end',    label: 'End',    position: { x: 0, y: 200 }, componentId: null },
        { id: 'node-cmp1',  type: 'unit',   label: 'Math',   position: { x: 0, y: 100 }, componentId: 'cmp-1' },
      ],
    });
    mockUseStore.mockReturnValue(buildStore({ addNode: addFn, selectNode: selectFn, activePath: pathWithNode }));
    render(<ComponentSidebar />);
    fireEvent.click(screen.getByText('Math Module 1').closest('div')!);
    expect(addFn).not.toHaveBeenCalled();
    expect(selectFn).toHaveBeenCalledWith('node-cmp1');
  });

  it('shows "On canvas" indicator for components already on the canvas', () => {
    const pathWithNode = makePath({
      nodes: [
        { id: 'node-start', type: 'start', label: 'Start', position: { x: 0, y: 0 }, componentId: null },
        { id: 'node-end',   type: 'end',   label: 'End',   position: { x: 0, y: 200 }, componentId: null },
        { id: 'node-cmp1',  type: 'unit',  label: 'Math',  position: { x: 0, y: 100 }, componentId: 'cmp-1' },
      ],
    });
    mockUseStore.mockReturnValue(buildStore({ activePath: pathWithNode }));
    render(<ComponentSidebar />);
    expect(screen.getByText(/on canvas/i)).toBeInTheDocument();
  });

  it('places nodes at staggered positions (not all at same x,y)', () => {
    const addFn = vi.fn();
    // Path already has 2 content nodes so next position should differ
    const pathWith2 = makePath({
      nodes: [
        { id: 'node-start', type: 'start', label: 'S', position: { x: 0, y: 0 }, componentId: null },
        { id: 'node-end',   type: 'end',   label: 'E', position: { x: 0, y: 300 }, componentId: null },
        { id: 'node-u1',    type: 'unit',  label: 'U1', position: { x: 260, y: 180 }, componentId: null },
        { id: 'node-u2',    type: 'unit',  label: 'U2', position: { x: 560, y: 180 }, componentId: null },
      ],
    });
    mockUseStore.mockReturnValue(buildStore({ addNode: addFn, activePath: pathWith2 }));
    render(<ComponentSidebar />);
    // Add two components from sidebar
    fireEvent.click(screen.getByText('Math Module 1').closest('div')!);
    const calledWith = addFn.mock.calls[0][0];
    // Third content node: col=2, row=0 → x = 260 + 2*300 = 860
    expect(calledWith.position.x).toBe(860);
  });

  it('disables interaction when isSimulating is true', () => {
    mockUseStore.mockReturnValue(buildStore({ isSimulating: true }));
    render(<ComponentSidebar />);
    // The Section card outer div should have pointer-events-none / opacity class
    // Find by the draggable wrapper — it has data-drag or is the direct parent of the icon+text
    const allCards = document.querySelectorAll('[class*="opacity"]');
    expect(allCards.length).toBeGreaterThan(0);
  });

  it('disables interaction when no activePath', () => {
    mockUseStore.mockReturnValue(buildStore({ activePath: null }));
    render(<ComponentSidebar />);
    const allCards = document.querySelectorAll('[class*="opacity"]');
    expect(allCards.length).toBeGreaterThan(0);
  });
});
