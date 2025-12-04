import { render, screen } from '@testing-library/react'
import AdminDashboard from '../page'
import { useSession } from 'next-auth/react'

// モック設定
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/admin/dashboard',
    query: {},
    asPath: '/admin/dashboard',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/admin/dashboard',
}))

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('ダッシュボードのタイトルを表示する', () => {
    mockUseSession.mockReturnValue({
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
    })

    render(<AdminDashboard />)
    expect(screen.getByText('オーガナイザー機能 ダッシュボード')).toBeInTheDocument()
  })

  it('管理者のメールアドレスを表示する', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'テストユーザー',
          email: 'admin@example.com',
          role: 'ADMIN',
          isBanned: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<AdminDashboard />)
    expect(screen.getByText(/管理者: admin@example.com/)).toBeInTheDocument()
  })

  it('一般メニュー項目を表示する', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'テストユーザー',
          email: 'test@example.com',
          role: 'ORGANIZER',
          isBanned: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<AdminDashboard />)
    expect(screen.getByText('イベント管理')).toBeInTheDocument()
    expect(screen.getByText('新規イベントを作成')).toBeInTheDocument()
  })

  it('ADMIN権限の場合、管理者専用メニュー項目を表示する', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'テストユーザー',
          email: 'admin@example.com',
          role: 'ADMIN',
          isBanned: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<AdminDashboard />)
    expect(screen.getByText('ユーザー管理')).toBeInTheDocument()
    expect(screen.getByText('イベント掲載依頼フォーム')).toBeInTheDocument()
    expect(screen.getByText('お問い合わせ管理')).toBeInTheDocument()
    expect(screen.getByText('団体モデレーション')).toBeInTheDocument()
    expect(screen.getByText('オーガナイザーアカウント作成')).toBeInTheDocument()
  })

  it('ORGANIZER権限の場合、管理者専用メニュー項目を表示しない', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'テストユーザー',
          email: 'organizer@example.com',
          role: 'ORGANIZER',
          isBanned: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<AdminDashboard />)
    expect(screen.queryByText('ユーザー管理')).not.toBeInTheDocument()
    expect(screen.queryByText('イベント掲載依頼フォーム')).not.toBeInTheDocument()
  })

  it('メニュー項目がリンクになっている', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'テストユーザー',
          email: 'test@example.com',
          role: 'ORGANIZER',
          isBanned: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<AdminDashboard />)
    const eventManagementLink = screen.getByText('イベント管理').closest('a')
    expect(eventManagementLink).toHaveAttribute('href', '/admin/events')

    const newEventLink = screen.getByText('新規イベントを作成').closest('a')
    expect(newEventLink).toHaveAttribute('href', '/admin/events/new')
  })

  it('メニュー項目の説明を表示する', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'テストユーザー',
          email: 'test@example.com',
          role: 'ORGANIZER',
          isBanned: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<AdminDashboard />)
    expect(screen.getByText('イベントの承認、作成、編集、削除')).toBeInTheDocument()
    expect(screen.getByText('新しいイベントを作成')).toBeInTheDocument()
  })

  it('管理者専用メニュー項目のリンクを表示する', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'テストユーザー',
          email: 'admin@example.com',
          role: 'ADMIN',
          isBanned: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<AdminDashboard />)
    const usersLink = screen.getByText('ユーザー管理').closest('a')
    expect(usersLink).toHaveAttribute('href', '/admin/users')

    const submissionsLink = screen.getByText('イベント掲載依頼フォーム').closest('a')
    expect(submissionsLink).toHaveAttribute('href', '/admin/submissions')
  })
})

