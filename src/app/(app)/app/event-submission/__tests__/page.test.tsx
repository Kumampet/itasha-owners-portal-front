import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import EventSubmissionPage from '../page'

// モック設定
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/app/event-submission',
    query: {},
    asPath: '/app/event-submission',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/app/event-submission',
}))

// グローバルfetchのモック
global.fetch = jest.fn()

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText(/痛車ヘブン夏/), 'テストイベント')
  fireEvent.change(screen.getByLabelText(/開催日時/), {
    target: { value: '2026-06-15T13:30' },
  })
  await user.type(screen.getByPlaceholderText(/愛知県名古屋市/), '東京都〇〇ホール')
  await user.type(
    screen.getByPlaceholderText(/^https:\/\/example\.com\/event$/),
    'https://example.com/event'
  )
}

describe('EventSubmissionPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    } as ReturnType<typeof useSession>)
  })

  it('フォームを表示する', () => {
    render(<EventSubmissionPage />)
    expect(screen.getByText('イベント掲載依頼フォーム')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/痛車ヘブン夏/)).toBeInTheDocument()
    expect(screen.queryByText(/詳細情報/)).not.toBeInTheDocument()
  })

  it('必須項目を表示する', () => {
    render(<EventSubmissionPage />)
    expect(screen.getByPlaceholderText(/痛車ヘブン夏/)).toHaveAttribute('required')
    expect(screen.getByLabelText(/開催日時/)).toHaveAttribute('required')
    expect(screen.getByPlaceholderText(/愛知県名古屋市/)).toHaveAttribute('required')
    expect(screen.getByPlaceholderText(/^https:\/\/example\.com\/event$/)).toHaveAttribute(
      'required'
    )
  })

  it('備考・任意項目を表示する', () => {
    render(<EventSubmissionPage />)
    expect(screen.getByLabelText(/^備考/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/補足や連絡事項など/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/補足や連絡事項など/)).not.toHaveAttribute('required')
  })

  it('フォーム送信でイベント掲載依頼を送信する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'submission-1' }),
    })

    const user = userEvent.setup()
    render(<EventSubmissionPage />)

    await fillRequiredFields(user)

    const submitButton = screen.getByRole('button', { name: /送信/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/event-submissions',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })
    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      { body?: string },
    ]
    expect(JSON.parse(init.body ?? '{}')).toMatchObject({
      name: 'テストイベント',
      venue_name: '東京都〇〇ホール',
      original_url: 'https://example.com/event',
      event_date: '2026-06-15T13:30',
      description: null,
    })
  })

  it('送信成功後、成功モーダルを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'submission-1' }),
    })

    const user = userEvent.setup()
    render(<EventSubmissionPage />)

    await fillRequiredFields(user)

    const submitButton = screen.getByRole('button', { name: /送信/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('送信完了')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('送信成功後、フォームをクリアする', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'submission-1' }),
    })

    const user = userEvent.setup()
    render(<EventSubmissionPage />)

    const nameInput = screen.getByPlaceholderText(/痛車ヘブン夏/)
    await fillRequiredFields(user)

    const submitButton = screen.getByRole('button', { name: /送信/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(nameInput).toHaveValue('')
    }, { timeout: 3000 })
  })

  it('送信中はボタンが無効化される', async () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ id: 'submission-1' }),
            })
          }, 100)
        })
    )

    const user = userEvent.setup()
    render(<EventSubmissionPage />)

    await fillRequiredFields(user)

    const submitButton = screen.getByRole('button', { name: /送信/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('送信中...')).toBeInTheDocument()
    })
  })

  it('エラーが発生した場合、エラーモーダルを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'イベント情報URLは必須です' }),
    })

    const user = userEvent.setup()
    render(<EventSubmissionPage />)

    await fillRequiredFields(user)

    const submitButton = screen.getByRole('button', { name: /送信/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('送信失敗')).toBeInTheDocument()
    }, { timeout: 3000 })
  }, 15000)

  it('エラー時は入力内容を保持する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'サーバーエラー' }),
    })

    const user = userEvent.setup()
    render(<EventSubmissionPage />)

    const nameInput = screen.getByPlaceholderText(/痛車ヘブン夏/)
    await fillRequiredFields(user)

    const submitButton = screen.getByRole('button', { name: /送信/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('送信失敗')).toBeInTheDocument()
    }, { timeout: 3000 })

    expect(nameInput).toHaveValue('テストイベント')
  })

  it('ログイン中の場合、マイページへの戻るリンクを表示する', () => {
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

    render(<EventSubmissionPage />)
    const backLink = screen.getByText(/マイページへ戻る/)
    expect(backLink.closest('a')).toHaveAttribute('href', '/app/mypage')
  })

  it('未ログインの場合、戻るリンクを表示しない', () => {
    render(<EventSubmissionPage />)
    expect(screen.queryByText(/マイページへ戻る/)).not.toBeInTheDocument()
  })

  it('キャンセルボタンがマイページへのリンクになっている', () => {
    render(<EventSubmissionPage />)
    const cancelButton = screen.getByRole('link', { name: /キャンセル/i })
    expect(cancelButton).toHaveAttribute('href', '/app/mypage')
  })
})
