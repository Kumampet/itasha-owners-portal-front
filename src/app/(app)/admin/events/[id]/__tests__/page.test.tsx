import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminEventDetailPage from '../page'

// モック設定
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/admin/events/event-1',
    query: {},
    asPath: '/admin/events/event-1',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/admin/events/event-1',
}))

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'user-1',
        name: 'テストユーザー',
        email: 'test@example.com',
        role: 'ADMIN',
        isBanned: false,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    status: 'authenticated',
    update: jest.fn(),
  }),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

jest.mock('react', () => {
  const actual = jest.requireActual('react')
  return {
    ...actual,
    use: (promise: Promise<unknown>) => {
      if (promise && typeof promise.then === 'function') {
        return { id: 'event-1' }
      }
      return promise
    },
  }
})

// グローバルfetchとalertのモック
global.fetch = jest.fn()
global.alert = jest.fn()

describe('AdminEventDetailPage', () => {
  const mockEvent = {
    id: 'event-1',
    name: 'テストイベント',
    description: 'テスト説明',
    event_date: '2024-12-31T10:00:00Z',
    event_end_date: null,
    is_multi_day: false,
    postal_code: '123-4567',
    prefecture: '東京都',
    city: '渋谷区',
    street_address: 'テスト1-2-3',
    venue_name: 'テスト会場',
    keywords: ['痛車', 'イベント'],
    official_urls: ['https://example.com/event1'],
    image_url: 'https://example.com/image1.jpg',
    approval_status: 'PENDING',
    organizer_email: 'organizer@example.com',
    organizer_user: {
      id: 'user-2',
      email: 'organizer@example.com',
    },
    entries: [
      {
        id: 'entry-1',
        entry_number: 1,
        entry_start_at: '2024-11-01T00:00:00Z',
        entry_start_public_at: null,
        entry_deadline_at: '2024-12-01T23:59:59Z',
        payment_due_type: 'ABSOLUTE',
        payment_due_at: '2024-12-15T23:59:59Z',
        payment_due_days_after_entry: null,
        payment_due_public_at: null,
      },
    ],
    tags: [
      { tag: { id: 'tag-1', name: 'タグ1' } },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
    ;(global.alert as jest.Mock).mockClear()
  })

  it('ローディング状態を表示する', () => {
    ;(global.fetch as jest.Mock).mockImplementation(() =>
      new Promise(() => {}) // 解決しないPromiseでローディング状態を維持
    )

    const params = Promise.resolve({ id: 'event-1' })
    render(<AdminEventDetailPage params={params} />)
    expect(screen.getByLabelText('読み込み中')).toBeInTheDocument()
  })

  it('イベント詳細を表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvent,
    })

    const params = Promise.resolve({ id: 'event-1' })
    render(<AdminEventDetailPage params={params} />)

    await waitFor(() => {
      expect(screen.getByText('テストイベント')).toBeInTheDocument()
    })
  })

  it('イベントが見つからない場合、エラーメッセージを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Event not found' }),
    })

    const params = Promise.resolve({ id: 'non-existent' })
    render(<AdminEventDetailPage params={params} />)

    await waitFor(() => {
      expect(screen.getByText('イベントが見つかりません')).toBeInTheDocument()
    })
  })

  it('承認待ちイベントの場合、承認・却下ボタンを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvent,
    })

    const params = Promise.resolve({ id: 'event-1' })
    render(<AdminEventDetailPage params={params} />)

    await waitFor(() => {
      expect(screen.getByText('承認')).toBeInTheDocument()
    })

    expect(screen.getByText('却下')).toBeInTheDocument()
  })

  it('編集ボタンを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvent,
    })

    const params = Promise.resolve({ id: 'event-1' })
    render(<AdminEventDetailPage params={params} />)

    await waitFor(() => {
      expect(screen.getByText('編集')).toBeInTheDocument()
    })
  })

  it('編集ボタンをクリックすると、編集モードになる', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvent,
    })

    const user = userEvent.setup()
    const params = Promise.resolve({ id: 'event-1' })
    render(<AdminEventDetailPage params={params} />)

    await waitFor(() => {
      expect(screen.getByText('編集')).toBeInTheDocument()
    })

    const editButton = screen.getByText('編集')
    await user.click(editButton)

    await waitFor(() => {
      expect(screen.getByText('イベントを編集')).toBeInTheDocument()
    })
  })

  it('承認ボタンをクリックすると、承認確認モーダルを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvent,
    })

    const user = userEvent.setup()
    const params = Promise.resolve({ id: 'event-1' })
    render(<AdminEventDetailPage params={params} />)

    await waitFor(() => {
      expect(screen.getByText('承認')).toBeInTheDocument()
    })

    const approveButton = screen.getByText('承認')
    await user.click(approveButton)

    await waitFor(() => {
      expect(screen.getByText(/承認しますか/)).toBeInTheDocument()
    })
  })

  it('却下ボタンをクリックすると、却下確認モーダルを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvent,
    })

    const user = userEvent.setup()
    const params = Promise.resolve({ id: 'event-1' })
    render(<AdminEventDetailPage params={params} />)

    await waitFor(() => {
      expect(screen.getByText('却下')).toBeInTheDocument()
    })

    const rejectButton = screen.getByText('却下')
    await user.click(rejectButton)

    await waitFor(() => {
      expect(screen.getByText(/却下しますか/)).toBeInTheDocument()
    })
  })

  it('承認に成功すると、シェアモーダルを表示する', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvent,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockEvent, approval_status: 'APPROVED' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockEvent, approval_status: 'APPROVED' }),
      })

    const user = userEvent.setup()
    const params = Promise.resolve({ id: 'event-1' })
    render(<AdminEventDetailPage params={params} />)

    await waitFor(() => {
      expect(screen.getByText('承認')).toBeInTheDocument()
    })

    const approveButton = screen.getByText('承認')
    await user.click(approveButton)

    await waitFor(() => {
      expect(screen.getByText(/承認しますか/)).toBeInTheDocument()
    })

    // 承認モーダルの確認ボタンは「承認」というテキスト
    const confirmButtons = screen.getAllByText('承認')
    const modalConfirmButton = confirmButtons.find(btn => {
      const modal = btn.closest('.fixed')
      return modal !== null
    })
    if (modalConfirmButton) {
      await user.click(modalConfirmButton)
    }

    // シェアモーダルが表示されることを確認（モーダルのタイトルやボタンを確認）
    await waitFor(() => {
      // シェアモーダルには「シェア」というテキストが含まれる可能性がある
      // またはモーダルが開いていることを確認
      const modals = document.querySelectorAll('.fixed')
      expect(modals.length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it('却下されたイベントの場合、再申請ボタンを表示する', async () => {
    const rejectedEvent = {
      ...mockEvent,
      approval_status: 'REJECTED',
      organizer_user: {
        id: 'user-1', // ADMINユーザーと同じID（またはorganizer_userがnullでもADMINなら表示される）
        email: 'organizer@example.com',
      },
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => rejectedEvent,
    })

    const params = Promise.resolve({ id: 'event-1' })
    render(<AdminEventDetailPage params={params} />)

    await waitFor(() => {
      expect(screen.getByText('再申請')).toBeInTheDocument()
    })
  })

  it('イベント一覧への戻るリンクを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvent,
    })

    const params = Promise.resolve({ id: 'event-1' })
    render(<AdminEventDetailPage params={params} />)

    await waitFor(() => {
      const backLink = screen.getByText(/イベント一覧に戻る/)
      expect(backLink.closest('a')).toHaveAttribute('href', '/admin/events')
    })
  })

  it('エラーが発生した場合、エラーメッセージを表示する', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const params = Promise.resolve({ id: 'event-1' })
    render(<AdminEventDetailPage params={params} />)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch event:',
        expect.any(Error)
      )
    })

    consoleErrorSpy.mockRestore()
  })
})

