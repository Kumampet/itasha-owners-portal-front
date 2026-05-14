import { render, screen } from '@testing-library/react'
import OrganizerApplicationPage from '../page'
import { useSession } from 'next-auth/react'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/app/organizer-application',
    query: {},
    asPath: '/app/organizer-application',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/app/organizer-application',
}))

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

describe('OrganizerApplicationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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

  it('申請前の説明と同意チェックを表示する', () => {
    render(<OrganizerApplicationPage />)

    expect(screen.getByRole('heading', { name: 'オーガナイザー登録申請' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'オーガナイザー登録とは？' })).toBeInTheDocument()
    expect(screen.getByLabelText('上記の同意事項に同意します')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '申請フォームへ進む' })).toBeDisabled()
  })
})
