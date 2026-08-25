/**
 * โหมด "เก็บออนไลน์ (อิเล็กทรอนิกส์)" — ฝากเอกสารบนเซิร์ฟเวอร์แบบเข้ารหัส E2E
 *
 * ลำดับการทำงาน (ทุกอย่างเข้ารหัส/ถอดรหัสในเครื่องผู้ใช้ — ดู lib/e2ee.ts):
 * 1. บันทึก: เข้ารหัสคำตอบด้วยรหัสผ่านผู้ใช้ → ส่ง ciphertext ขึ้น /api/docs
 *    → ได้ "รหัสเอกสาร" 10 ตัว ไว้เปิดจากเครื่องไหนก็ได้
 * 2. เปิด: ดึง ciphertext ตามรหัสเอกสาร → ถอดรหัสด้วยรหัสผ่าน
 *    → ตรวจข้อมูลด้วย validation ชุดเดียวกับไฟล์แบบร่าง (parseDraft)
 * 3. จำ session (id + กุญแจ) ไว้ในหน่วยความจำ เพื่อ "บันทึกทับรหัสเดิม"
 *    ได้โดยไม่ต้องพิมพ์รหัสผ่านซ้ำ — ปิดหน้าเว็บแล้วหาย ไม่ถูกเก็บที่ไหน
 */
import { buildDraftFile, parseDraft } from './draft'
import {
  decryptDoc,
  deriveKeys,
  encryptWithKey,
  generateSalt,
  WrongPassphraseError,
} from './e2ee'
import type { EncryptedDoc } from './e2ee'
import type { FormAnswers } from '../types/form'

/** ข้อผิดพลาดที่แสดงต่อผู้ใช้ได้โดยตรง (ข้อความภาษาไทย) */
export class CloudDocError extends Error {}

/** แปลง error เป็นข้อความภาษาไทยสำหรับแสดงต่อผู้ใช้ */
export function cloudErrorMessage(err: unknown): string {
  console.error(err)
  return err instanceof CloudDocError
    ? err.message
    : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
}

const API_BASE = '/api/docs'
const NETWORK_MESSAGE =
  'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่'
const GENERIC_MESSAGE = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'

const ID_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ'
const ID_LENGTH = 10
const ID_PATTERN = new RegExp(`^[${ID_ALPHABET}]{${ID_LENGTH}}$`)

/** session ของเอกสารออนไลน์ปัจจุบัน — อยู่ในหน่วยความจำเท่านั้น */
interface CloudSession {
  id: string
  salt: Uint8Array
  key: CryptoKey
  authToken: string
}

let session: CloudSession | null = null

/** รหัสเอกสารที่กำลังทำงานด้วยใน session นี้ (ไว้แสดงปุ่ม "บันทึกทับ") */
export function currentCloudDocId(): string | null {
  return session?.id ?? null
}

export function clearCloudSession(): void {
  session = null
}

/** จัดรูปรหัสเอกสารให้อ่านง่าย: XXXXX-XXXXX */
export function formatDocCode(id: string): string {
  return `${id.slice(0, 5)}-${id.slice(5)}`
}

/** แปลงรหัสที่ผู้ใช้พิมพ์ (มี/ไม่มีขีด เว้นวรรค ตัวเล็ก) เป็นรหัสมาตรฐาน */
export function normalizeDocCode(input: string): string {
  const id = input.replace(/[\s-]+/g, '').toUpperCase()
  if (!ID_PATTERN.test(id)) {
    throw new CloudDocError(
      'รหัสเอกสารไม่ถูกต้อง — รหัสมี 10 ตัวอักษร/ตัวเลข เช่น ABCDE-23456',
    )
  }
  return id
}

async function callApi(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(path, init)
  } catch {
    throw new CloudDocError(NETWORK_MESSAGE)
  }
}

/** ดึงข้อความ error จากเซิร์ฟเวอร์ (ถ้ามี) — ใช้ fallback เมื่ออ่านไม่ได้ */
async function serverMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body: unknown = await res.json()
    if (
      typeof body === 'object' &&
      body !== null &&
      typeof (body as Record<string, unknown>)['error'] === 'string'
    ) {
      return (body as Record<string, string>)['error']
    }
  } catch {
    // body ไม่ใช่ JSON — ใช้ fallback
  }
  return fallback
}

function parseEncryptedDoc(raw: unknown): EncryptedDoc {
  if (
    typeof raw === 'object' &&
    raw !== null &&
    (raw as Record<string, unknown>)['v'] === 1 &&
    typeof (raw as Record<string, unknown>)['salt'] === 'string' &&
    typeof (raw as Record<string, unknown>)['iv'] === 'string' &&
    typeof (raw as Record<string, unknown>)['data'] === 'string'
  ) {
    const rec = raw as Record<string, string>
    return { v: 1, salt: rec['salt'], iv: rec['iv'], data: rec['data'] }
  }
  throw new CloudDocError(GENERIC_MESSAGE)
}

