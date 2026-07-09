import { describe, expect, it } from 'vitest'
import { DRAFT_VERSION } from '../types/form'
import type { FormAnswers } from '../types/form'
import { buildDraftFile, DraftError, parseDraft } from './draft'

/** คำตอบครบทุกชนิด field สำหรับทดสอบ round-trip */
const FULL_ANSWERS: FormAnswers = {
  fullName: 'สมศรี ใจดี',
  medicalNotes: 'เบาหวาน\nแพ้เพนิซิลลิน',
  handwritePersonal: true,
  qualityOfLife: { values: ['communicate', 'atHome'], other: 'ได้เห็นหลานโต' },
  cpr: { value: 'decline' },
  organDonation: { value: 'registered', detail: 'สภากาชาดไทย' },
  proxy1: {
    name: 'สมชาย ใจดี',
    relation: 'ลูกชาย',
    phone: '081-111-1111',
    phone2: '',
    lineId: 'somchai',
    facebook: 'Somchai J',
    email: 'somchai@example.com',
    otherContact: 'WhatsApp',
  },
  proxyDiscussed: true,
}

describe('draft round-trip', () => {
  it('บันทึกแล้วเปิดกลับมา ข้อมูลครบทุก field ทุกชนิด', () => {
    const file = buildDraftFile(FULL_ANSWERS)
    expect(file.version).toBe(DRAFT_VERSION)
    const parsed = parseDraft(JSON.stringify(file))
    expect(parsed).toEqual(FULL_ANSWERS)
  })
})

describe('draft validation — ไฟล์ผิดรูปแบบ', () => {
  it('ไม่ใช่ JSON', () => {
    expect(() => parseDraft('not json at all')).toThrow(DraftError)
    expect(() => parseDraft('not json at all')).toThrow(
      'ไฟล์นี้ไม่ใช่ไฟล์แบบร่างที่ถูกต้อง',
    )
  })

  it('JSON ที่ไม่ใช่โครงสร้างแบบร่าง', () => {
    expect(() => parseDraft('{"foo": 1}')).toThrow(
      'ไฟล์นี้ไม่ใช่ไฟล์แบบร่างของแอปนี้',
    )
  })

  it('เวอร์ชันใหม่กว่าแอป', () => {
    expect(() =>
      parseDraft(JSON.stringify({ version: 99, savedAt: 'x', data: {} })),
    ).toThrow('เวอร์ชันใหม่กว่า')
  })
})

describe('draft validation — ค่าเพี้ยนถูกทิ้ง ค่าดีรอด', () => {
  const parse = (data: Record<string, unknown>) =>
    parseDraft(JSON.stringify({ version: 1, savedAt: 'x', data }))

  it('field ที่ไม่รู้จักถูกทิ้ง', () => {
    expect(parse({ hackerField: 'x', fullName: 'ยังดี' })).toEqual({
      fullName: 'ยังดี',
    })
  })

  it('choice ที่รหัสไม่มีจริงถูกทิ้ง', () => {
    expect(parse({ cpr: { value: 'ไม่ใช่ตัวเลือกจริง' } })).toEqual({})
    expect(parse({ cpr: { value: 'want' } })).toEqual({
      cpr: { value: 'want' },
    })
  })

  it('multichoice กรองเฉพาะตัวเลือกจริง', () => {
    expect(
      parse({ qualityOfLife: { values: ['communicate', 'fake', 123] } }),
    ).toEqual({ qualityOfLife: { values: ['communicate'] } })
  })

  it('checkbox ต้องเป็น boolean true เท่านั้น', () => {
    expect(parse({ proxyDiscussed: 'true' })).toEqual({})
    expect(parse({ proxyDiscussed: true })).toEqual({ proxyDiscussed: true })
  })

  it('person ที่ type ผิดถูก normalize หรือทิ้ง', () => {
    expect(parse({ proxy1: { name: 42 } })).toEqual({})
  })

  it('แบบร่างเก่า (person 3 ช่อง ก่อนมีช่องทางติดต่อ) ยังเปิดได้ ช่องใหม่เป็นค่าว่าง', () => {
    const parsed = parse({
      proxy1: { name: 'สมหญิง', relation: 'ภรรยา', phone: '089' },
    })
    expect(parsed['proxy1']).toEqual({
      name: 'สมหญิง',
      relation: 'ภรรยา',
      phone: '089',
      phone2: '',
      lineId: '',
      facebook: '',
      email: '',
      otherContact: '',
    })
  })
})
