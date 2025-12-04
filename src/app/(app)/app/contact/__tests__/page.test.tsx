import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ContactPage from '../page'
import { useSession } from 'next-auth/react'

// モック設定
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/app/contact',
    query: {},
    asPath: '/app/contact',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/app/contact',
}))

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// グローバルfetchのモック
global.fetch = jest.fn()

describe('ContactPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })
  })

  it('フォームを表示する', () => {
    render(<ContactPage />)
    expect(screen.getByText('お問い合わせフォーム')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/イベント主催について/)).toBeInTheDocument()
  })

  it('必須項目を表示する', () => {
    render(<ContactPage />)
    expect(screen.getByText(/タイトル/)).toBeInTheDocument()
    expect(screen.getByText(/お名前/)).toBeInTheDocument()
    expect(screen.getByText(/メールアドレス/)).toBeInTheDocument()
    expect(screen.getByText(/お問い合わせ内容/)).toBeInTheDocument()
  })

  it('ログイン中の場合、ログインアカウント情報を表示する', () => {
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
    })

    render(<ContactPage />)
    expect(screen.getByText(/ログイン中のアカウント: test@example.com/)).toBeInTheDocument()
  })

  it('フォーム送信でお問い合わせを送信する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'contact-1' }),
    })

    const user = userEvent.setup()
    render(<ContactPage />)

    const titleInput = screen.getByPlaceholderText(/イベント主催について/)
    await user.type(titleInput, 'テストタイトル')

    const nameInput = screen.getByPlaceholderText(/お名前またはニックネーム/)
    await user.type(nameInput, 'テストユーザー')

    const emailInput = screen.getByPlaceholderText(/example@email.com/)
    await user.type(emailInput, 'test@example.com')

    const contentInput = screen.getByPlaceholderText(/お問い合わせ内容をご記入ください/)
    await user.type(contentInput, 'テスト内容')

    const submitButton = screen.getByRole('button', { name: /送信する/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/contact',
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
      json: async () => ({ id: 'contact-1' }),
    })

    const user = userEvent.setup()
    render(<ContactPage />)

    const titleInput = screen.getByPlaceholderText(/イベント主催について/)
    await user.type(titleInput, 'テストタイトル')

    const nameInput = screen.getByPlaceholderText(/お名前またはニックネーム/)
    await user.type(nameInput, 'テストユーザー')

    const emailInput = screen.getByPlaceholderText(/example@email.com/)
    await user.type(emailInput, 'test@example.com')

    const contentInput = screen.getByPlaceholderText(/お問い合わせ内容をご記入ください/)
    await user.type(contentInput, 'テスト内容')

    const submitButton = screen.getByRole('button', { name: /送信する/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('送信完了')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('送信中はボタンが無効化される', async () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: async () => ({ id: 'contact-1' }),
          })
        }, 100)
      })
    )

    const user = userEvent.setup()
    render(<ContactPage />)

    const titleInput = screen.getByPlaceholderText(/イベント主催について/)
    await user.type(titleInput, 'テストタイトル')

    const nameInput = screen.getByPlaceholderText(/お名前またはニックネーム/)
    await user.type(nameInput, 'テストユーザー')

    const emailInput = screen.getByPlaceholderText(/example@email.com/)
    await user.type(emailInput, 'test@example.com')

    const contentInput = screen.getByPlaceholderText(/お問い合わせ内容をご記入ください/)
    await user.type(contentInput, 'テスト内容')

    const submitButton = screen.getByRole('button', { name: /送信する/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('送信中...')).toBeInTheDocument()
    })
  })

  it('エラーが発生した場合、エラーモーダルを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'タイトルは必須です' }),
    })

    const user = userEvent.setup()
    render(<ContactPage />)

    // 必須項目を入力せずに送信を試みる（HTML5のrequired属性により送信できない）
    // 代わりに、必須項目を入力してから送信
    const titleInput = screen.getByPlaceholderText(/イベント主催について/)
    await user.type(titleInput, 'テストタイトル')

    const nameInput = screen.getByPlaceholderText(/お名前またはニックネーム/)
    await user.type(nameInput, 'テストユーザー')

    const emailInput = screen.getByPlaceholderText(/example@email.com/)
    await user.type(emailInput, 'test@example.com')

    const contentInput = screen.getByPlaceholderText(/お問い合わせ内容をご記入ください/)
    await user.type(contentInput, 'テスト内容')

    const submitButton = screen.getByRole('button', { name: /送信する/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('送信エラー')).toBeInTheDocument()
    }, { timeout: 3000 })
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
    })

    render(<ContactPage />)
    const backLink = screen.getByText(/マイページへ戻る/)
    expect(backLink.closest('a')).toHaveAttribute('href', '/app/mypage')
  })

  it('未ログインの場合、トップページへの戻るリンクを表示する', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    render(<ContactPage />)
    const backLink = screen.getByText(/トップページへ戻る/)
    expect(backLink.closest('a')).toHaveAttribute('href', '/')
  })

  it('ログイン中の場合、キャンセルボタンがマイページへのリンクになっている', () => {
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
    })

    render(<ContactPage />)
    const cancelButton = screen.getByRole('link', { name: /キャンセル/i })
    expect(cancelButton).toHaveAttribute('href', '/app/mypage')
  })

  it('未ログインの場合、キャンセルボタンがトップページへのリンクになっている', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    render(<ContactPage />)
    const cancelButton = screen.getByRole('link', { name: /キャンセル/i })
    expect(cancelButton).toHaveAttribute('href', '/')
  })
})

