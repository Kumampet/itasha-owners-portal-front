import { render, screen } from '@testing-library/react'
import EventDetailPage from '../page'
import { prisma } from '@/lib/prisma'

// モック設定
jest.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
      findUnique: jest.fn(),
    },
  },
}))

const mockNotFound = jest.fn()
jest.mock('next/navigation', () => ({
  notFound: () => {
    mockNotFound()
    throw new Error('notFound')
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/events/event-1',
    query: {},
    asPath: '/events/event-1',
  }),
}))

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
    update: jest.fn(),
  }),
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
    findUnique: jest.Mock
  }
}

describe('EventDetailPage', () => {
  const mockEvent = {
    id: 'event-1',
    name: 'テストイベント',
    description: 'テストイベントの説明です。',
    event_date: new Date('2024-12-31T10:00:00Z'),
    event_end_date: null,
    is_multi_day: false,
    approval_status: 'APPROVED',
    prefecture: '東京都',
    city: '渋谷区',
    street_address: 'テスト1-2-3',
    venue_name: 'テスト会場',
    keywords: ['痛車', 'イベント'],
    official_urls: ['https://example.com/event1'],
    image_url: 'https://example.com/image1.jpg',
    entry_selection_method: 'FIRST_COME',
    entries: [
      {
        entry_number: 1,
        entry_start_at: new Date('2024-11-01T00:00:00Z'),
        entry_start_public_at: null,
        entry_deadline_at: new Date('2024-12-01T23:59:59Z'),
        payment_due_type: 'FIXED',
        payment_due_at: new Date('2024-12-15T23:59:59Z'),
        payment_due_days_after_entry: null,
        payment_due_public_at: null,
      },
    ],
    tags: [
      { tag: { name: 'タグ1' } },
      { tag: { name: 'タグ2' } },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('イベント詳細を表示する', async () => {
    mockPrisma.event.findUnique.mockResolvedValue(mockEvent as never)

    const params = Promise.resolve({ slug: 'event-1' })
    const page = await EventDetailPage({ params })
    render(page)

    expect(screen.getByText('テストイベント')).toBeInTheDocument()
    expect(screen.getAllByText('テストイベントの説明です。').length).toBeGreaterThan(0)
  })

  it('イベントが見つからない場合、notFoundを呼び出す', async () => {
    mockPrisma.event.findUnique.mockResolvedValue(null)

    const params = Promise.resolve({ slug: 'non-existent' })
    
    await expect(EventDetailPage({ params })).rejects.toThrow('notFound')
    expect(mockNotFound).toHaveBeenCalled()
  })

  it('イベント名を表示する', async () => {
    mockPrisma.event.findUnique.mockResolvedValue(mockEvent as never)

    const params = Promise.resolve({ slug: 'event-1' })
    const page = await EventDetailPage({ params })
    render(page)

    expect(screen.getByText('テストイベント')).toBeInTheDocument()
  })

  it('イベント説明を表示する', async () => {
    mockPrisma.event.findUnique.mockResolvedValue(mockEvent as never)

    const params = Promise.resolve({ slug: 'event-1' })
    const page = await EventDetailPage({ params })
    render(page)

    expect(screen.getAllByText('テストイベントの説明です。').length).toBeGreaterThan(0)
  })

  it('イベント画像を表示する', async () => {
    mockPrisma.event.findUnique.mockResolvedValue(mockEvent as never)

    const params = Promise.resolve({ slug: 'event-1' })
    const page = await EventDetailPage({ params })
    render(page)

    const image = screen.getByAltText('テストイベント')
    expect(image).toHaveAttribute('src', 'https://example.com/image1.jpg')
  })

  it('キーワードを表示する', async () => {
    mockPrisma.event.findUnique.mockResolvedValue(mockEvent as never)

    const params = Promise.resolve({ slug: 'event-1' })
    const page = await EventDetailPage({ params })
    render(page)

    expect(screen.getByText('痛車')).toBeInTheDocument()
    expect(screen.getByText('イベント')).toBeInTheDocument()
  })

  it('タグを表示する', async () => {
    mockPrisma.event.findUnique.mockResolvedValue(mockEvent as never)

    const params = Promise.resolve({ slug: 'event-1' })
    const page = await EventDetailPage({ params })
    render(page)

    expect(screen.getByText('タグ1')).toBeInTheDocument()
    expect(screen.getByText('タグ2')).toBeInTheDocument()
  })

  it('開催情報を表示する', async () => {
    mockPrisma.event.findUnique.mockResolvedValue(mockEvent as never)

    const params = Promise.resolve({ slug: 'event-1' })
    const page = await EventDetailPage({ params })
    render(page)

    expect(screen.getByText(/開催情報/)).toBeInTheDocument()
    expect(screen.getAllByText(/東京都/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/テスト会場/).length).toBeGreaterThan(0)
  })

  it('エントリー情報を表示する', async () => {
    mockPrisma.event.findUnique.mockResolvedValue(mockEvent as never)

    const params = Promise.resolve({ slug: 'event-1' })
    const page = await EventDetailPage({ params })
    render(page)

    expect(screen.getByText(/エントリー/)).toBeInTheDocument()
    expect(screen.getByText(/開始/)).toBeInTheDocument()
    expect(screen.getByText(/締切/)).toBeInTheDocument()
  })

  it('公式サイトリンクを表示する', async () => {
    mockPrisma.event.findUnique.mockResolvedValue(mockEvent as never)

    const params = Promise.resolve({ slug: 'event-1' })
    const page = await EventDetailPage({ params })
    render(page)

    const link = screen.getByText('https://example.com/event1')
    expect(link.closest('a')).toHaveAttribute('href', 'https://example.com/event1')
    expect(link.closest('a')).toHaveAttribute('target', '_blank')
  })

  it('複数日のイベントの場合、終了日を表示する', async () => {
    const multiDayEvent = {
      ...mockEvent,
      event_end_date: new Date('2025-01-01T18:00:00Z'),
      is_multi_day: true,
    }

    mockPrisma.event.findUnique.mockResolvedValue(multiDayEvent as never)

    const params = Promise.resolve({ slug: 'event-1' })
    const page = await EventDetailPage({ params })
    render(page)

    expect(screen.getByText(/〜/)).toBeInTheDocument()
  })

  it('イベント一覧への戻るリンクを表示する', async () => {
    mockPrisma.event.findUnique.mockResolvedValue(mockEvent as never)

    const params = Promise.resolve({ slug: 'event-1' })
    const page = await EventDetailPage({ params })
    render(page)

    const backLink = screen.getByText(/イベント一覧に戻る/)
    expect(backLink.closest('a')).toHaveAttribute('href', '/events')
  })

  it('エントリー情報がない場合、未定を表示する', async () => {
    const eventWithoutEntries = {
      ...mockEvent,
      entries: [],
    }

    mockPrisma.event.findUnique.mockResolvedValue(eventWithoutEntries as never)

    const params = Promise.resolve({ slug: 'event-1' })
    const page = await EventDetailPage({ params })
    render(page)

    expect(screen.getByText(/未定/)).toBeInTheDocument()
  })

  it('支払期限を表示する', async () => {
    mockPrisma.event.findUnique.mockResolvedValue(mockEvent as never)

    const params = Promise.resolve({ slug: 'event-1' })
    const page = await EventDetailPage({ params })
    render(page)

    expect(screen.getByText(/支払期限/)).toBeInTheDocument()
  })
})

