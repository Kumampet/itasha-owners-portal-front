import { render, screen } from '@/test-utils'
import PrivacyPage from '../page'

describe('PrivacyPage', () => {
  it('プライバシーポリシーの見出しを表示する', () => {
    render(<PrivacyPage />)

    expect(
      screen.getByRole('heading', {
        name: '痛車オーナーズナビ（いたなび！）プライバシーポリシー',
      })
    ).toBeInTheDocument()
  })

  it('利用規約へのリンクを表示する', () => {
    render(<PrivacyPage />)

    const termLinks = screen.getAllByRole('link', { name: '利用規約' })
    expect(termLinks.length).toBeGreaterThan(0)
    expect(termLinks[0]).toHaveAttribute('href', '/term')
  })

  it('サイトヘッダーとフッターを表示する', () => {
    render(<PrivacyPage />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })
})
