import { render, screen, waitFor } from '@testing-library/react'
import WatchlistPage from '../page'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/app/watchlist',
    query: {},
    asPath: '/app/watchlist',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/app/watchlist',
}))

global.fetch = jest.fn()

describe('WatchlistPage', () => {
  const mockWatchlist = [
    {
      event: {
        id: 'event-1',
        name: 'テストイベント1',
        description: 'テスト説明1',
        event_date: '2024-12-31T10:00:00Z',
        event_end_date: null,
        is_multi_day: false,
        keywords: ['痛車'],
        official_urls: ['https://example.com/event1'],
        image_url: null,
        approval_status: 'APPROVED',
        entries: [],
        tags: [],
      },
      followed_at: '2024-01-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('ローディング状態を表示する', () => {
    ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

    render(<WatchlistPage />)
    expect(screen.getByLabelText('読み込み中')).toBeInTheDocument()
  })

  it('ウォッチリストが空の場合、空のメッセージを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<WatchlistPage />)

    await waitFor(() => {
      expect(
        screen.getByText(/ウォッチリストに追加されたイベントはありません/)
      ).toBeInTheDocument()
    })
  })

  it('ウォッチリストのイベントを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockWatchlist,
    })

    render(<WatchlistPage />)

    await waitFor(() => {
      expect(screen.getByText('テストイベント1')).toBeInTheDocument()
    })
  })
})
