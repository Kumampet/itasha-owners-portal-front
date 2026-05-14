import { render, screen, waitFor } from '@/test-utils'
import GroupJoinPage from '../page'
import { useSession } from 'next-auth/react'

const mockReplace = jest.fn()
let mockSearchParams = new URLSearchParams()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/app/groups/join',
    query: {},
    asPath: '/app/groups/join',
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/app/groups/join',
}))

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

global.fetch = jest.fn()

describe('GroupJoinPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchParams = new URLSearchParams()
    ;(global.fetch as jest.Mock).mockClear()
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
  })

  it('未ログインの場合、ログインページへリダイレクトする', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    } as ReturnType<typeof useSession>)

    render(<GroupJoinPage />)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        '/app/auth?callbackUrl=%2Fapp%2Fgroups%2Fjoin'
      )
    })
  })

  it('団体コード入力フォームを表示する', async () => {
    render(<GroupJoinPage />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '既存の団体に加入する' })).toBeInTheDocument()
    })

    expect(screen.getByLabelText('団体コード（8桁）')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '加入する' })).toBeDisabled()
  })

  it('URLのgroupCodeを入力欄に反映する', async () => {
    mockSearchParams = new URLSearchParams('groupCode=12345678')

    render(<GroupJoinPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('団体コード（8桁）')).toHaveValue('12345678')
    })
  })
})
