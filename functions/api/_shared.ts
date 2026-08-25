/**
 * โค้ดร่วมของ API "เก็บออนไลน์" (Cloudflare Pages Functions)
 *
 * หลักการ: เซิร์ฟเวอร์เก็บเฉพาะข้อมูลที่เข้ารหัสจากเครื่องผู้ใช้แล้ว (E2EE)
 * - ไม่รู้เนื้อหาเอกสาร ไม่รู้รหัสผ่าน — เก็บ ciphertext + hash ของ auth token
 * - auth token (ได้จากรหัสผ่านผู้ใช้ฝั่ง client) ใช้ยืนยันสิทธิ์เขียนทับ/ลบ
 * - เอกสารหมดอายุเอง 3 ปีนับจากการใช้งานล่าสุด (KV TTL ต่ออายุทุกครั้งที่เปิด)
 *
 * ไฟล์ขึ้นต้นด้วย _ จะไม่ถูก map เป็น route โดย Pages Functions
 */

/** อายุเอกสารบนเซิร์ฟเวอร์ — 3 ปีนับจากการเขียน/เปิดครั้งล่าสุด */
export const DOC_TTL_SECONDS = 60 * 60 * 24 * 365 * 3

/**
 * รหัสเอกสาร: 10 ตัวจากชุดอักษรที่ตัดตัวสับสนออก (0/O, 1/I/L, U/V)
 * ≈ 49 บิต — เดาสุ่มไม่ไหว และข้อมูลที่ได้ไปก็เป็น ciphertext อยู่ดี
 */
export const ID_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ'
export const ID_LENGTH = 10
export const ID_PATTERN = new RegExp(`^[${ID_ALPHABET}]{${ID_LENGTH}}$`)

/**
 * v2: ตำแหน่งเอกสารแบบ derive จากอีเมล+รหัสผ่านฝั่ง client (hex 64 ตัว)
 * — client เป็นคนกำหนดตำแหน่งเอง (PUT upsert) เพราะรู้ตำแหน่งได้เฉพาะ
 * ผู้ที่มีทั้งอีเมลและรหัสผ่านเท่านั้น เซิร์ฟเวอร์ย้อนกลับเป็นอีเมลไม่ได้
 */
export const LOCATOR_PATTERN = /^[0-9a-f]{64}$/

/** id ที่ยอมรับ: รหัสเอกสาร 10 ตัว (v1) หรือ locator hex 64 ตัว (v2) */
export function isDocId(id: string): boolean {
  return ID_PATTERN.test(id) || LOCATOR_PATTERN.test(id)
}

/** ขนาด ciphertext สูงสุด (base64) — เอกสารจริงเล็กกว่านี้มาก กันการยัดไฟล์ใหญ่ */
const MAX_DATA_CHARS = 300_000
const MAX_BODY_CHARS = 400_000

// ---- ชนิดข้อมูลขั้นต่ำของ Cloudflare runtime (ไม่พึ่ง @cloudflare/workers-types) ----

export interface KVNamespaceLite {
  get(key: string): Promise<string | null>
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>
  delete(key: string): Promise<void>
}

export interface Env {
  /** KV binding — ถ้ายังไม่ผูก namespace ระบบเก็บออนไลน์จะปิดใช้งาน (503) */
  DOCS?: KVNamespaceLite
}

export interface RouteContext {
  request: Request
  env: Env
  params: Record<string, string | string[] | undefined>
  waitUntil(promise: Promise<unknown>): void
}

// ---- payload จาก client ----

/** ก้อนข้อมูลที่ client ส่งมาตอนสร้าง/เขียนทับ (ทุก field ผ่านการเข้ารหัสฝั่ง client แล้ว) */
export interface DocPayload {
  v: 1
  salt: string
  iv: string
  data: string
  authToken: string
}

/** สิ่งที่เก็บใน KV — authToken ถูกแปลงเป็น hash ก่อนเก็บ */
export interface StoredDoc {
  v: 1
  salt: string
  iv: string
  data: string
  authHash: string
  updatedAt: string
}

const BASE64_PATTERN = /^[A-Za-z0-9+/]+=*$/
const AUTH_TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,128}$/

function isBase64(value: unknown, maxChars: number): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= maxChars &&
    BASE64_PATTERN.test(value)
  )
}

/** ตรวจ payload อย่างเข้มงวด — คืน null ถ้าไม่ผ่าน */
export function parseDocPayload(raw: unknown): DocPayload | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
  const rec = raw as Record<string, unknown>
  if (rec['v'] !== 1) return null
  if (!isBase64(rec['salt'], 64)) return null
  if (!isBase64(rec['iv'], 32)) return null
  if (!isBase64(rec['data'], MAX_DATA_CHARS)) return null
  const authToken = rec['authToken']
  if (typeof authToken !== 'string' || !AUTH_TOKEN_PATTERN.test(authToken)) {
    return null
  }
  return {
    v: 1,
    salt: rec['salt'],
    iv: rec['iv'],
    data: rec['data'],
    authToken,
  }
}

/** อ่าน body เป็น payload ที่ตรวจแล้ว — เกินขนาด/ไม่ใช่ JSON/ผิดรูป = null */
export async function readDocPayload(
  request: Request,
): Promise<DocPayload | null> {
  let text: string
  try {
    text = await request.text()
  } catch {
    return null
  }
  if (text.length > MAX_BODY_CHARS) return null
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return null
  }
  return parseDocPayload(raw)
}

// ---- utilities ----

export function generateDocId(): string {
  const id: string[] = []
  while (id.length < ID_LENGTH) {
    const bytes = crypto.getRandomValues(new Uint8Array(ID_LENGTH * 2))
    for (const b of bytes) {
      // rejection sampling ให้ทุกตัวอักษรมีโอกาสเท่ากัน (30 ตัวจากช่วง 0–31)
      const idx = b & 31
      if (idx < ID_ALPHABET.length) {
        id.push(ID_ALPHABET[idx])
        if (id.length === ID_LENGTH) break
      }
    }
  }
  return id.join('')
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text),
  )
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** เทียบ string แบบเวลาคงที่ — กัน timing attack ตอนตรวจ auth token */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // ข้อมูลอ่อนไหว (แม้เข้ารหัสแล้ว) — ห้าม cache ทุกชั้น
      'cache-control': 'no-store',
    },
  })
}

export function errorJson(message: string, status: number): Response {
  return json({ error: message }, status)
}

/** เซิร์ฟเวอร์นี้ยังไม่ผูก KV — โหมดเก็บออนไลน์ปิดใช้งาน */
export function storageUnavailable(): Response {
  return errorJson(
    'ระบบเก็บออนไลน์ยังไม่เปิดใช้งานบนเซิร์ฟเวอร์นี้ กรุณาใช้การบันทึกไฟล์ลงเครื่องแทน',
    503,
  )
}

export const KV_PREFIX = 'doc:'
