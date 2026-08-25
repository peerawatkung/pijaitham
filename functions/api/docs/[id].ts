/**
 * /api/docs/:id — เปิด / เขียนทับ / ลบ เอกสารที่ฝากไว้ (ciphertext เท่านั้น)
 *
 * GET    : คืนก้อนข้อมูลเข้ารหัส (ไม่ต้องยืนยันตัวตน — รหัสเอกสารเดายาก
 *          และเนื้อหาอ่านไม่ได้หากไม่มีรหัสผ่านของเจ้าของ) + ต่ออายุ 1 ปี
 * PUT    : เขียนทับ — ต้องมี authToken ตรงกับ hash ที่เก็บไว้
 * DELETE : ลบถาวร — ต้องมี authToken ใน header `x-auth-token`
 */
import {
  DOC_TTL_SECONDS,
  KV_PREFIX,
  LOCATOR_PATTERN,
  errorJson,
  isDocId,
  json,
  readDocPayload,
  sha256Hex,
  storageUnavailable,
  timingSafeEqual,
} from '../_shared'
import type { KVNamespaceLite, RouteContext, StoredDoc } from '../_shared'

const NOT_FOUND_MESSAGE =
  'ไม่พบเอกสารตามรหัสนี้ — รหัสอาจไม่ถูกต้อง หรือเอกสารถูกลบ/หมดอายุไปแล้ว'

function docId(ctx: RouteContext): string | null {
  const raw = ctx.params['id']
  if (typeof raw !== 'string') return null
  // v1 รหัสเอกสารเป็นตัวพิมพ์ใหญ่ / v2 locator เป็น hex ตัวพิมพ์เล็ก
  const id = LOCATOR_PATTERN.test(raw.toLowerCase())
    ? raw.toLowerCase()
    : raw.toUpperCase()
  return isDocId(id) ? id : null
}

async function loadDoc(
  docs: KVNamespaceLite,
  id: string,
): Promise<StoredDoc | null> {
  const text = await docs.get(KV_PREFIX + id)
  if (text === null) return null
  try {
    return JSON.parse(text) as StoredDoc
  } catch {
    return null
  }
}

export async function onRequestGet(ctx: RouteContext): Promise<Response> {
  const docs = ctx.env.DOCS
  if (!docs) return storageUnavailable()
  const id = docId(ctx)
  if (!id) return errorJson(NOT_FOUND_MESSAGE, 404)

  const stored = await loadDoc(docs, id)
  if (!stored) return errorJson(NOT_FOUND_MESSAGE, 404)

  // ต่ออายุอีก 1 ปีนับจากการเปิดครั้งนี้ (เขียนค่าเดิมกลับพร้อม TTL ใหม่)
  ctx.waitUntil(
    docs.put(KV_PREFIX + id, JSON.stringify(stored), {
      expirationTtl: DOC_TTL_SECONDS,
    }),
  )

  return json({
    v: stored.v,
    salt: stored.salt,
    iv: stored.iv,
    data: stored.data,
    updatedAt: stored.updatedAt,
  })
}

export async function onRequestPut(ctx: RouteContext): Promise<Response> {
  const docs = ctx.env.DOCS
  if (!docs) return storageUnavailable()
  const id = docId(ctx)
  if (!id) return errorJson(NOT_FOUND_MESSAGE, 404)

  const payload = await readDocPayload(ctx.request)
  if (!payload) return errorJson('ข้อมูลที่ส่งมาไม่ถูกต้อง', 400)

  const stored = await loadDoc(docs, id)
  const authHash = await sha256Hex(payload.authToken)
  if (!stored) {
    // v2 (locator จากอีเมล+รหัสผ่าน): ยังไม่มีเอกสาร = สร้างใหม่ที่ตำแหน่งนี้
    // — รู้ตำแหน่งได้เฉพาะผู้มีอีเมล+รหัสผ่านครบ จึงปลอดภัยให้ upsert ได้
    // ส่วน id แบบรหัส 10 ตัว (v1) เซิร์ฟเวอร์เป็นผู้สุ่มเท่านั้น ห้าม client เลือกเอง
    if (!LOCATOR_PATTERN.test(id)) return errorJson(NOT_FOUND_MESSAGE, 404)
  } else if (!timingSafeEqual(authHash, stored.authHash)) {
    return errorJson('ไม่มีสิทธิ์แก้ไขเอกสารนี้', 403)
  }

  const next: StoredDoc = {
    v: 1,
    salt: payload.salt,
    iv: payload.iv,
    data: payload.data,
    authHash,
    updatedAt: new Date().toISOString(),
  }
  await docs.put(KV_PREFIX + id, JSON.stringify(next), {
    expirationTtl: DOC_TTL_SECONDS,
  })
  return json({ ok: true })
}

export async function onRequestDelete(ctx: RouteContext): Promise<Response> {
  const docs = ctx.env.DOCS
  if (!docs) return storageUnavailable()
  const id = docId(ctx)
  if (!id) return errorJson(NOT_FOUND_MESSAGE, 404)

  const stored = await loadDoc(docs, id)
  if (!stored) return errorJson(NOT_FOUND_MESSAGE, 404)

  const authToken = ctx.request.headers.get('x-auth-token') ?? ''
  const authHash = await sha256Hex(authToken)
  if (!timingSafeEqual(authHash, stored.authHash)) {
    return errorJson('ไม่มีสิทธิ์ลบเอกสารนี้', 403)
  }

  await docs.delete(KV_PREFIX + id)
  return json({ ok: true })
}
