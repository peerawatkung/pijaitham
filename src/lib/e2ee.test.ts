import { describe, expect, it } from 'vitest'
import {
  decryptDoc,
  decryptWithKey,
  deriveIdentity,
  deriveKeys,
  encryptWithKey,
  fromBase64,
  generateSalt,
  normalizeEmail,
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

  it('deriveIdentity: อีเมล+รหัสผ่านเดิม = ตำแหน่ง/กุญแจเดิมเสมอ (ทุกรูปแบบการพิมพ์อีเมล)', async () => {
    const a = await deriveIdentity('Somsri@Gmail.com ', 'passphrase-123')
    const b = await deriveIdentity('somsri@gmail.com', 'passphrase-123')
    expect(a.locator).toBe(b.locator)
    expect(a.authToken).toBe(b.authToken)
    expect(a.locator).toMatch(/^[0-9a-f]{64}$/)

    // เข้ารหัสด้วยกุญแจของ a ต้องถอดได้ด้วยกุญแจของ b
    const doc = await encryptWithKey('ข้อความลับ', a.key, fromBase64(a.saltBase64))
    expect(await decryptWithKey(doc, b.key)).toBe('ข้อความลับ')
  })

  it('deriveIdentity: เปลี่ยนอีเมลหรือรหัสผ่าน = ตำแหน่งใหม่ทั้งชุด', async () => {
    const base = await deriveIdentity('somsri@gmail.com', 'passphrase-123')
    const otherEmail = await deriveIdentity('other@gmail.com', 'passphrase-123')
    const otherPass = await deriveIdentity('somsri@gmail.com', 'passphrase-456')
    expect(otherEmail.locator).not.toBe(base.locator)
    expect(otherPass.locator).not.toBe(base.locator)
    expect(otherEmail.authToken).not.toBe(base.authToken)
    expect(otherPass.authToken).not.toBe(base.authToken)
  })

  it('normalizeEmail ตัดช่องว่างและแปลงเป็นตัวเล็ก', () => {
    expect(normalizeEmail('  Somsri@GMAIL.com ')).toBe('somsri@gmail.com')
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
