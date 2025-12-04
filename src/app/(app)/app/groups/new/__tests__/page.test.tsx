import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewGroupPage from '../page'

// モック設定
const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockUseSearchParams = jest.fn(() => new URLSearchParams())

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/app/groups/new',
    query: {},
    asPath: '/app/groups/new',
  }),
  useSearchParams: () => mockUseSearchParams(),
  usePathname: () => '/app/groups/new',
}))

// グローバルfetchのモック
global.fetch = jest.fn()

describe('NewGroupPage', () => {
  const mockEvents = [
    {
      id: 'event-1',
      name: 'テストイベント1',
      theme: 'テストテーマ1',
      event_date: '2024-12-31',
    },
    {
      id: 'event-2',
      name: 'テストイベント2',
      theme: null,
      event_date: '2025-01-15',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
    mockPush.mockClear()
    mockUseSearchParams.mockReturnValue(new URLSearchParams())
  })

  describe('イベント選択画面', () => {
    it('ローディング状態を表示する', () => {
      ;(global.fetch as jest.Mock).mockImplementation(() =>
        new Promise(() => {}) // 解決しないPromiseでローディング状態を維持
      )

      render(<NewGroupPage />)
      expect(screen.getByLabelText('読み込み中')).toBeInTheDocument()
    })

    it('イベント一覧を表示する', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: mockEvents }),
      })

      render(<NewGroupPage />)

      await waitFor(() => {
        expect(screen.getByText('テストイベント1')).toBeInTheDocument()
      })

      expect(screen.getByText('テストイベント2')).toBeInTheDocument()
    })

    it('イベントが空の場合、空のメッセージを表示する', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: [] }),
      })

      render(<NewGroupPage />)

      await waitFor(() => {
        expect(screen.getByText('イベントが見つかりません')).toBeInTheDocument()
      })
    })

    it('イベントを選択すると、フォーム画面に遷移する', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: mockEvents }),
      })

      const user = userEvent.setup()
      render(<NewGroupPage />)

      await waitFor(() => {
        expect(screen.getByText('テストイベント1')).toBeInTheDocument()
      })

      const eventButton = screen.getByText('テストイベント1').closest('button')
      if (eventButton) {
        await user.click(eventButton)
      }

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/app/groups/new?eventId=event-1')
      })
    })
  })

  describe('フォーム画面（eventId指定時）', () => {
    beforeEach(() => {
      // useSearchParamsをモックしてeventIdを返す
      mockUseSearchParams.mockReturnValue(new URLSearchParams('eventId=event-1'))
    })

    it('選択されたイベント情報を表示する', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: mockEvents }),
      })

      render(<NewGroupPage />)

      await waitFor(() => {
        expect(screen.getByText('テストイベント1')).toBeInTheDocument()
      })

      expect(screen.getByText('対象イベント')).toBeInTheDocument()
    })

    it('フォームフィールドを表示する', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: mockEvents }),
      })

      render(<NewGroupPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/レトロスポーツ痛車会/)).toBeInTheDocument()
      })

      expect(screen.getByPlaceholderText(/80年代スポーツカー中心/)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/例: 10/)).toBeInTheDocument()
    })

    it('団体名が必須であることを表示する', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: mockEvents }),
      })

      render(<NewGroupPage />)

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/レトロスポーツ痛車会/)
        expect(nameInput).toBeRequired()
      })
    })

    it('フォーム送信時にバリデーションエラーを表示する（団体名が空）', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: mockEvents }),
      })

      const user = userEvent.setup()
      render(<NewGroupPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/レトロスポーツ痛車会/)).toBeInTheDocument()
      })

      // HTML5のrequired属性によるバリデーションを回避するため、空白文字を入力
      const nameInput = screen.getByPlaceholderText(/レトロスポーツ痛車会/) as HTMLInputElement
      await user.type(nameInput, '   ') // 空白のみ
      await user.clear(nameInput)

      const submitButton = screen.getByRole('button', { name: /作成する/i })
      // preventDefaultを呼び出すため、formのsubmitイベントを直接発火
      const form = submitButton.closest('form')
      if (form) {
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
        form.dispatchEvent(submitEvent)
      }

      await waitFor(() => {
        expect(screen.getByText('団体名は必須です')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('フォーム送信に成功すると、団体詳細ページにリダイレクトする', async () => {
      const mockGroupId = 'new-group-1'
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ events: mockEvents }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ groupId: mockGroupId }),
        })

      const user = userEvent.setup()
      render(<NewGroupPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/レトロスポーツ痛車会/)).toBeInTheDocument()
      })

      const nameInput = screen.getByPlaceholderText(/レトロスポーツ痛車会/)
      await user.type(nameInput, '新しい団体')

      const submitButton = screen.getByRole('button', { name: /作成する/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(`/app/groups/${mockGroupId}`)
      })
    })

    it('フォーム送信時にエラーが発生した場合、エラーメッセージを表示する', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ events: mockEvents }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: '団体の作成に失敗しました' }),
        })

      const user = userEvent.setup()
      render(<NewGroupPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/レトロスポーツ痛車会/)).toBeInTheDocument()
      })

      const nameInput = screen.getByPlaceholderText(/レトロスポーツ痛車会/)
      await user.type(nameInput, '新しい団体')

      const submitButton = screen.getByRole('button', { name: /作成する/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('団体の作成に失敗しました')).toBeInTheDocument()
      })
    })

    it('送信中はボタンが無効になる', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ events: mockEvents }),
        })
        .mockImplementationOnce(() =>
          new Promise((resolve) => {
            // すぐには解決しないPromise
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({ groupId: 'new-group-1' }),
              })
            }, 100)
          })
        )

      const user = userEvent.setup()
      render(<NewGroupPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/レトロスポーツ痛車会/)).toBeInTheDocument()
      })

      const nameInput = screen.getByPlaceholderText(/レトロスポーツ痛車会/)
      await user.type(nameInput, '新しい団体')

      const submitButton = screen.getByRole('button', { name: /作成する/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('作成中...')).toBeInTheDocument()
      })

      const disabledButton = screen.getByRole('button', { name: /作成中.../i })
      expect(disabledButton).toBeDisabled()
    })

    it('キャンセルボタンがリンクになっている', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: mockEvents }),
      })

      render(<NewGroupPage />)

      await waitFor(() => {
        const cancelLink = screen.getByText('キャンセル')
        expect(cancelLink.closest('a')).toHaveAttribute('href', '/app/groups')
      })
    })
  })
})

