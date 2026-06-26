/**
 * PathListModal — render & interaction tests.
 *
 * Tests: renders list of paths, delete confirmation flow (no browser alert),
 * toast on success, loading state, and empty state.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { PathListModal } from '../components/PathListModal';
import { useStore } from '../store/useStore';

vi.mock('../store/useStore', () => ({ useStore: vi.fn() }));
const mockUseStore = useStore as unknown as ReturnType<typeof vi.fn>;

const basePath = {
  id: 'lp-1',
  name: 'My Learning Path',
  description: 'Some description',
  status: 'draft' as const,
  version: 1,
  canvas: { zoom: 1, offsetX: 0, offsetY: 0 },
  nodes: [],
  edges: [],
};

const buildStore = (overrides = {}) => ({
  learningPaths: [basePath],
  isLoading: false,
  activePath: null,
  loadLearningPaths: vi.fn(),
  loadPath: vi.fn(),
  deletePath: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('PathListModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not render when isOpen is false', () => {
    mockUseStore.mockReturnValue(buildStore());
    render(<PathListModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Load Saved Learning Paths')).not.toBeInTheDocument();
  });

  it('renders the modal title when open', () => {
    mockUseStore.mockReturnValue(buildStore());
    render(<PathListModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Load Saved Learning Paths')).toBeInTheDocument();
  });

  it('renders path names in the list', () => {
    mockUseStore.mockReturnValue(buildStore());
    render(<PathListModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('My Learning Path')).toBeInTheDocument();
  });

  it('shows empty state when no paths exist', () => {
    mockUseStore.mockReturnValue(buildStore({ learningPaths: [] }));
    render(<PathListModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/no pathways found/i)).toBeInTheDocument();
  });

  it('shows loading spinner when isLoading is true', () => {
    mockUseStore.mockReturnValue(buildStore({ isLoading: true }));
    render(<PathListModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/loading pathways/i)).toBeInTheDocument();
  });

  it('shows inline confirm row (not browser alert) when delete is clicked', () => {
    mockUseStore.mockReturnValue(buildStore());
    render(<PathListModal isOpen={true} onClose={vi.fn()} />);

    const deleteBtn = screen.getByTitle('Delete Pathway');
    fireEvent.click(deleteBtn);

    // Inline confirm row should appear with Cancel and Delete buttons
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /delete/i }).length).toBeGreaterThan(0);
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });

  it('hides the confirm row when Cancel is clicked', () => {
    mockUseStore.mockReturnValue(buildStore());
    render(<PathListModal isOpen={true} onClose={vi.fn()} />);

    fireEvent.click(screen.getByTitle('Delete Pathway'));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByText(/cannot be undone/i)).not.toBeInTheDocument();
  });

  it('calls deletePath when the confirm Delete button is clicked', async () => {
    const deleteFn = vi.fn().mockResolvedValue(undefined);
    mockUseStore.mockReturnValue(buildStore({ deletePath: deleteFn }));
    render(<PathListModal isOpen={true} onClose={vi.fn()} />);

    // Click the trash icon to open confirm row
    fireEvent.click(screen.getByTitle('Delete Pathway'));

    // The confirm Delete button is the one inside the rose-colored confirm row
    // It has text "Delete" and is inside the inline confirm div (not the trash btn)
    const allDeleteBtns = screen.getAllByText('Delete');
    // Last one is the confirm button
    const confirmBtn = allDeleteBtns[allDeleteBtns.length - 1];
    await act(async () => { fireEvent.click(confirmBtn); });

    expect(deleteFn).toHaveBeenCalledWith('lp-1');
  });

  it('shows a success toast after deletion', async () => {
    const deleteFn = vi.fn().mockResolvedValue(undefined);
    mockUseStore.mockReturnValue(buildStore({ deletePath: deleteFn }));
    render(<PathListModal isOpen={true} onClose={vi.fn()} />);

    fireEvent.click(screen.getByTitle('Delete Pathway'));
    const allDeleteBtns = screen.getAllByText('Delete');
    const confirmBtn = allDeleteBtns[allDeleteBtns.length - 1];

    await act(async () => { fireEvent.click(confirmBtn); });

    await waitFor(() =>
      expect(screen.getByText(/deleted successfully/i)).toBeInTheDocument()
    , { timeout: 3000 });
  });

  it('calls onClose when X button is clicked', () => {
    const closeFn = vi.fn();
    mockUseStore.mockReturnValue(buildStore());
    render(<PathListModal isOpen={true} onClose={closeFn} />);
    // The × close button
    const closeButtons = screen.getAllByRole('button');
    const xBtn = closeButtons.find((b) => b.querySelector('svg'));
    fireEvent.click(xBtn!);
    expect(closeFn).toHaveBeenCalled();
  });

  it('calls loadLearningPaths when the modal opens', () => {
    const loadFn = vi.fn();
    mockUseStore.mockReturnValue(buildStore({ loadLearningPaths: loadFn }));
    render(<PathListModal isOpen={true} onClose={vi.fn()} />);
    expect(loadFn).toHaveBeenCalled();
  });
});
