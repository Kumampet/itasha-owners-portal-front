import { render, screen, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import MyPage from '../page'

// モック設定
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/app/mypage',
    query: {},
    asPath: '/app/mypage',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/app/mypage',
}))

jest.mock('next-auth/react')

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// グローバルfetchのモック
global.fetch = jest.fn()

describe('MyPage', () => {
  const mockReminders = [
    {
      id: 'reminder-1',
      event: {
        id: 'event-1',
        name: 'テストイベント1',
        event_date: new Date('2024-12-31'),
        original_url: 'https://example.com',
      },
      type: 'entry_deadline',
      datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24時間後
      label: 'エントリー締切',
      note: 'テストノート',
      notified: false,
      notified_at: null,
      created_at: new Date('2024-01-01'),
    },
    {
      id: 'reminder-2',
      event: {
        id: 'event-2',
        name: 'テストイベント2',
        event_date: new Date('2025-01-15'),
        original_url: null,
      },
      type: 'meeting_time',
      datetime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48時間後
      label: '集合時間',
      note: null,
      notified: true,
      notified_at: new Date('2024-01-02'),
      created_at: new Date('2024-01-01'),
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('ローディング状態を表示する', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    } as ReturnType<typeof useSession>)

    render(<MyPage />)
    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('ユーザー情報を表示する', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'テストユーザー',
          email: 'test@example.com',
          role: 'USER',
          isBanned: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'authenticated',
      update: jest.fn(),
    } as ReturnType<typeof useSession>)

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<MyPage />)

    await waitFor(() => {
      expect(screen.getByText('テストユーザー')).toBeInTheDocument()
    })

    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('ユーザー名のみの場合、メールアドレスを表示しない', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'テストユーザー',
          email: '',
          role: 'USER',
          isBanned: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'authenticated',
      update: jest.fn(),
    } as ReturnType<typeof useSession>)

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<MyPage />)

    await waitFor(() => {
      expect(screen.getByText('テストユーザー')).toBeInTheDocument()
    })

    // メールアドレスが表示されないことを確認（"/"も表示されない）
    expect(screen.queryByText(/test@example.com/)).not.toBeInTheDocument()
  })

  it('未ログインの場合、ユーザー情報を表示しない', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    } as ReturnType<typeof useSession>)

    render(<MyPage />)

    expect(screen.queryByText(/テストユーザー/)).not.toBeInTheDocument()
  })

  it('リマインダーが空の場合、空のメッセージを表示する', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'テストユーザー',
          email: 'test@example.com',
          role: 'USER',
          isBanned: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'authenticated',
      update: jest.fn(),
    } as ReturnType<typeof useSession>)

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<MyPage />)

    await waitFor(() => {
      expect(
        screen.getByText(/直近3日間（72時間）以内のリマインダーはありません/)
      ).toBeInTheDocument()
    })
  })

  it('リマインダー一覧を表示する', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'テストユーザー',
          email: 'test@example.com',
          role: 'USER',
          isBanned: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'authenticated',
      update: jest.fn(),
    } as ReturnType<typeof useSession>)

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockReminders,
    })

    render(<MyPage />)

    await waitFor(() => {
      expect(screen.getByText('エントリー締切')).toBeInTheDocument()
    })

    expect(screen.getByText('集合時間')).toBeInTheDocument()
    expect(screen.getByText('テストイベント1')).toBeInTheDocument()
    expect(screen.getByText('テストイベント2')).toBeInTheDocument()
  })

  it('リマインダーの詳細リンクを表示する', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'テストユーザー',
          email: 'test@example.com',
          role: 'USER',
          isBanned: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'authenticated',
      update: jest.fn(),
    } as ReturnType<typeof useSession>)

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockReminders,
    })

    render(<MyPage />)

    await waitFor(() => {
      const detailLinks = screen.getAllByText('詳細 →')
      expect(detailLinks.length).toBeGreaterThan(0)
    })

    const detailLink = screen.getAllByText('詳細 →')[0]
    expect(detailLink.closest('a')).toHaveAttribute('href', '/events/event-1')
  })

  it('リンクカードを表示する', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'テストユーザー',
          email: 'test@example.com',
          role: 'USER',
          isBanned: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'authenticated',
      update: jest.fn(),
    } as ReturnType<typeof useSession>)

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<MyPage />)

    await waitFor(() => {
      expect(screen.getByText('基本情報')).toBeInTheDocument()
    })

    expect(screen.getByText('ウォッチリスト')).toBeInTheDocument()
    expect(screen.getByText('団体管理')).toBeInTheDocument()
    expect(screen.getByText('リマインダー管理')).toBeInTheDocument()
    expect(screen.getByText('イベント掲載依頼')).toBeInTheDocument()
  })

  it('オーガナイザー権限がある場合、オーガナイザー機能のリンクを表示する', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'テストユーザー',
          email: 'test@example.com',
          role: 'ORGANIZER',
          isBanned: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'authenticated',
      update: jest.fn(),
    } as ReturnType<typeof useSession>)

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<MyPage />)

    await waitFor(() => {
      expect(screen.getByText('オーガナイザー機能')).toBeInTheDocument()
    })

    const organizerLink = screen.getByText('オーガナイザー機能').closest('a')
    expect(organizerLink).toHaveAttribute('href', '/admin/dashboard')
  })

  it('ADMIN権限がある場合、オーガナイザー機能のリンクを表示する', async () => {
    mockUseSession.mockReturnValue({
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
    } as ReturnType<typeof useSession>)

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<MyPage />)

    await waitFor(() => {
      expect(screen.getByText('オーガナイザー機能')).toBeInTheDocument()
    })

    const organizerLink = screen.getByText('オーガナイザー機能').closest('a')
    expect(organizerLink).toHaveAttribute('href', '/admin/dashboard')
  })

  it('一般ユーザーの場合、オーガナイザー機能の説明のみを表示する', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'テストユーザー',
          email: 'test@example.com',
          role: 'USER',
          isBanned: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'authenticated',
      update: jest.fn(),
    } as ReturnType<typeof useSession>)

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<MyPage />)

    await waitFor(() => {
      expect(screen.getByText('オーガナイザー機能')).toBeInTheDocument()
    })

    // リンクではなく、説明のみ
    const organizerCard = screen.getByText('オーガナイザー機能').closest('div')
    expect(organizerCard?.querySelector('a')).not.toBeInTheDocument()
    expect(
      screen.getByText(/ご希望のイベント主催者はお問い合わせフォームから/)
    ).toBeInTheDocument()
  })

  it('リマインダー取得エラーが発生した場合、エラーログを出力する', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'テストユーザー',
          email: 'test@example.com',
          role: 'USER',
          isBanned: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'authenticated',
      update: jest.fn(),
    } as ReturnType<typeof useSession>)

    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<MyPage />)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching reminders:',
        expect.any(Error)
      )
    })

    consoleErrorSpy.mockRestore()
  })

  it('72時間以内のリマインダーのみを表示する', async () => {
    const allReminders = [
      ...mockReminders,
      {
        id: 'reminder-3',
        event: {
          id: 'event-3',
          name: 'テストイベント3',
          event_date: new Date('2025-02-01'),
          original_url: null,
        },
        type: 'entry_deadline',
        datetime: new Date(Date.now() + 80 * 60 * 60 * 1000).toISOString(), // 80時間後（72時間を超える）
        label: '未来のリマインダー',
        note: null,
        notified: false,
        notified_at: null,
        created_at: new Date('2024-01-01'),
      },
    ]

    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'テストユーザー',
          email: 'test@example.com',
          role: 'USER',
          isBanned: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'authenticated',
      update: jest.fn(),
    } as ReturnType<typeof useSession>)

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => allReminders,
    })

    render(<MyPage />)

    await waitFor(() => {
      expect(screen.getByText('エントリー締切')).toBeInTheDocument()
    })

    // 72時間以内のリマインダーのみが表示される
    expect(screen.getByText('集合時間')).toBeInTheDocument()
    // 72時間を超えるリマインダーは表示されない
    expect(screen.queryByText('未来のリマインダー')).not.toBeInTheDocument()
  })
})

