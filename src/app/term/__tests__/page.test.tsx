import { render, screen } from '@/test-utils'
import TermPage from '../page'

describe('TermPage', () => {
  it('利用規約の見出しを表示する', () => {
    render(<TermPage />)

    expect(
      screen.getByRole('heading', {
        name: '痛車オーナーズナビ（いたなび！）利用規約',
      })
    ).toBeInTheDocument()
  })

  it('サイトヘッダーとフッターを表示する', () => {
    render(<TermPage />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })
})
