import { describe, expect, it } from 'vitest'
import { safeFileSlug, ymd } from './download'

describe('safeFileSlug', () => {
  it('แทนช่องว่างและอักขระต้องห้ามด้วยขีด', () => {
    expect(safeFileSlug('สมศรี ใจดี')).toBe('สมศรี-ใจดี')
    expect(safeFileSlug('a/b\\c:d*e?f"g<h>i|j')).toBe('a-b-c-d-e-f-g-h-i-j')
  })

  it('ตัดขีดหัวท้ายออก', () => {
    expect(safeFileSlug('  สมศรี  ')).toBe('สมศรี')
    expect(safeFileSlug('///')).toBe('')
  })
})

describe('ymd', () => {
  it('รูปแบบ YYYYMMDD เติมศูนย์ครบ', () => {
    expect(ymd(new Date(2026, 6, 9))).toBe('20260709')
    expect(ymd(new Date(2026, 0, 1))).toBe('20260101')
  })
})
