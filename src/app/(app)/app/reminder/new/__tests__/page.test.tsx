import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewReminderPage from '../page'

// モック設定
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/app/reminder/new',
    query: {},
    asPath: '/app/reminder/new',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/app/reminder/new',
}))

jest.mock('@/lib/notification-check', () => ({
  shouldRedirectToNotificationSettings: jest.fn().mockResolvedValue(false),
}))

jest.mock('@/lib/calendar', () => ({
  generateGoogleCalendarUrl: jest.fn(() => 'https://calendar.google.com'),
  generateICalContent: jest.fn(() => 'BEGIN:VCALENDAR'),
  downloadICalFile: jest.fn(),
  isIOS: jest.fn(() => false),
}))

// グローバルfetchとalertのモック
global.fetch = jest.fn()
global.alert = jest.fn()

describe('NewReminderPage', () => {
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

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
    ;(global.alert as jest.Mock).mockClear()
  })

  it('ローディング状態を表示する', () => {
    ;(global.fetch as jest.Mock).mockImplementation(() =>
      new Promise(() => {}) // 解決しないPromiseでローディング状態を維持
    )

    render(<NewReminderPage />)
    expect(screen.getByLabelText('読み込み中')).toBeInTheDocument()
  })

  it('フォームを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvents,
    })

    render(<NewReminderPage />)

    await waitFor(() => {
      expect(screen.getByText('リマインダーを新規作成')).toBeInTheDocument()
    })

    expect(screen.getByPlaceholderText(/エントリー開始、支払期限、集合時間/)).toBeInTheDocument()
    const datetimeInputs = screen.getAllByDisplayValue('')
    expect(datetimeInputs.length).toBeGreaterThan(0) // datetime-local input
  })

  it('イベント一覧を表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvents,
    })

    render(<NewReminderPage />)

    await waitFor(() => {
      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
      expect(select.querySelector('option[value="event-1"]')).toHaveTextContent('テストイベント1')
      expect(select.querySelector('option[value="event-2"]')).toHaveTextContent('テストイベント2')
    })
  })

  it('フォーム送信でリマインダーを作成する', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'reminder-1' }),
      })

    const user = userEvent.setup()
    render(<NewReminderPage />)

    await waitFor(() => {
      expect(screen.getByText('リマインダーを新規作成')).toBeInTheDocument()
    })

    const labelInput = screen.getByPlaceholderText(/エントリー開始、支払期限、集合時間/)
    await user.type(labelInput, 'エントリー締切')

    const datetimeInputs = screen.getAllByDisplayValue('')
    const datetimeInput = datetimeInputs.find(input => input.getAttribute('type') === 'datetime-local') || datetimeInputs[1]
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const datetimeValue = futureDate.toISOString().slice(0, 16)
    await user.type(datetimeInput, datetimeValue)

    const submitButton = screen.getByRole('button', { name: /作成/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/reminders',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })
  })

  it('必須項目が未入力の場合、送信できない', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvents,
    })

    const user = userEvent.setup()
    render(<NewReminderPage />)

    await waitFor(() => {
      expect(screen.getByText('リマインダーを新規作成')).toBeInTheDocument()
    })

    const submitButton = screen.getByRole('button', { name: /作成/i })
    await user.click(submitButton)
    
    // HTML5のrequired属性により、フォーム送信が阻止される
    // fetchが呼ばれていないことを確認（少し待ってから）
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // API呼び出しはイベント取得の1回のみ（作成APIは呼ばれない）
    const fetchCalls = (global.fetch as jest.Mock).mock.calls
    const createCalls = fetchCalls.filter(call => call[0] === '/api/reminders' && call[1]?.method === 'POST')
    expect(createCalls.length).toBe(0)
  })

  it('作成成功後、カレンダー登録モーダルを表示する', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'reminder-1' }),
      })

    const user = userEvent.setup()
    render(<NewReminderPage />)

    await waitFor(() => {
      expect(screen.getByText('リマインダーを新規作成')).toBeInTheDocument()
    })

    const labelInput = screen.getByPlaceholderText(/エントリー開始、支払期限、集合時間/)
    await user.type(labelInput, 'エントリー締切')

    const datetimeInputs = screen.getAllByDisplayValue('')
    const datetimeInput = datetimeInputs.find(input => input.getAttribute('type') === 'datetime-local') || datetimeInputs[1]
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const datetimeValue = futureDate.toISOString().slice(0, 16)
    await user.type(datetimeInput, datetimeValue)

    const submitButton = screen.getByRole('button', { name: /作成/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('カレンダーに登録')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('作成中はボタンが無効化される', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })
      .mockImplementationOnce(() =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ id: 'reminder-1' }),
            })
          }, 100)
        })
      )

    const user = userEvent.setup()
    render(<NewReminderPage />)

    await waitFor(() => {
      expect(screen.getByText('リマインダーを新規作成')).toBeInTheDocument()
    })

    const labelInput = screen.getByPlaceholderText(/エントリー開始、支払期限、集合時間/)
    await user.type(labelInput, 'エントリー締切')

    const datetimeInputs = screen.getAllByDisplayValue('')
    const datetimeInput = datetimeInputs.find(input => input.getAttribute('type') === 'datetime-local') || datetimeInputs[1]
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const datetimeValue = futureDate.toISOString().slice(0, 16)
    await user.type(datetimeInput, datetimeValue)

    const submitButton = screen.getByRole('button', { name: /作成/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('作成中...')).toBeInTheDocument()
    })
  })

  it('エラーが発生した場合、エラーメッセージを表示する', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

    const user = userEvent.setup()
    render(<NewReminderPage />)

    await waitFor(() => {
      expect(screen.getByText('リマインダーを新規作成')).toBeInTheDocument()
    })

    const labelInput = screen.getByPlaceholderText(/エントリー開始、支払期限、集合時間/)
    await user.type(labelInput, 'エントリー締切')

    const datetimeInputs = screen.getAllByDisplayValue('')
    const datetimeInput = datetimeInputs.find(input => input.getAttribute('type') === 'datetime-local') || datetimeInputs[1]
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const datetimeValue = futureDate.toISOString().slice(0, 16)
    await user.type(datetimeInput, datetimeValue)

    const submitButton = screen.getByRole('button', { name: /作成/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('リマインダーの作成に失敗しました')
    }, { timeout: 3000 })
  })

  it('リマインダー一覧への戻るリンクを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvents,
    })

    render(<NewReminderPage />)

    await waitFor(() => {
      const backLink = screen.getByText(/リマインダー一覧に戻る/)
      expect(backLink.closest('a')).toHaveAttribute('href', '/app/reminder')
    })
  })
})

