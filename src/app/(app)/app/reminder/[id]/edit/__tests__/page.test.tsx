import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditReminderPage from '../page'
import { use } from 'react'

// モック設定
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  use: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/app/reminder/reminder-1/edit',
    query: {},
    asPath: '/app/reminder/reminder-1/edit',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/app/reminder/reminder-1/edit',
}))

// グローバルfetchとalertのモック
global.fetch = jest.fn()
global.alert = jest.fn()

describe('EditReminderPage', () => {
  const mockEvents = [
    {
      id: 'event-1',
      name: 'テストイベント1',
      theme: 'テストテーマ1',
    },
    {
      id: 'event-2',
      name: 'テストイベント2',
      theme: null,
    },
  ]

  const mockReminder = {
    id: 'reminder-1',
    event: {
      id: 'event-1',
      name: 'テストイベント1',
      theme: 'テストテーマ1',
    },
    label: 'エントリー締切',
    datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    note: 'テスト備考',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
    ;(global.alert as jest.Mock).mockClear()
    ;(use as jest.Mock).mockImplementation(() => {
      return { id: 'reminder-1' }
    })
  })

  it('ローディング状態を表示する', () => {
    ;(global.fetch as jest.Mock).mockImplementation(() =>
      new Promise(() => {}) // 解決しないPromiseでローディング状態を維持
    )

    render(<EditReminderPage params={Promise.resolve({ id: 'reminder-1' })} />)
    expect(screen.getByLabelText('読み込み中')).toBeInTheDocument()
  })

  it('リマインダー情報を表示する', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockReminder,
      })

    render(<EditReminderPage params={Promise.resolve({ id: 'reminder-1' })} />)

    await waitFor(() => {
      expect(screen.getByText('リマインダーを編集')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/エントリー開始、支払期限、集合時間/)).toBeInTheDocument()
    })
  })

  it('リマインダーが見つからない場合、エラーメッセージを表示する', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

    render(<EditReminderPage params={Promise.resolve({ id: 'reminder-1' })} />)

    await waitFor(() => {
      expect(screen.getByText(/リマインダーが見つかりません/)).toBeInTheDocument()
    })
  })

  it('フォーム送信でリマインダーを更新する', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockReminder,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

    const user = userEvent.setup()
    render(<EditReminderPage params={Promise.resolve({ id: 'reminder-1' })} />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/エントリー開始、支払期限、集合時間/)).toBeInTheDocument()
    })

    const labelInput = screen.getByPlaceholderText(/エントリー開始、支払期限、集合時間/)
    await user.clear(labelInput)
    await user.type(labelInput, '更新されたラベル')

    const submitButton = screen.getByRole('button', { name: /更新/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/reminders/reminder-1',
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })
  })

  it('削除ボタンをクリックすると、削除確認モーダルを表示する', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockReminder,
      })

    const user = userEvent.setup()
    render(<EditReminderPage params={Promise.resolve({ id: 'reminder-1' })} />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/エントリー開始、支払期限、集合時間/)).toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /削除/i })
    await user.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByText('リマインダーを削除')).toBeInTheDocument()
    })
  })

  it('削除確認モーダルで削除を実行すると、リマインダーを削除する', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockReminder,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

    const user = userEvent.setup()
    render(<EditReminderPage params={Promise.resolve({ id: 'reminder-1' })} />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/エントリー開始、支払期限、集合時間/)).toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /削除/i })
    await user.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByText('リマインダーを削除')).toBeInTheDocument()
    })

    const confirmButtons = screen.getAllByRole('button', { name: '削除' })
    const confirmButton = confirmButtons.find(btn => btn.textContent === '削除' && btn.closest('[role="dialog"]')) || confirmButtons[confirmButtons.length - 1]
    await user.click(confirmButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/reminders/reminder-1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  it('更新中はボタンが無効化される', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockReminder,
      })
      .mockImplementationOnce(() =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ success: true }),
            })
          }, 100)
        })
      )

    const user = userEvent.setup()
    render(<EditReminderPage params={Promise.resolve({ id: 'reminder-1' })} />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/エントリー開始、支払期限、集合時間/)).toBeInTheDocument()
    })

    const submitButton = screen.getByRole('button', { name: /更新/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('更新中...')).toBeInTheDocument()
    })
  })

  it('エラーが発生した場合、エラーメッセージを表示する', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockReminder,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

    const user = userEvent.setup()
    render(<EditReminderPage params={Promise.resolve({ id: 'reminder-1' })} />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/エントリー開始、支払期限、集合時間/)).toBeInTheDocument()
    })

    const submitButton = screen.getByRole('button', { name: /更新/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('リマインダーの更新に失敗しました')
    }, { timeout: 3000 })
  })

  it('リマインダー一覧への戻るリンクを表示する', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockReminder,
      })

    render(<EditReminderPage params={Promise.resolve({ id: 'reminder-1' })} />)

    await waitFor(() => {
      const backLink = screen.getByText(/リマインダー一覧に戻る/)
      expect(backLink.closest('a')).toHaveAttribute('href', '/app/reminder')
    })
  })
})

