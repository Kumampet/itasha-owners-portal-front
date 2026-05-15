import { render, screen } from '@/test-utils'
import AboutPage from '../page'
import { SERVICE_OVERVIEW_ITEMS } from '@/content/service-overview'

describe('AboutPage', () => {
  it('サービス概要の見出しと説明を表示する', () => {
    render(<AboutPage />)

    expect(screen.getByRole('heading', { name: 'いたなび！サービス概要' })).toBeInTheDocument()
    expect(
      screen.getByText(/いたなび！が痛車オーナーのみなさまに提供している価値/)
    ).toBeInTheDocument()
  })

  it('サービス概要の各セクションを表示する', () => {
    render(<AboutPage />)

    for (const item of SERVICE_OVERVIEW_ITEMS) {
      expect(screen.getByRole('heading', { name: item.title })).toBeInTheDocument()
    }
  })

  it('トップへ戻るリンクを表示する', () => {
    render(<AboutPage />)

    const backLink = screen.getByRole('link', { name: '← トップへ戻る' })
    expect(backLink).toHaveAttribute('href', '/')
  })
})
