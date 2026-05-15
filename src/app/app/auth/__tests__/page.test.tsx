import { render, screen } from '@/test-utils'
import AuthPage from '../page'

let mockSearchParams = new URLSearchParams()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/app/auth',
}))

describe('AuthPage', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams()
  })

  it('ログイン方法の選択肢を表示する', () => {
    render(<AuthPage />)

    expect(screen.getByRole('heading', { name: 'ログイン / 新規登録' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Googleで利用する' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Xアカウントで利用する' })).toBeInTheDocument()
  })

  it('団体招待リンクからのアクセス時、案内メッセージを表示する', () => {
    mockSearchParams = new URLSearchParams(
      'callbackUrl=' + encodeURIComponent('/app/groups/join?groupCode=12345678')
    )

    render(<AuthPage />)

    expect(screen.getByText(/団体への招待リンクからアクセスされました/)).toBeInTheDocument()
  })
})
