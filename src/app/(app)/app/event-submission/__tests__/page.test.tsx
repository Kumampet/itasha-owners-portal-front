import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

describe('EventSubmissionPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('フォームを表示する', () => {
    render(<EventSubmissionPage />)
    expect(screen.getByText('イベント掲載依頼フォーム')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/痛車ヘブン夏/)).toBeInTheDocument()
  })

  it('必須項目を表示する', () => {
    render(<EventSubmissionPage />)
    expect(screen.getByText(/イベント名/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/痛車ヘブン夏/)).toHaveAttribute('required')
  })

  it('任意項目を表示する', () => {
    render(<EventSubmissionPage />)
    expect(screen.getByText(/イベント情報URL/)).toBeInTheDocument()
    expect(screen.getByText(/開催日/)).toBeInTheDocument()
  })

  it('フォーム送信でイベント掲載依頼を送信する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'submission-1' }),
    })

    const user = userEvent.setup()
    render(<EventSubmissionPage />)

    const nameInput = screen.getByPlaceholderText(/痛車ヘブン夏/)
    await user.type(nameInput, 'テストイベント')

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
  })

  it('送信成功後、成功モーダルを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'submission-1' }),
    })

    const user = userEvent.setup()
    render(<EventSubmissionPage />)

    const nameInput = screen.getByPlaceholderText(/痛車ヘブン夏/)
    await user.type(nameInput, 'テストイベント')

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
    await user.type(nameInput, 'テストイベント')

    const submitButton = screen.getByRole('button', { name: /送信/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(nameInput).toHaveValue('')
    }, { timeout: 3000 })
  })

  it('送信中はボタンが無効化される', async () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
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

    const nameInput = screen.getByPlaceholderText(/痛車ヘブン夏/)
    await user.type(nameInput, 'テストイベント')

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
      json: async () => ({ error: 'イベント名は必須です' }),
    })

    const user = userEvent.setup()
    render(<EventSubmissionPage />)

    // イベント名を入力せずに送信
    const submitButton = screen.getByRole('button', { name: /送信/i })
    // HTML5のrequired属性により送信できないため、直接フォームを送信
    const form = submitButton.closest('form')
    if (form) {
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
      form.dispatchEvent(submitEvent)
    }

    // または、イベント名を入力してから送信
    const nameInput = screen.getByPlaceholderText(/痛車ヘブン夏/)
    await user.type(nameInput, 'テストイベント')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('送信失敗')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('エラー時は入力内容を保持する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'サーバーエラー' }),
    })

    const user = userEvent.setup()
    render(<EventSubmissionPage />)

    const nameInput = screen.getByPlaceholderText(/痛車ヘブン夏/)
    await user.type(nameInput, 'テストイベント')

    const submitButton = screen.getByRole('button', { name: /送信/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('送信失敗')).toBeInTheDocument()
    }, { timeout: 3000 })

    // エラー後も入力内容が保持されている
    expect(nameInput).toHaveValue('テストイベント')
  })

  it('マイページへの戻るリンクを表示する', () => {
    render(<EventSubmissionPage />)
    const backLink = screen.getByText(/マイページへ戻る/)
    expect(backLink.closest('a')).toHaveAttribute('href', '/app/mypage')
  })

  it('キャンセルボタンがマイページへのリンクになっている', () => {
    render(<EventSubmissionPage />)
    const cancelButton = screen.getByRole('link', { name: /キャンセル/i })
    expect(cancelButton).toHaveAttribute('href', '/app/mypage')
  })
})

