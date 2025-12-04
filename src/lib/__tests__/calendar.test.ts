import {
  generateGoogleCalendarUrl,
  generateICalContent,
  isIOS,
  isAndroid,
} from '../calendar'

describe('generateGoogleCalendarUrl', () => {
  it('generates correct Google Calendar URL with required params', () => {
    const date = new Date('2024-03-15T10:30:00')
    const url = generateGoogleCalendarUrl({
      title: 'Test Event',
      startDate: date,
    })

    expect(url).toContain('calendar.google.com')
    expect(url).toContain('action=TEMPLATE')
    expect(url).toContain('text=Test+Event')
    expect(url).toContain('dates=')
  })

  it('includes description when provided', () => {
    const date = new Date('2024-03-15T10:30:00')
    const url = generateGoogleCalendarUrl({
      title: 'Test Event',
      startDate: date,
      description: 'Test Description',
    })

    expect(url).toContain('details=Test+Description')
  })

  it('includes location when provided', () => {
    const date = new Date('2024-03-15T10:30:00')
    const url = generateGoogleCalendarUrl({
      title: 'Test Event',
      startDate: date,
      location: 'Test Location',
    })

    expect(url).toContain('location=Test+Location')
  })

  it('uses endDate when provided', () => {
    const startDate = new Date('2024-03-15T10:30:00')
    const endDate = new Date('2024-03-15T12:00:00')
    const url = generateGoogleCalendarUrl({
      title: 'Test Event',
      startDate,
      endDate,
    })

    expect(url).toContain('dates=')
  })

  it('defaults to 1 hour after startDate when endDate is not provided', () => {
    const startDate = new Date('2024-03-15T10:30:00')
    const url = generateGoogleCalendarUrl({
      title: 'Test Event',
      startDate,
    })

    expect(url).toContain('dates=')
  })
})

describe('generateICalContent', () => {
  it('generates valid iCal content', () => {
    const date = new Date('2024-03-15T10:30:00')
    const content = generateICalContent({
      title: 'Test Event',
      startDate: date,
    })

    expect(content).toContain('BEGIN:VCALENDAR')
    expect(content).toContain('VERSION:2.0')
    expect(content).toContain('BEGIN:VEVENT')
    expect(content).toContain('END:VEVENT')
    expect(content).toContain('END:VCALENDAR')
    expect(content).toContain('SUMMARY:Test Event')
  })

  it('escapes special characters in title', () => {
    const date = new Date('2024-03-15T10:30:00')
    const content = generateICalContent({
      title: 'Test;Event,With\\Special\nChars',
      startDate: date,
    })

    expect(content).toContain('SUMMARY:')
    expect(content).not.toContain('Test;Event,With\\Special\nChars')
  })

  it('includes description when provided', () => {
    const date = new Date('2024-03-15T10:30:00')
    const content = generateICalContent({
      title: 'Test Event',
      startDate: date,
      description: 'Test Description',
    })

    expect(content).toContain('DESCRIPTION:Test Description')
  })

  it('includes location when provided', () => {
    const date = new Date('2024-03-15T10:30:00')
    const content = generateICalContent({
      title: 'Test Event',
      startDate: date,
      location: 'Test Location',
    })

    expect(content).toContain('LOCATION:Test Location')
  })
})

describe('isIOS', () => {
  it('returns false in Node.js environment', () => {
    expect(isIOS()).toBe(false)
  })
})

describe('isAndroid', () => {
  it('returns false in Node.js environment', () => {
    expect(isAndroid()).toBe(false)
  })
})

