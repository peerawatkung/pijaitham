import { describe, expect, it } from 'vitest'
import {
  ID_ALPHABET,
  ID_LENGTH,
  ID_PATTERN,
  generateDocId,
  parseDocPayload,
  sha256Hex,
  timingSafeEqual,
} from './_shared'

const validPayload = {
  v: 1,
  salt: 'c2FsdA==',
  iv: 'aXZpdml2aXZpdg==',
  data: 'ZW5jcnlwdGVkLWRhdGE=',
  authToken: 'abcDEF123456789_-abcDEF123456789',
}

describe('parseDocPayload — ตรวจ payload ฝั่งเซิร์ฟเวอร์', () => {
  it('รับ payload ที่ถูกต้อง', () => {
    expect(parseDocPayload(validPayload)).toEqual(validPayload)
  })

  it('ปฏิเสธเวอร์ชันไม่ตรง / field หาย / ชนิดผิด', () => {
    expect(parseDocPayload(null)).toBeNull()
    expect(parseDocPayload([])).toBeNull()
    expect(parseDocPayload({ ...validPayload, v: 2 })).toBeNull()
    expect(parseDocPayload({ ...validPayload, salt: undefined })).toBeNull()
    expect(parseDocPayload({ ...validPayload, data: 123 })).toBeNull()
  })

  it('ปฏิเสธ base64 ผิดรูปและ authToken สั้น/มีอักขระแปลก', () => {
    expect(parseDocPayload({ ...validPayload, data: 'ไม่ใช่ base64!' })).toBeNull()
    expect(parseDocPayload({ ...validPayload, authToken: 'สั้น' })).toBeNull()
    expect(
      parseDocPayload({ ...validPayload, authToken: 'has space in token!!' }),
    ).toBeNull()
  })

  it('ปฏิเสธ ciphertext ใหญ่เกินเพดาน', () => {
    expect(
      parseDocPayload({ ...validPayload, data: 'A'.repeat(300_001) }),
    ).toBeNull()
  })
})

describe('generateDocId — รหัสเอกสาร', () => {
  it('ยาว 10 ตัว ใช้เฉพาะอักษรในชุดที่กำหนด และไม่ซ้ำกันง่าย', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 200; i++) {
      const id = generateDocId()
      expect(id).toHaveLength(ID_LENGTH)
      expect(ID_PATTERN.test(id)).toBe(true)
      for (const ch of id) expect(ID_ALPHABET).toContain(ch)
      seen.add(id)
    }
    expect(seen.size).toBe(200)
  })
})

describe('sha256Hex / timingSafeEqual', () => {
  it('sha256Hex ตรงกับค่ามาตรฐาน', async () => {
    expect(await sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  it('timingSafeEqual เทียบถูก', () => {
    expect(timingSafeEqual('same', 'same')).toBe(true)
    expect(timingSafeEqual('same', 'diff')).toBe(false)
    expect(timingSafeEqual('short', 'longer-string')).toBe(false)
  })
})
