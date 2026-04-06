import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NotificationSettingsPage from '../page'
import { useSession } from 'next-auth/react'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/app/notification-settings',
    query: {},
    asPath: '/app/notification-settings',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/app/notification-settings',
}))

jest.mock('next-auth/react')

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

const mockSettings = {
  id: 'ns-1',
  user_id: 'user-1',
  browser_notification_enabled: true,
  email_notification_enabled: true,
  group_message_unread_notification_enabled: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

global.fetch = jest.fn()

describe('NotificationSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'テスト',
          email: 'test@example.com',
          role: 'USER',
          isBanned: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'authenticated',
      update: jest.fn(),
    })
  })

  it('認証後に通知設定の見出しとトグルを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockSettings,
    })

    render(<NotificationSettingsPage />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '通知設定' })).toBeInTheDocument()
    })

    expect(screen.getByText('メール通知の許可')).toBeInTheDocument()
    expect(screen.getByText('団体メッセージ未読通知')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /戻る/ })).toBeInTheDocument()
  })

  it('メール通知をOFFにするとPATCHで更新する', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSettings,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockSettings,
          email_notification_enabled: false,
        }),
      })

    render(<NotificationSettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('メール通知の許可')).toBeInTheDocument()
    })

    const toggles = screen.getAllByRole('checkbox', { hidden: true })
    const emailToggle = toggles[0]
    await user.click(emailToggle)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/user/notification-settings',
        expect.objectContaining({ method: 'PATCH' })
      )
    })
  })
})
