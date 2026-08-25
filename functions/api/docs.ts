/**
 * POST /api/docs — ฝากเอกสาร (ที่เข้ารหัสจากเครื่องผู้ใช้แล้ว) ขึ้นเซิร์ฟเวอร์
 * ตอบกลับ { id } = รหัสเอกสารสำหรับเปิดจากเครื่องอื่น
 */
import {
  DOC_TTL_SECONDS,
  KV_PREFIX,
  errorJson,
  generateDocId,
  json,
  readDocPayload,
  sha256Hex,
  storageUnavailable,
} from './_shared'
import type { RouteContext, StoredDoc } from './_shared'

export async function onRequestPost(ctx: RouteContext): Promise<Response> {
  const docs = ctx.env.DOCS
  if (!docs) return storageUnavailable()

  const payload = await readDocPayload(ctx.request)
  if (!payload) return errorJson('ข้อมูลที่ส่งมาไม่ถูกต้อง', 400)

  const stored: StoredDoc = {
    v: 1,
    salt: payload.salt,
    iv: payload.iv,
    data: payload.data,
    authHash: await sha256Hex(payload.authToken),
    updatedAt: new Date().toISOString(),
  }

  // สุ่มรหัสจนกว่าจะไม่ชน (โอกาสชนแทบเป็นศูนย์ แต่กันไว้)
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = generateDocId()
    const key = KV_PREFIX + id
    if ((await docs.get(key)) !== null) continue
    await docs.put(key, JSON.stringify(stored), {
      expirationTtl: DOC_TTL_SECONDS,
    })
    return json({ id }, 201)
  }
  return errorJson('ระบบไม่พร้อมใช้งานชั่วคราว กรุณาลองใหม่', 500)
}
