import AppHomePage from '../page'

const mockRedirect = jest.fn()

jest.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url)
    throw new Error('NEXT_REDIRECT')
  },
}))

describe('AppHomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('マイページへリダイレクトする', () => {
    expect(() => AppHomePage()).toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/app/mypage')
  })
})
