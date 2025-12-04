import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminNewEventPage from '../page'

// モック設定
const mockPush = jest.fn()
const mockUseSearchParams = jest.fn(() => new URLSearchParams())

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/admin/events/new',
    query: {},
    asPath: '/admin/events/new',
  }),
  useSearchParams: () => mockUseSearchParams(),
  usePathname: () => '/admin/events/new',
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

// グローバルfetchとalertのモック
global.fetch = jest.fn()
global.alert = jest.fn()

describe('AdminNewEventPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
    ;(global.alert as jest.Mock).mockClear()
    mockPush.mockClear()
    mockUseSearchParams.mockReturnValue(new URLSearchParams())
  })

  it('ページを表示する', async () => {
    render(<AdminNewEventPage />)

    await waitFor(() => {
      expect(screen.getByText('新規イベントを作成')).toBeInTheDocument()
    })

    expect(screen.getByText('← イベント一覧に戻る')).toBeInTheDocument()
  })

  it('イベント名入力欄を表示する', async () => {
    render(<AdminNewEventPage />)

    await waitFor(() => {
      expect(screen.getByText(/イベント名/)).toBeInTheDocument()
    })

    // イベント名のinputを取得（labelの次のinput）
    const nameLabel = screen.getByText(/イベント名/)
    const nameInput = nameLabel.parentElement?.querySelector('input[type="text"]')
    expect(nameInput).toBeInTheDocument()
  })

  it('下書き保存ボタンを表示する', async () => {
    render(<AdminNewEventPage />)

    await waitFor(() => {
      expect(screen.getByText('下書きとして保存')).toBeInTheDocument()
    })
  })

  it('保存して掲載申請ボタンを表示する', async () => {
    render(<AdminNewEventPage />)

    await waitFor(() => {
      expect(screen.getByText('保存して掲載申請')).toBeInTheDocument()
    })
  })

  it('作成中止ボタンを表示する', async () => {
    render(<AdminNewEventPage />)

    await waitFor(() => {
      expect(screen.getByText('作成中止')).toBeInTheDocument()
    })
  })

  it('下書き保存に成功すると、イベント詳細ページに遷移する', async () => {
    const mockEventId = 'new-event-1'
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: mockEventId }),
    })

    const user = userEvent.setup()
    render(<AdminNewEventPage />)

    await waitFor(() => {
      expect(screen.getByText('下書きとして保存')).toBeInTheDocument()
    })

    // 最低限の必須項目を入力
    const nameLabel = screen.getByText(/イベント名/)
    const nameInput = nameLabel.parentElement?.querySelector('input[type="text"]') as HTMLInputElement
    if (nameInput) {
      await user.type(nameInput, 'テストイベント')
    }

    const draftButton = screen.getByText('下書きとして保存')
    await user.click(draftButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(`/admin/events/${mockEventId}`)
    })
  })

  it('保存して掲載申請ボタンが存在する', async () => {
    render(<AdminNewEventPage />)

    await waitFor(() => {
      expect(screen.getByText('保存して掲載申請')).toBeInTheDocument()
    })
  })

  it('保存して掲載申請時に公式URLが未入力の場合、エラーメッセージを表示する', async () => {
    const user = userEvent.setup()
    render(<AdminNewEventPage />)

    await waitFor(() => {
      expect(screen.getByText('保存して掲載申請')).toBeInTheDocument()
    })

    const submitButton = screen.getByText('保存して掲載申請')
    await user.click(submitButton)

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('最低1つの公式サイトURLを入力してください')
    })
  })

  it('作成中止ボタンをクリックすると、確認モーダルを表示する', async () => {
    const user = userEvent.setup()
    render(<AdminNewEventPage />)

    await waitFor(() => {
      expect(screen.getByText('作成中止')).toBeInTheDocument()
    })

    const cancelButton = screen.getByText('作成中止')
    await user.click(cancelButton)

    await waitFor(() => {
      expect(screen.getByText('本当に作成を中止しますか？')).toBeInTheDocument()
    })
  })

  it('確認モーダルで「はい」をクリックすると、一覧ページに戻る', async () => {
    const user = userEvent.setup()
    render(<AdminNewEventPage />)

    await waitFor(() => {
      expect(screen.getByText('作成中止')).toBeInTheDocument()
    })

    const cancelButton = screen.getByText('作成中止')
    await user.click(cancelButton)

    await waitFor(() => {
      expect(screen.getByText('本当に作成を中止しますか？')).toBeInTheDocument()
    })

    const confirmButton = screen.getByText('はい')
    await user.click(confirmButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/events')
    })
  })

  it('保存中はボタンが無効になる', async () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: async () => ({ id: 'new-event-1' }),
          })
        }, 300)
      })
    )

    const user = userEvent.setup()
    render(<AdminNewEventPage />)

    await waitFor(() => {
      expect(screen.getByText('下書きとして保存')).toBeInTheDocument()
    })

    const nameLabel = screen.getByText(/イベント名/)
    const nameInput = nameLabel.parentElement?.querySelector('input[type="text"]') as HTMLInputElement
    if (nameInput) {
      await user.type(nameInput, 'テストイベント')
    }

    const draftButton = screen.getByText('下書きとして保存')
    await user.click(draftButton)

    // 保存中状態を確認（ボタンのテキストが「保存中...」に変わる）
    await waitFor(() => {
      const savingButtons = screen.queryAllByText(/保存中/)
      expect(savingButtons.length).toBeGreaterThan(0)
    }, { timeout: 2000 })

    // ボタンが無効になっていることを確認
    const buttons = screen.getAllByRole('button')
    const disabledButtons = buttons.filter(btn => (btn as HTMLButtonElement).disabled)
    expect(disabledButtons.length).toBeGreaterThan(0)
  })

  it('エラーが発生した場合、エラーメッセージを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'イベントの作成に失敗しました' }),
    })

    const user = userEvent.setup()
    render(<AdminNewEventPage />)

    await waitFor(() => {
      expect(screen.getByText('下書きとして保存')).toBeInTheDocument()
    })

    const nameLabel = screen.getByText(/イベント名/)
    const nameInput = nameLabel.parentElement?.querySelector('input[type="text"]') as HTMLInputElement
    if (nameInput) {
      await user.type(nameInput, 'テストイベント')
    }

    const draftButton = screen.getByText('下書きとして保存')
    await user.click(draftButton)

    // APIが呼ばれることを確認
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    }, { timeout: 3000 })

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalled()
    }, { timeout: 2000 })
  })
})

