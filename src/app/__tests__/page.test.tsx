import { render, screen } from '@/test-utils'
import Home from '../page'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

const mockPrisma = prisma as unknown as {
  event: {
    findMany: jest.Mock
  }
}

describe('Home', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.event.findMany.mockResolvedValue([])
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
})
