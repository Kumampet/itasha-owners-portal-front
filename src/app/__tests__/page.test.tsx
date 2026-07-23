// @ts-nocheck
import { render, screen } from '@/test-utils'
import Home from '../page'

jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
  }
}))

describe('Home', () => {
  beforeEach(() => {
    jest.clearAllMocks()

  })

  it('ヒーロー文言とイベント一覧セクションを表示する', async () => {
    const page = await Home()
    render(page)

    expect(screen.getByText('次はどの痛車イベントに行こう___')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '新着イベント' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '開催が近いイベント' })).toBeInTheDocument()
  })

  it('イベントがない場合、空のメッセージを表示する', async () => {
    const page = await Home()
    render(page)

    expect(screen.getByText('直近開催予定のイベントがありません。')).toBeInTheDocument()
    expect(screen.getByText('まだ公開中の新着イベントがありません。')).toBeInTheDocument()
  })

  it('取得したイベントを新着・開催が近い一覧に表示する', async () => {
    const mockEvent = {
      id: 'event-1',
      name: 'テストイベント',
      description: 'テスト説明',
      event_date: new Date('2026-12-31T10:00:00Z'),
      event_end_date: null,
      is_multi_day: false,
      image_url: null,
    }

    mockPrisma.event.findMany
      .mockResolvedValueOnce([mockEvent])
      .mockResolvedValueOnce([mockEvent])

    const page = await Home()
    render(page)

    expect(screen.getAllByText('テストイベント').length).toBeGreaterThanOrEqual(1)
  })

  it('当日開催のイベントに「本日開催」バッジを表示する', async () => {
    // 2026-05-19 JST 00:00 = 2026-05-18T15:00:00Z
    jest.useFakeTimers({ now: new Date('2026-05-19T03:00:00Z') })
    const mockEvent = {
      id: 'event-today',
      name: '本日のイベント',
      description: '',
      event_date: new Date('2026-05-18T15:00:00Z'), // JST 2026-05-19 00:00
      event_end_date: null,
      is_multi_day: false,
      image_url: null,
    }

    mockPrisma.event.findMany
      .mockResolvedValueOnce([mockEvent])
      .mockResolvedValueOnce([mockEvent])

    const page = await Home()
    render(page)

    expect(screen.getAllByText('本日開催').length).toBeGreaterThanOrEqual(1)
    jest.useRealTimers()
  })

  it('7日以内のイベントに「あとN日」バッジを表示する', async () => {
    jest.useFakeTimers({ now: new Date('2026-05-19T03:00:00Z') }) // JST 2026-05-19
    const mockEvent = {
      id: 'event-future',
      name: '未来のイベント',
      description: '',
      event_date: new Date('2026-05-20T15:00:00Z'), // JST 2026-05-21 00:00 → あと2日
      event_end_date: null,
      is_multi_day: false,
      image_url: null,
    }

    mockPrisma.event.findMany
      .mockResolvedValueOnce([mockEvent])
      .mockResolvedValueOnce([mockEvent])

    const page = await Home()
    render(page)

    expect(screen.getAllByText('あと2日').length).toBeGreaterThanOrEqual(1)
    jest.useRealTimers()
  })

  it('会期中の複数日イベントに「開催中」バッジを表示する', async () => {
    jest.useFakeTimers({ now: new Date('2026-05-19T03:00:00Z') }) // JST 2026-05-19
    const mockEvent = {
      id: 'event-ongoing',
      name: '開催中イベント',
      description: '',
      event_date: new Date('2026-05-17T15:00:00Z'), // JST 2026-05-18 00:00（開始済み）
      event_end_date: new Date('2026-05-19T15:00:00Z'), // JST 2026-05-20 00:00（明日まで）
      is_multi_day: true,
      image_url: null,
    }

    mockPrisma.event.findMany
      .mockResolvedValueOnce([mockEvent])
      .mockResolvedValueOnce([mockEvent])

    const page = await Home()
    render(page)

    expect(screen.getAllByText('開催中').length).toBeGreaterThanOrEqual(1)
    jest.useRealTimers()
  })
})
