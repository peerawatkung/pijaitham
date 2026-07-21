import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearStoredDraft,
  loadStoredDraft,
  saveStoredDraft,
} from './draftStorage'

/** localStorage จำลองแบบง่ายสำหรับ environment node */
function createMockStorage(): Storage {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size
    },
  }
}

describe('draftStorage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMockStorage())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('บันทึกแล้วอ่านกลับได้ครบ พร้อมเวลา savedAt', () => {
    const answers = { fullName: 'สมศรี ใจดี', handwritePersonal: true as const }
    expect(saveStoredDraft(answers)).toBe(true)
    const stored = loadStoredDraft()
    expect(stored?.answers).toEqual(answers)
    expect(typeof stored?.savedAt).toBe('string')
  })

  it('field ที่ไม่รู้จัก/ค่าผิดชนิด ถูกทิ้งตอนอ่าน (validation เดียวกับไฟล์ .json)', () => {
    localStorage.setItem(
      'pijaitham-draft',
      JSON.stringify({
        version: 1,
        savedAt: '2026-07-22T00:00:00.000Z',
        data: { fullName: 'สมศรี', unknownField: 'x', handwritePersonal: 'yes' },
      }),
    )
    expect(loadStoredDraft()?.answers).toEqual({ fullName: 'สมศรี' })
  })

  it('ร่างเสียหาย (JSON พัง) — คืน null และลบร่างทิ้ง', () => {
    localStorage.setItem('pijaitham-draft', '{not json')
    expect(loadStoredDraft()).toBeNull()
    expect(localStorage.getItem('pijaitham-draft')).toBeNull()
  })

  it('ไม่มีร่าง หรือร่างว่างเปล่า — คืน null', () => {
    expect(loadStoredDraft()).toBeNull()
    saveStoredDraft({})
    expect(loadStoredDraft()).toBeNull()
  })

  it('clearStoredDraft ลบร่างออกจากเครื่อง', () => {
    saveStoredDraft({ fullName: 'สมศรี' })
    clearStoredDraft()
    expect(loadStoredDraft()).toBeNull()
  })

  it('ไม่มี localStorage (เช่นถูกปิด) — save คืน false ไม่ throw', () => {
    vi.stubGlobal('localStorage', undefined)
    expect(saveStoredDraft({ fullName: 'สมศรี' })).toBe(false)
    expect(loadStoredDraft()).toBeNull()
  })
})
