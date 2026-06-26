/**
 * Navbar — render & interaction tests.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from '../components/Navbar';
import { useStore } from '../store/useStore';

// Stub the store so Navbar gets controlled state
vi.mock('../store/useStore', () => ({
  useStore: vi.fn(),
}));
const mockUseStore = useStore as unknown as ReturnType<typeof vi.fn>;

const baseStore = {
  activePath: null,
  isDirty: false,
  isSimulating: false,
  isLoading: false,
  saveActivePath: vi.fn(),
  createNewPath: vi.fn(),
  startSimulation: vi.fn(),
  stopSimulation: vi.fn(),
};

describe('Navbar', () => {
  it('renders the application title', () => {
    mockUseStore.mockReturnValue(baseStore);
    render(<Navbar onOpenLoadModal={vi.fn()} />);
    expect(screen.getByText(/Adaptive Learning/i)).toBeInTheDocument();
  });

  it('renders an "Open Path" button', () => {
    mockUseStore.mockReturnValue(baseStore);
    render(<Navbar onOpenLoadModal={vi.fn()} />);
    expect(screen.getByRole('button', { name: /open path/i })).toBeInTheDocument();
  });

  it('calls onOpenLoadModal when the Open Path button is clicked', () => {
    const handler = vi.fn();
    mockUseStore.mockReturnValue(baseStore);
    render(<Navbar onOpenLoadModal={handler} />);
    fireEvent.click(screen.getByRole('button', { name: /open path/i }));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('shows a "Save Draft" button when activePath is set and dirty', () => {
    mockUseStore.mockReturnValue({
      ...baseStore,
      activePath: { id: 'lp-1', name: 'My Path', status: 'draft', nodes: [], edges: [], canvas: { zoom: 1, offsetX: 0, offsetY: 0 } },
      isDirty: true,
    });
    render(<Navbar onOpenLoadModal={vi.fn()} />);
    expect(screen.getByRole('button', { name: /save draft/i })).toBeInTheDocument();
  });

  it('calls saveActivePath when Save Draft is clicked', () => {
    const saveFn = vi.fn();
    mockUseStore.mockReturnValue({
      ...baseStore,
      activePath: { id: 'lp-1', name: 'My Path', status: 'draft', nodes: [], edges: [], canvas: { zoom: 1, offsetX: 0, offsetY: 0 } },
      isDirty: true,
      saveActivePath: saveFn,
    });
    render(<Navbar onOpenLoadModal={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /save draft/i }));
    expect(saveFn).toHaveBeenCalledOnce();
  });
});
