import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EventsPage from '../page'

// モック設定
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/events',
    query: {},
    asPath: '/events',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/events',
}))

// グローバルfetchのモック
global.fetch = jest.fn()

describe('EventsPage', () => {
  const mockEvents = [
    {
      id: 'event-1',
      name: 'テストイベント1',
      description: 'テスト説明1',
      event_date: '2024-12-31T10:00:00Z',
      event_end_date: null,
      is_multi_day: false,
      official_urls: ['https://example.com/event1'],
      keywords: ['痛車', 'イベント'],
      image_url: 'https://example.com/image1.jpg',
      approval_status: 'APPROVED',
      entries: [
        {
          entry_number: 1,
          entry_start_at: '2024-11-01T00:00:00Z',
          entry_start_public_at: null,
          entry_deadline_at: '2024-12-01T23:59:59Z',
          payment_due_at: '2024-12-15T23:59:59Z',
          payment_due_public_at: null,
        },
      ],
      tags: [
        { tag: { name: 'タグ1' } },
      ],
    },
    {
      id: 'event-2',
      name: 'テストイベント2',
      description: 'テスト説明2',
      event_date: '2025-01-15T10:00:00Z',
      event_end_date: '2025-01-16T18:00:00Z',
      is_multi_day: true,
      official_urls: [],
      keywords: null,
      image_url: null,
      approval_status: 'APPROVED',
      entries: [],
      tags: [],
    },
  ]

  const mockPagination = {
    currentPage: 1,
    totalPages: 1,
    totalCount: 2,
    limit: 10,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('ローディング状態を表示する', () => {
    ;(global.fetch as jest.Mock).mockImplementation(() =>
      new Promise(() => {}) // 解決しないPromiseでローディング状態を維持
    )

    render(<EventsPage />)
    expect(screen.getByLabelText('読み込み中')).toBeInTheDocument()
  })

  it('イベント一覧を表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        events: mockEvents,
        pagination: mockPagination,
      }),
    })

    render(<EventsPage />)

    await waitFor(() => {
      expect(screen.getByText('テストイベント1')).toBeInTheDocument()
    })

    expect(screen.getByText('テストイベント2')).toBeInTheDocument()
  })

  it('イベントが空の場合、空のメッセージを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        events: [],
        pagination: null,
      }),
    })

    render(<EventsPage />)

    await waitFor(() => {
      expect(screen.getByText('イベントが登録されていません。')).toBeInTheDocument()
    })
  })

  it('検索フォームを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        events: mockEvents,
        pagination: mockPagination,
      }),
    })

    render(<EventsPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('検索')).toBeInTheDocument()
    })

    expect(screen.getByLabelText('表示順')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '検索' })).toBeInTheDocument()
  })

  it('検索を実行すると、検索クエリでAPIを呼び出す', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events: mockEvents,
          pagination: mockPagination,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events: mockEvents,
          pagination: mockPagination,
        }),
      })

    const user = userEvent.setup()
    render(<EventsPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('検索')).toBeInTheDocument()
    })

    const searchInput = screen.getByLabelText('検索')
    await user.type(searchInput, 'テスト')
    await user.click(screen.getByRole('button', { name: '検索' }))

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls
      const lastCall = calls[calls.length - 1]
      expect(lastCall[0]).toMatch(/search=.*%E3%83%86%E3%82%B9%E3%83%88/)
    })
  })

  it('ソート順を変更すると、ソート順でAPIを呼び出す', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events: mockEvents,
          pagination: mockPagination,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events: mockEvents,
          pagination: mockPagination,
        }),
      })

    const user = userEvent.setup()
    render(<EventsPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('表示順')).toBeInTheDocument()
    })

    const sortSelect = screen.getByLabelText('表示順')
    await user.selectOptions(sortSelect, 'desc')

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sortOrder=desc')
      )
    })
  })

  it('ページネーションを表示する（複数ページの場合）', async () => {
    const multiPagePagination = {
      currentPage: 1,
      totalPages: 3,
      totalCount: 25,
      limit: 10,
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        events: mockEvents,
        pagination: multiPagePagination,
      }),
    })

    render(<EventsPage />)

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  it('ページネーションを表示しない（1ページのみの場合）', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        events: mockEvents,
        pagination: mockPagination,
      }),
    })

    render(<EventsPage />)

    await waitFor(() => {
      expect(screen.getByText('テストイベント1')).toBeInTheDocument()
    })

    // ページネーションは表示されない
    expect(screen.queryByText('1')).not.toBeInTheDocument()
  })

  it('検索結果が空の場合、検索結果なしメッセージを表示する', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events: mockEvents,
          pagination: mockPagination,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
            limit: 10,
          },
        }),
      })

    const user = userEvent.setup()
    render(<EventsPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('検索')).toBeInTheDocument()
    })

    const searchInput = screen.getByLabelText('検索')
    await user.clear(searchInput)
    await user.type(searchInput, '存在しないイベント')
    await user.click(screen.getByRole('button', { name: '検索' }))

    await waitFor(() => {
      expect(
        screen.getByText(/検索条件に一致するイベントが見つかりませんでした/)
      ).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('エラーが発生した場合、エラーログを出力する', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<EventsPage />)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch events:',
        expect.any(Error)
      )
    })

    consoleErrorSpy.mockRestore()
  })

  it('イベントカードがリンクになっている', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        events: mockEvents,
        pagination: mockPagination,
      }),
    })

    render(<EventsPage />)

    await waitFor(() => {
      const eventCard = screen.getByText('テストイベント1').closest('a')
      expect(eventCard).toHaveAttribute('href', '/events/event-1')
    })
  })
})

