import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminEventsPage from '../page'

// モック設定
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/admin/events',
    query: {},
    asPath: '/admin/events',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/admin/events',
}))

// グローバルfetchのモック
global.fetch = jest.fn()

describe('AdminEventsPage', () => {
  const mockEvents = [
    {
      id: 'event-1',
      name: 'テストイベント1',
      theme: 'テストテーマ1',
      description: 'テスト説明1',
      event_date: '2024-12-31T10:00:00Z',
      entry_start_at: '2024-11-01T00:00:00Z',
      payment_due_at: '2024-12-15T23:59:59Z',
      approval_status: 'APPROVED',
      created_at: '2024-01-01T00:00:00Z',
      organizer_user: {
        email: 'organizer1@example.com',
      },
    },
    {
      id: 'event-2',
      name: 'テストイベント2',
      theme: null,
      description: null,
      event_date: '2025-01-15T10:00:00Z',
      entry_start_at: null,
      payment_due_at: null,
      approval_status: 'PENDING',
      created_at: '2024-01-02T00:00:00Z',
      organizer_user: null,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
    mockPush.mockClear()
  })

  it('ローディング状態を表示する', () => {
    ;(global.fetch as jest.Mock).mockImplementation(() =>
      new Promise(() => {}) // 解決しないPromiseでローディング状態を維持
    )

    render(<AdminEventsPage />)
    expect(screen.getByLabelText('読み込み中')).toBeInTheDocument()
  })

  it('イベント一覧を表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvents,
    })

    render(<AdminEventsPage />)

    await waitFor(() => {
      expect(screen.getByText('テストイベント1')).toBeInTheDocument()
    })

    expect(screen.getByText('テストイベント2')).toBeInTheDocument()
  })

  it('イベントが空の場合、空のメッセージを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<AdminEventsPage />)

    await waitFor(() => {
      expect(screen.getByText('イベントがありません')).toBeInTheDocument()
    })
  })

  it('ステータスバッジを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvents,
    })

    render(<AdminEventsPage />)

    await waitFor(() => {
      expect(screen.getByText('承認済み')).toBeInTheDocument()
    })

    expect(screen.getByText('承認待ち')).toBeInTheDocument()
  })

  it('ステータスフィルターボタンを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvents,
    })

    render(<AdminEventsPage />)

    await waitFor(() => {
      expect(screen.getByText('すべて')).toBeInTheDocument()
    })

    expect(screen.getByText('下書き')).toBeInTheDocument()
    expect(screen.getAllByText('承認待ち').length).toBeGreaterThan(0) // フィルターボタンとテーブル内のバッジの両方
    expect(screen.getAllByText('承認済み').length).toBeGreaterThan(0) // フィルターボタンとテーブル内のバッジの両方
    expect(screen.getByText('却下')).toBeInTheDocument()
  })

  it('ステータスフィルターを変更すると、フィルターされたイベントを取得する', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [mockEvents[1]], // PENDINGのみ
      })

    const user = userEvent.setup()
    render(<AdminEventsPage />)

    await waitFor(() => {
      expect(screen.getByText('テストイベント1')).toBeInTheDocument()
    })

    // フィルターボタンの「承認待ち」を取得（最初のものはボタン）
    const pendingButtons = screen.getAllByText('承認待ち')
    const pendingFilterButton = pendingButtons.find(btn => btn.tagName === 'BUTTON')
    if (pendingFilterButton) {
      await user.click(pendingFilterButton)
    }

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=PENDING')
      )
    })
  })

  it('検索を実行すると、検索クエリでAPIを呼び出す', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })

    const user = userEvent.setup()
    render(<AdminEventsPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('イベント名で検索...')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('イベント名で検索...')
    await user.type(searchInput, 'テスト')

    // 検索入力が変更されると自動的にAPIが呼ばれる（useEffect）
    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls
      const lastCall = calls[calls.length - 1]
      expect(lastCall[0]).toMatch(/search=.*%E3%83%86%E3%82%B9%E3%83%88/)
    }, { timeout: 2000 })
  })

  it('ソート順を変更すると、ソート順でAPIを呼び出す', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })

    const user = userEvent.setup()
    render(<AdminEventsPage />)

    await waitFor(() => {
      expect(screen.getByText('並び替え:')).toBeInTheDocument()
    })

    const sortSelect = screen.getByDisplayValue('作成日')
    await user.selectOptions(sortSelect, 'event_date')

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sortBy=event_date')
      )
    })
  })

  it('ソート順の昇順/降順を切り替える', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })

    const user = userEvent.setup()
    render(<AdminEventsPage />)

    await waitFor(() => {
      expect(screen.getByText('↓')).toBeInTheDocument() // デフォルトは降順
    })

    const sortOrderButton = screen.getByText('↓')
    await user.click(sortOrderButton)

    await waitFor(() => {
      expect(screen.getByText('↑')).toBeInTheDocument() // 昇順に変更
    })
  })

  it('イベント行をクリックすると、詳細ページに遷移する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvents,
    })

    const user = userEvent.setup()
    render(<AdminEventsPage />)

    await waitFor(() => {
      expect(screen.getByText('テストイベント1')).toBeInTheDocument()
    })

    const eventRow = screen.getByText('テストイベント1').closest('tr')
    if (eventRow) {
      await user.click(eventRow)
    }

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/events/event-1')
    })
  })

  it('新規イベント作成ボタンを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvents,
    })

    render(<AdminEventsPage />)

    await waitFor(() => {
      expect(screen.getByText('+ 新規イベントを作成')).toBeInTheDocument()
    })
  })

  it('新規イベント作成ボタンがリンクになっている', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvents,
    })

    render(<AdminEventsPage />)

    await waitFor(() => {
      const createButton = screen.getByText('+ 新規イベントを作成')
      expect(createButton.closest('a')).toHaveAttribute('href', '/admin/events/new')
    })
  })

  it('エラーが発生した場合、エラーログを出力する', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<AdminEventsPage />)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch events:',
        expect.any(Error)
      )
    })

    consoleErrorSpy.mockRestore()
  })

  it('主催者情報を表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvents,
    })

    render(<AdminEventsPage />)

    await waitFor(() => {
      expect(screen.getByText('organizer1@example.com')).toBeInTheDocument()
    })

    // 主催者がnullの場合は"-"が表示される
    expect(screen.getAllByText('-').length).toBeGreaterThan(0)
  })
})