function answersToPlainText(answers: FormAnswers): string {
  return JSON.stringify(buildDraftFile(answers))
}

/**
 * เก็บเอกสารขึ้นเซิร์ฟเวอร์เป็นรหัสใหม่ — คืนรหัสเอกสาร 10 ตัว
 * ตั้ง session ให้บันทึกทับรหัสนี้ได้ตลอดจนกว่าจะปิดหน้าเว็บ
 */
export async function saveCloudDoc(
  answers: FormAnswers,
  passphrase: string,
): Promise<string> {
  const salt = generateSalt()
  const derived = await deriveKeys(passphrase, salt)
  const doc = await encryptWithKey(answersToPlainText(answers), derived.key, salt)

  const res = await callApi(API_BASE, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...doc, authToken: derived.authToken }),
  })
  if (!res.ok) {
    throw new CloudDocError(await serverMessage(res, GENERIC_MESSAGE))
  }
  const body: unknown = await res.json()
  const id =
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>)['id']
      : undefined
  if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
    throw new CloudDocError(GENERIC_MESSAGE)
  }

  session = { id, salt, key: derived.key, authToken: derived.authToken }
  return id
}

/** บันทึกทับรหัสเดิมใน session (รหัสผ่านเดิม ไม่ต้องพิมพ์ซ้ำ) */
export async function overwriteCloudDoc(answers: FormAnswers): Promise<void> {
  if (!session) {
    throw new CloudDocError(
      'ไม่พบรหัสเอกสารเดิมในหน้านี้ — กรุณาบันทึกเป็นรหัสใหม่',
    )
  }
  const doc = await encryptWithKey(
    answersToPlainText(answers),
    session.key,
    session.salt,
  )
  const res = await callApi(`${API_BASE}/${session.id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...doc, authToken: session.authToken }),
  })
  if (res.status === 404 || res.status === 403) {
    // เอกสารเดิมหาย/สิทธิ์ไม่ตรง — ล้าง session ให้ผู้ใช้บันทึกเป็นรหัสใหม่
    session = null
    throw new CloudDocError(
      'รหัสเดิมใช้ไม่ได้แล้ว (อาจถูกลบหรือหมดอายุ) — กรุณาบันทึกเป็นรหัสใหม่',
    )
  }
  if (!res.ok) {
    throw new CloudDocError(await serverMessage(res, GENERIC_MESSAGE))
  }
}

/** เปิดเอกสารจากรหัส + รหัสผ่าน — คืนคำตอบที่ผ่าน validation แล้ว */
export async function openCloudDoc(
  codeInput: string,
  passphrase: string,
): Promise<FormAnswers> {
  const id = normalizeDocCode(codeInput)
  const res = await callApi(`${API_BASE}/${id}`)
  if (res.status === 404) {
    throw new CloudDocError(
      'ไม่พบเอกสารตามรหัสนี้ — โปรดตรวจรหัสอีกครั้ง (เอกสารที่ไม่ได้เปิดเกิน 1 ปี หรือถูกลบไปแล้ว จะไม่อยู่บนเซิร์ฟเวอร์)',
    )
  }
  if (!res.ok) {
    throw new CloudDocError(await serverMessage(res, GENERIC_MESSAGE))
  }

  const doc = parseEncryptedDoc(await res.json())
  let plainText: string
  let derived: Awaited<ReturnType<typeof deriveKeys>>
  let salt: Uint8Array
  try {
    const result = await decryptDoc(doc, passphrase)
    plainText = result.plainText
    derived = result.derived
    salt = result.salt
  } catch (err) {
    if (err instanceof WrongPassphraseError) {
      throw new CloudDocError('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่')
    }
    throw new CloudDocError(GENERIC_MESSAGE)
  }

  let answers: FormAnswers
  try {
    answers = parseDraft(plainText)
  } catch {
    throw new CloudDocError('ข้อมูลเอกสารเสียหาย ไม่สามารถเปิดได้')
  }

  session = { id, salt, key: derived.key, authToken: derived.authToken }
  return answers
}

/** ลบเอกสารปัจจุบันออกจากเซิร์ฟเวอร์ถาวร (ต้องมี session จากการบันทึก/เปิด) */
export async function deleteCloudDoc(): Promise<void> {
  if (!session) {
    throw new CloudDocError('ไม่พบเอกสารที่จะลบในหน้านี้')
  }
  const res = await callApi(`${API_BASE}/${session.id}`, {
    method: 'DELETE',
    headers: { 'x-auth-token': session.authToken },
  })
  if (!res.ok && res.status !== 404) {
    throw new CloudDocError(await serverMessage(res, GENERIC_MESSAGE))
  }
  session = null
}
