import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReminderPage from '../page'

// モック設定
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/app/reminder',
    query: {},
    asPath: '/app/reminder',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/app/reminder',
}))

// グローバルfetchとalertのモック
global.fetch = jest.fn()
global.alert = jest.fn()

describe('ReminderPage', () => {
  const mockReminders = [
    {
      id: 'reminder-1',
      event: {
        id: 'event-1',
        name: 'テストイベント1',
        theme: 'テストテーマ1',
        event_date: '2024-12-31T10:00:00Z',
        original_url: 'https://example.com/event1',
      },
      type: 'entry_deadline',
      datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24時間後
      label: 'エントリー締切',
      notified: false,
      notified_at: null,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'reminder-2',
      event: null,
      type: 'custom',
      datetime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24時間前
      label: '過去のリマインダー',
      notified: true,
      notified_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
    ;(global.alert as jest.Mock).mockClear()
  })

  it('ローディング状態を表示する', () => {
    ;(global.fetch as jest.Mock).mockImplementation(() =>
      new Promise(() => {}) // 解決しないPromiseでローディング状態を維持
    )

    render(<ReminderPage />)
    expect(screen.getByLabelText('読み込み中')).toBeInTheDocument()
  })

  it('リマインダー一覧を表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockReminders,
    })

    render(<ReminderPage />)

    await waitFor(() => {
      expect(screen.getAllByText('エントリー締切').length).toBeGreaterThan(0)
    })

    expect(screen.getAllByText('過去のリマインダー').length).toBeGreaterThan(0)
  })

  it('リマインダーが空の場合、空のメッセージを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<ReminderPage />)

    await waitFor(() => {
      expect(screen.getByText(/リマインダーが登録されていません/)).toBeInTheDocument()
    })
  })

  it('今後のリマインダーと過去のリマインダーを分けて表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockReminders,
    })

    render(<ReminderPage />)

    await waitFor(() => {
      expect(screen.getByText('今後のリマインダー')).toBeInTheDocument()
    })

    expect(screen.getByRole('heading', { name: '過去のリマインダー' })).toBeInTheDocument()
  })

  it('イベント情報を表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockReminders,
    })

    render(<ReminderPage />)

    await waitFor(() => {
      expect(screen.getByText('テストイベント1')).toBeInTheDocument()
    })
  })

  it('通知済みバッジを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockReminders,
    })

    render(<ReminderPage />)

    await waitFor(() => {
      expect(screen.getByText('通知済み')).toBeInTheDocument()
    })
  })

  it('ソート機能を表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockReminders,
    })

    render(<ReminderPage />)

    await waitFor(() => {
      expect(screen.getByText('ソート:')).toBeInTheDocument()
    })

    expect(screen.getByDisplayValue('期日が近い順（昇順）')).toBeInTheDocument()
  })

  it('ソート順を変更すると、ソート順でAPIを呼び出す', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockReminders,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockReminders,
      })

    const user = userEvent.setup()
    render(<ReminderPage />)

    await waitFor(() => {
      expect(screen.getByText('ソート:')).toBeInTheDocument()
    })

    const sortSelect = screen.getByDisplayValue('期日が近い順（昇順）')
    await user.selectOptions(sortSelect, 'desc')

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sortOrder=desc')
      )
    })
  })

  it('新規作成ボタンを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockReminders,
    })

    render(<ReminderPage />)

    await waitFor(() => {
      expect(screen.getByText('新規作成')).toBeInTheDocument()
    })
  })

  it('新規作成ボタンがリンクになっている', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockReminders,
    })

    render(<ReminderPage />)

    await waitFor(() => {
      const createButton = screen.getByText('新規作成').closest('a')
      expect(createButton).toHaveAttribute('href', '/app/reminder/new')
    })
  })

  it('削除ボタンをクリックすると、削除確認モーダルを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockReminders,
    })

    const user = userEvent.setup()
    render(<ReminderPage />)

    await waitFor(() => {
      expect(screen.getAllByText('エントリー締切').length).toBeGreaterThan(0)
    })

    // ShareMenuのメニューボタンをクリックしてから削除ボタンを探す
    const menuButtons = screen.getAllByTitle('メニュー')
    if (menuButtons.length > 0) {
      await user.click(menuButtons[0])
      
      // メニューが開いたら削除ボタンを探す
      await waitFor(async () => {
        const deleteButtons = screen.queryAllByText(/削除/)
        if (deleteButtons.length > 0) {
          await user.click(deleteButtons[0])
        }
      }, { timeout: 2000 })
    }

    await waitFor(() => {
      expect(screen.getByText('リマインダーを削除')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('削除確認モーダルで削除を実行すると、リマインダーを削除する', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockReminders,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [mockReminders[1]], // 削除後のリスト
      })

    const user = userEvent.setup()
    render(<ReminderPage />)

    await waitFor(() => {
      expect(screen.getAllByText('エントリー締切').length).toBeGreaterThan(0)
    })

    // ShareMenuのメニューボタンをクリック
    const menuButtons = screen.getAllByTitle('メニュー')
    if (menuButtons.length > 0) {
      await user.click(menuButtons[0])
      
      // メニューが開いたら削除ボタンを探す
      await waitFor(async () => {
        const deleteButtons = screen.queryAllByText(/削除/)
        if (deleteButtons.length > 0) {
          await user.click(deleteButtons[0])
        }
      }, { timeout: 2000 })
    }

    await waitFor(() => {
      expect(screen.getByText('リマインダーを削除')).toBeInTheDocument()
    }, { timeout: 3000 })

    const confirmButton = screen.getByText('削除')
    await user.click(confirmButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/reminders/reminder-1',
        expect.objectContaining({ method: 'DELETE' })
      )
    }, { timeout: 3000 })
  })

  it('マイページへの戻るリンクを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockReminders,
    })

    render(<ReminderPage />)

    await waitFor(() => {
      const backLink = screen.getByText(/マイページへ戻る/)
      expect(backLink.closest('a')).toHaveAttribute('href', '/app/mypage')
    })
  })

  it('エラーが発生した場合、エラーログを出力する', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<ReminderPage />)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled()
    }, { timeout: 3000 })

    // エラーメッセージが含まれることを確認
    const errorCalls = consoleErrorSpy.mock.calls
    const hasReminderError = errorCalls.some(call => 
      call[0]?.toString().includes('Failed to fetch reminders')
    )
    expect(hasReminderError).toBe(true)

    consoleErrorSpy.mockRestore()
  })
})

