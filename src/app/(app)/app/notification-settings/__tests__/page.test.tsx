import { render, screen } from '@testing-library/react'
import NotificationSettingsPage from '../page'

// モック設定
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

describe('NotificationSettingsPage', () => {
  it('通知設定ページのタイトルを表示する', () => {
    render(<NotificationSettingsPage />)
    expect(screen.getByText('通知設定')).toBeInTheDocument()
  })

  it('実装中のメッセージを表示する', () => {
    render(<NotificationSettingsPage />)
    expect(screen.getByText(/通知設定機能は現在実装中です/)).toBeInTheDocument()
  })

  it('マイページへの戻るリンクを表示する', () => {
    render(<NotificationSettingsPage />)
    const backLink = screen.getByText(/マイページへ戻る/)
    expect(backLink.closest('a')).toHaveAttribute('href', '/app/mypage')
  })
})

