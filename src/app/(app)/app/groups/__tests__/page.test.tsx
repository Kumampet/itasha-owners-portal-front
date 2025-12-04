import { render, screen, waitFor } from '@testing-library/react'
import GroupsPage from '../page'

// モック設定
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/app/groups',
    query: {},
    asPath: '/app/groups',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/app/groups',
}))

// グローバルfetchのモック
global.fetch = jest.fn()

describe('GroupsPage', () => {
  const mockGroups = [
    {
      id: 'group-1',
      name: 'テスト団体1',
      theme: 'テストテーマ1',
      groupCode: 'ABC12345',
      maxMembers: 10,
      memberCount: 3,
      isLeader: true,
      event: {
        id: 'event-1',
        name: 'テストイベント1',
        event_date: '2024-12-31',
      },
      leader: {
        id: 'user-1',
        name: 'リーダー1',
        email: 'leader1@example.com',
      },
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'group-2',
      name: 'テスト団体2',
      theme: null,
      groupCode: 'DEF67890',
      maxMembers: null,
      memberCount: 5,
      isLeader: false,
      event: {
        id: 'event-2',
        name: 'テストイベント2',
        event_date: '2025-01-15',
      },
      leader: {
        id: 'user-2',
        name: 'リーダー2',
        email: 'leader2@example.com',
      },
      createdAt: '2024-01-02T00:00:00Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('ローディング状態を表示する', () => {
    ;(global.fetch as jest.Mock).mockImplementation(() =>
      new Promise(() => {}) // 解決しないPromiseでローディング状態を維持
    )

    render(<GroupsPage />)
    expect(screen.getByLabelText('読み込み中')).toBeInTheDocument()
  })

  it('団体が空の場合、空のメッセージを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<GroupsPage />)

    await waitFor(() => {
      expect(
        screen.getByText(/まだ団体は登録されていません/)
      ).toBeInTheDocument()
    })
  })

  it('団体一覧を表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockGroups,
    })

    render(<GroupsPage />)

    await waitFor(() => {
      expect(screen.getByText('テスト団体1')).toBeInTheDocument()
    })

    expect(screen.getByText('テスト団体2')).toBeInTheDocument()
    expect(screen.getByText('テストテーマ1')).toBeInTheDocument()
    // イベント名は日付と一緒に表示されるため、部分一致で検索
    expect(screen.getByText(/テストイベント1/)).toBeInTheDocument()
    expect(screen.getByText(/テストイベント2/)).toBeInTheDocument()
  })

  it('オーナーの場合、オーナーバッジを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockGroups,
    })

    render(<GroupsPage />)

    await waitFor(() => {
      const ownerBadges = screen.getAllByText('オーナー')
      expect(ownerBadges.length).toBeGreaterThan(0)
    })
  })

  it('オーナーでない場合、オーナーバッジを表示しない', async () => {
    const nonLeaderGroups = mockGroups.map((g) => ({ ...g, isLeader: false }))

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => nonLeaderGroups,
    })

    render(<GroupsPage />)

    await waitFor(() => {
      expect(screen.getByText('テスト団体1')).toBeInTheDocument()
    })

    // ヘッダー部分の「オーナー」は表示されない（団体カード内のみ）
    const ownerBadges = screen.queryAllByText('オーナー')
    expect(ownerBadges.length).toBe(0)
  })

  it('メンバー数を表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockGroups,
    })

    render(<GroupsPage />)

    await waitFor(() => {
      expect(screen.getByText(/メンバー: 3/)).toBeInTheDocument()
      expect(screen.getByText(/メンバー: 5/)).toBeInTheDocument()
    })
  })

  it('最大メンバー数が設定されている場合、表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockGroups,
    })

    render(<GroupsPage />)

    await waitFor(() => {
      expect(screen.getByText(/メンバー: 3 \/ 10/)).toBeInTheDocument()
    })
  })

  it('最大メンバー数が設定されていない場合、制限なしと表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockGroups,
    })

    render(<GroupsPage />)

    await waitFor(() => {
      expect(screen.getByText(/メンバー: 5/)).toBeInTheDocument()
      // 最大メンバー数の表示がないことを確認
      expect(screen.queryByText(/メンバー: 5 \//)).not.toBeInTheDocument()
    })
  })

  it('テーマが設定されている場合、表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockGroups,
    })

    render(<GroupsPage />)

    await waitFor(() => {
      expect(screen.getByText('テストテーマ1')).toBeInTheDocument()
    })
  })

  it('テーマが設定されていない場合、表示しない', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockGroups,
    })

    render(<GroupsPage />)

    await waitFor(() => {
      expect(screen.getByText('テスト団体2')).toBeInTheDocument()
    })

    // テーマがnullの団体にはテーマが表示されない
    const themeTexts = screen.getAllByText('テストテーマ1')
    expect(themeTexts.length).toBe(1) // 1つ目の団体のみ
  })

  it('新規団体作成ボタンを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockGroups,
    })

    render(<GroupsPage />)

    await waitFor(() => {
      expect(screen.getByText('新規団体を作成')).toBeInTheDocument()
    })
  })

  it('新規団体作成ボタンがリンクになっている', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockGroups,
    })

    render(<GroupsPage />)

    await waitFor(() => {
      const createButton = screen.getByText('新規団体を作成')
      expect(createButton.closest('a')).toHaveAttribute('href', '/app/groups/new')
    })
  })

  it('団体カードがリンクになっている', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockGroups,
    })

    render(<GroupsPage />)

    await waitFor(() => {
      const groupCard = screen.getByText('テスト団体1').closest('a')
      expect(groupCard).toHaveAttribute('href', '/app/groups/group-1')
    })
  })

  it('エラーが発生した場合、エラーログを出力する', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<GroupsPage />)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch groups:',
        expect.any(Error)
      )
    })

    consoleErrorSpy.mockRestore()
  })

  it('一斉連絡ポリシーを表示する', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockGroups,
    })

    render(<GroupsPage />)

    await waitFor(() => {
      expect(screen.getByText('一斉連絡ポリシー')).toBeInTheDocument()
    })

    expect(
      screen.getByText(/一斉連絡.*として投稿すると/)
    ).toBeInTheDocument()
  })
})

