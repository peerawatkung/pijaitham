import { describe, expect, it } from 'vitest'
import {
  decryptDoc,
  deriveKeys,
  encryptWithKey,
  fromBase64,
  generateSalt,
  toBase64,
  WrongPassphraseError,
} from './e2ee'

describe('e2ee — เข้ารหัส/ถอดรหัสในเครื่องผู้ใช้', () => {
  it('เข้ารหัสแล้วถอดกลับได้ข้อความเดิม (รวมภาษาไทย)', async () => {
    const salt = generateSalt()
    const { key } = await deriveKeys('รหัสผ่านทดสอบ123', salt)
    const plain = JSON.stringify({ msg: 'น้ำใจ ที่สุด ปู่ย่า 💚' })
    const doc = await encryptWithKey(plain, key, salt)

    const result = await decryptDoc(doc, 'รหัสผ่านทดสอบ123')
    expect(result.plainText).toBe(plain)
  })

  it('รหัสผ่านผิด = WrongPassphraseError', async () => {
    const salt = generateSalt()
    const { key } = await deriveKeys('correct-password', salt)
    const doc = await encryptWithKey('ข้อมูลลับ', key, salt)

    await expect(decryptDoc(doc, 'wrong-password')).rejects.toBeInstanceOf(
      WrongPassphraseError,
    )
  })

  it('ciphertext ถูกดัดแปลง = ถอดไม่ผ่าน (GCM ตรวจจับ)', async () => {
    const salt = generateSalt()
    const { key } = await deriveKeys('correct-password', salt)
    const doc = await encryptWithKey('ข้อมูลลับ', key, salt)
    const bytes = fromBase64(doc.data)
    bytes[0] = bytes[0] ^ 0xff
    const tampered = { ...doc, data: toBase64(bytes) }

    await expect(
      decryptDoc(tampered, 'correct-password'),
    ).rejects.toBeInstanceOf(WrongPassphraseError)
  })

  it('เข้ารหัสซ้ำได้ IV/ciphertext ใหม่ทุกครั้ง (ไม่ซ้ำเดิม)', async () => {
    const salt = generateSalt()
    const { key } = await deriveKeys('correct-password', salt)
    const a = await encryptWithKey('ข้อความเดียวกัน', key, salt)
    const b = await encryptWithKey('ข้อความเดียวกัน', key, salt)
    expect(a.iv).not.toBe(b.iv)
    expect(a.data).not.toBe(b.data)
  })

  it('authToken เป็น base64url และเปลี่ยนตาม salt/รหัสผ่าน', async () => {
    const salt1 = generateSalt()
    const salt2 = generateSalt()
    const a = await deriveKeys('password-one', salt1)
    const b = await deriveKeys('password-one', salt2)
    const c = await deriveKeys('password-two', salt1)

    expect(a.authToken).toMatch(/^[A-Za-z0-9_-]{20,}$/)
    expect(a.authToken).not.toBe(b.authToken)
    expect(a.authToken).not.toBe(c.authToken)
  })
})
