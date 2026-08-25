/**
 * เข้ารหัส/ถอดรหัสเอกสารในเครื่องผู้ใช้ (end-to-end encryption)
 * สำหรับโหมด "เก็บออนไลน์" — เซิร์ฟเวอร์เห็นเฉพาะข้อมูลที่เข้ารหัสแล้ว
 * รหัสผ่านและกุญแจไม่เคยออกจากเครื่องผู้ใช้
 *
 * โครงสร้าง:
 * - PBKDF2-SHA256 (310,000 รอบ) จากรหัสผ่าน + salt → 512 บิต
 *   ครึ่งแรก = กุญแจ AES-256-GCM (เข้ารหัสเนื้อหา)
 *   ครึ่งหลัง = auth token ส่งให้เซิร์ฟเวอร์ (เก็บเป็น hash) ใช้ยืนยันสิทธิ์
 *   เขียนทับ/ลบเอกสาร — เซิร์ฟเวอร์ไม่มีทางย้อนกลับเป็นรหัสผ่านหรือกุญแจได้
 * - GCM ให้ทั้งความลับและการตรวจว่าเนื้อหาไม่ถูกแก้ (ถอดด้วยรหัสผ่านผิด = error)
 */

export const PASSPHRASE_MIN_LENGTH = 8
export const PBKDF2_ITERATIONS = 310_000

const SALT_BYTES = 16
const IV_BYTES = 12

/** ก้อนข้อมูลเข้ารหัสที่ส่งขึ้น/ลงจากเซิร์ฟเวอร์ (ทุก field เป็น base64) */
export interface EncryptedDoc {
  v: 1
  salt: string
  iv: string
  data: string
}

export interface DerivedKeys {
  /** กุญแจ AES-GCM (non-extractable — อยู่ในหน่วยความจำของเบราว์เซอร์เท่านั้น) */
  key: CryptoKey
  /** token ยืนยันสิทธิ์เขียนทับ/ลบ (base64url) */
  authToken: string
}

/** รหัสผ่านไม่ถูกต้อง (ถอดรหัสไม่ผ่านการตรวจสอบของ GCM) */
export class WrongPassphraseError extends Error {
  constructor() {
    super('รหัสผ่านไม่ถูกต้อง')
  }
}

export function toBase64(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

export function fromBase64(text: string): Uint8Array {
  const bin = atob(text)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function toBase64Url(bytes: Uint8Array): string {
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_BYTES))
}

/** สร้างกุญแจเข้ารหัส + auth token จากรหัสผ่านและ salt */
export async function deriveKeys(
  passphrase: string,
  salt: Uint8Array,
): Promise<DerivedKeys> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS },
      material,
      512,
    ),
  )
  const key = await crypto.subtle.importKey(
    'raw',
    bits.slice(0, 32),
    'AES-GCM',
    false,
    ['encrypt', 'decrypt'],
  )
  return { key, authToken: toBase64Url(bits.slice(32)) }
}

/** เข้ารหัสข้อความด้วยกุญแจที่ derive ไว้แล้ว (สุ่ม IV ใหม่ทุกครั้ง) */
export async function encryptWithKey(
  plainText: string,
  key: CryptoKey,
  salt: Uint8Array,
): Promise<EncryptedDoc> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plainText),
  )
  return {
    v: 1,
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(cipher)),
  }
}

/** ถอดรหัสก้อนข้อมูลด้วยรหัสผ่าน — รหัสผิด/ข้อมูลถูกแก้ = WrongPassphraseError */
export async function decryptDoc(
  doc: EncryptedDoc,
  passphrase: string,
): Promise<{ plainText: string; derived: DerivedKeys; salt: Uint8Array }> {
  const salt = fromBase64(doc.salt)
  const derived = await deriveKeys(passphrase, salt)
  let plain: ArrayBuffer
  try {
    plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(doc.iv) },
      derived.key,
      fromBase64(doc.data),
    )
  } catch {
    throw new WrongPassphraseError()
  }
  return { plainText: new TextDecoder().decode(plain), derived, salt }
}
