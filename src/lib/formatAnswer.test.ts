import { describe, expect, it } from 'vitest'
import { SECTIONS } from '../content/questions'
import type { FieldDef } from '../content/questions'
import { formatAnswer } from './formatAnswer'

/** หยิบ field จริงจาก questions.ts — ทดสอบกับเนื้อหาจริง ไม่ใช่ fixture ปลอม */
function field(id: string): FieldDef {
  for (const section of SECTIONS) {
    const found = section.fields.find((f) => f.id === id)
    if (found) return found
  }
  throw new Error(`ไม่พบ field: ${id}`)
}

describe('formatAnswer', () => {
  it('ข้อความ: คืนค่าตามที่พิมพ์ และคืน null เมื่อว่าง/มีแต่ช่องว่าง', () => {
    expect(formatAnswer(field('fullName'), 'สมศรี ใจดี')).toBe('สมศรี ใจดี')
    expect(formatAnswer(field('fullName'), '   ')).toBeNull()
    expect(formatAnswer(field('fullName'), undefined)).toBeNull()
  })

  it('choice: แปลงรหัสเป็นข้อความตัวเลือก', () => {
    expect(formatAnswer(field('cpr'), { value: 'decline' })).toBe('ไม่ต้องการ')
    expect(formatAnswer(field('painControl'), { value: 'fullRelief' })).toBe(
      'ต้องการยาระงับปวดเต็มที่ แม้อาจทำให้ง่วงซึม',
    )
  })

  it('choice: รหัสที่ไม่มีในตัวเลือกคืน null (กันไฟล์แบบร่างที่ถูกแก้)', () => {
    expect(formatAnswer(field('cpr'), { value: 'ไม่ใช่รหัสจริง' })).toBeNull()
  })

  it('choice: ตัวเลือกที่มีช่องรายละเอียดแนบรายละเอียดต่อท้าย', () => {
    expect(
      formatAnswer(field('organDonation'), {
        value: 'registered',
        detail: 'สภากาชาดไทย',
      }),
    ).toBe('ลงทะเบียนไว้แล้ว (ลงทะเบียนไว้กับ สภากาชาดไทย)')
  })

  it('multichoice: ข้อละบรรทัด นำหน้าด้วย • รวมช่อง "อื่น ๆ"', () => {
    expect(
      formatAnswer(field('qualityOfLife'), {
        values: ['communicate', 'painFree'],
        other: 'ได้เห็นหลานโต',
      }),
    ).toBe(
      '• สื่อสารกับคนรอบข้างได้\n• ไม่เจ็บปวดทรมาน\n• อื่น ๆ: ได้เห็นหลานโต',
    )
  })

  it('multichoice: ไม่เลือกอะไรเลยคืน null', () => {
    expect(formatAnswer(field('qualityOfLife'), { values: [] })).toBeNull()
  })

  it('person: ชื่อ (ความสัมพันธ์) แล้วช่องทางติดต่อบรรทัดละช่องทาง', () => {
    expect(
      formatAnswer(field('proxy1'), {
        name: 'สมชาย ใจดี',
        relation: 'ลูกชาย',
        phone: '081-111-1111',
        phone2: '02-222-2222',
        lineId: 'somchai',
        facebook: '',
        email: 'somchai@example.com',
        otherContact: '',
      }),
    ).toBe(
      'สมชาย ใจดี (ลูกชาย)\nโทร 081-111-1111\nโทรสำรอง 02-222-2222\nLINE: somchai\nอีเมล: somchai@example.com',
    )
  })

  it('person: ทุกช่องว่างคืน null', () => {
    expect(
      formatAnswer(field('proxy1'), {
        name: '',
        relation: '',
        phone: '',
        phone2: '',
        lineId: '',
        facebook: '',
        email: '',
        otherContact: '',
      }),
    ).toBeNull()
  })

  it('checkbox: true คือ "ยืนยันแล้ว" อย่างอื่นคือ null', () => {
    expect(formatAnswer(field('proxyDiscussed'), true)).toBe('ยืนยันแล้ว')
    expect(formatAnswer(field('proxyDiscussed'), false)).toBeNull()
    expect(formatAnswer(field('proxyDiscussed'), undefined)).toBeNull()
  })
})
