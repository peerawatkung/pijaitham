/**
 * เทส integration ของโหมดเก็บออนไลน์: client (cloudDoc) คุยกับ handler จริง
 * ของ Pages Functions ผ่าน fetch จำลอง + KV ในหน่วยความจำ
 * — ครอบคลุมทั้งวงจร บันทึก → เปิด → เขียนทับ → ลบ
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { onRequestPost } from '../../functions/api/docs'
import {
  onRequestDelete,
  onRequestGet,
  onRequestPut,
} from '../../functions/api/docs/[id]'
import type { Env, KVNamespaceLite, RouteContext } from '../../functions/api/_shared'
import {
  CloudDocError,
  clearCloudSession,
  currentCloudDocId,
  currentCloudDocLabel,
  deleteCloudDoc,
  formatDocCode,
  normalizeDocCode,
  openCloudDoc,
  openCloudDocByEmail,
  overwriteCloudDoc,
  saveCloudDoc,
  saveCloudDocByEmail,
} from './cloudDoc'
import type { FormAnswers } from '../types/form'

// ---- เซิร์ฟเวอร์จำลอง: KV ในหน่วยความจำ + route ไปยัง handler จริง ----

function createFakeKv(store: Map<string, string>): KVNamespaceLite {
  return {
    get: (key) => Promise.resolve(store.get(key) ?? null),
    put: (key, value) => {
      store.set(key, value)
      return Promise.resolve()
    },
    delete: (key) => {
      store.delete(key)
      return Promise.resolve()
    },
  }
}

function installFakeServer(env: Env): { pending: Promise<unknown>[] } {
  const pending: Promise<unknown>[] = []
  const makeCtx = (
    request: Request,
    params: Record<string, string>,
  ): RouteContext => ({
    request,
    env,
    params,
    waitUntil: (p) => {
      pending.push(p)
    },
  })

  vi.stubGlobal(
    'fetch',
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = String(input)
      const request = new Request(`http://localhost${url}`, init)
      if (url === '/api/docs' && request.method === 'POST') {
        return onRequestPost(makeCtx(request, {}))
      }
      const match = /^\/api\/docs\/([^/]+)$/.exec(url)
      if (match) {
        const ctx = makeCtx(request, { id: match[1] })
        if (request.method === 'GET') return onRequestGet(ctx)
        if (request.method === 'PUT') return onRequestPut(ctx)
        if (request.method === 'DELETE') return onRequestDelete(ctx)
      }
      return new Response('not found', { status: 404 })
    },
  )
  return { pending }
}

const ANSWERS: FormAnswers = { fullName: 'สมศรี ใจดี' }

describe('cloudDoc — วงจรเก็บออนไลน์ครบวงจร', () => {
  let store: Map<string, string>
  let pending: Promise<unknown>[]

  beforeEach(() => {
    store = new Map()
    ;({ pending } = installFakeServer({ DOCS: createFakeKv(store) }))
    clearCloudSession()
  })

  afterEach(async () => {
    await Promise.all(pending)
    vi.unstubAllGlobals()
  })

  it('บันทึก → เปิดด้วยรหัสเอกสาร+รหัสผ่าน ได้คำตอบเดิมครบ', async () => {
    const id = await saveCloudDoc(ANSWERS, 'passphrase-123')
    expect(id).toMatch(/^[23456789ABCDEFGHJKMNPQRSTVWXYZ]{10}$/)
    expect(store.size).toBe(1)
    // สิ่งที่อยู่บนเซิร์ฟเวอร์ต้องไม่มีข้อความต้นฉบับ (เข้ารหัสแล้วจริง)
    expect([...store.values()][0]).not.toContain('สมศรี')

    clearCloudSession()
    const opened = await openCloudDoc(formatDocCode(id), 'passphrase-123')
    expect(opened).toEqual(ANSWERS)
    expect(currentCloudDocId()).toBe(id)
  })

  it('รหัสผ่านผิด = ข้อความ "รหัสผ่านไม่ถูกต้อง"', async () => {
    const id = await saveCloudDoc(ANSWERS, 'passphrase-123')
    clearCloudSession()
    await expect(openCloudDoc(id, 'wrong-passphrase')).rejects.toThrow(
      'รหัสผ่านไม่ถูกต้อง',
    )
  })

  it('รหัสเอกสารไม่มีอยู่ = แจ้งไม่พบเอกสาร', async () => {
    await expect(
      openCloudDoc('AAAAA-AAAAA', 'whatever-pass'),
    ).rejects.toThrow(/ไม่พบเอกสาร/)
  })

  it('เขียนทับรหัสเดิมแล้วเปิดได้ค่าล่าสุด (รหัสไม่เปลี่ยน)', async () => {
    const id = await saveCloudDoc(ANSWERS, 'passphrase-123')
    await overwriteCloudDoc({ fullName: 'สมศรี แก้ไขแล้ว' })
    expect(store.size).toBe(1)

    clearCloudSession()
    const opened = await openCloudDoc(id, 'passphrase-123')
    expect(opened).toEqual({ fullName: 'สมศรี แก้ไขแล้ว' })
  })

  it('ลบเอกสารแล้วเปิดไม่ได้อีก และ session ถูกล้าง', async () => {
    const id = await saveCloudDoc(ANSWERS, 'passphrase-123')
    await deleteCloudDoc()
    expect(store.size).toBe(0)
    expect(currentCloudDocId()).toBeNull()
    await expect(openCloudDoc(id, 'passphrase-123')).rejects.toThrow(
      /ไม่พบเอกสาร/,
    )
  })

  it('เซิร์ฟเวอร์ไม่ได้ผูก KV = ข้อความ "ยังไม่เปิดใช้งาน"', async () => {
    installFakeServer({}) // env ไม่มี DOCS
    await expect(saveCloudDoc(ANSWERS, 'passphrase-123')).rejects.toThrow(
      /ยังไม่เปิดใช้งาน/,
    )
  })

  it('เปิดเอกสารช่วยต่ออายุ TTL (server เขียนค่าเดิมกลับ)', async () => {
    const id = await saveCloudDoc(ANSWERS, 'passphrase-123')
    clearCloudSession()
    await openCloudDoc(id, 'passphrase-123')
    await Promise.all(pending)
    expect(store.size).toBe(1) // ค่ายังอยู่ครบหลัง refresh
  })
})

describe('cloudDoc — โหมดอีเมล + รหัสผ่าน (v2)', () => {
  let store: Map<string, string>
  let pending: Promise<unknown>[]

  beforeEach(() => {
    store = new Map()
    ;({ pending } = installFakeServer({ DOCS: createFakeKv(store) }))
    clearCloudSession()
  })

  afterEach(async () => {
    await Promise.all(pending)
    vi.unstubAllGlobals()
  })

  it('บันทึกด้วยอีเมล → เปิดด้วยอีเมล+รหัสผ่านเดิม ได้คำตอบครบ', async () => {
    await saveCloudDocByEmail(ANSWERS, 'Somsri@Gmail.com ', 'passphrase-123')
    expect(store.size).toBe(1)
    // บนเซิร์ฟเวอร์ต้องไม่มีทั้งเนื้อหาและอีเมล (ส่งขึ้นเฉพาะ ciphertext)
    const kvDump = [...store.entries()].flat().join('|')
    expect(kvDump).not.toContain('สมศรี')
    expect(kvDump.toLowerCase()).not.toContain('somsri')

    clearCloudSession()
    // อีเมลพิมพ์ต่างรูปแบบ (ช่องว่าง/ตัวพิมพ์) ต้องเปิดได้เหมือนกัน
    const opened = await openCloudDocByEmail(
      '  SOMSRI@gmail.com',
      'passphrase-123',
    )
    expect(opened).toEqual(ANSWERS)
    expect(currentCloudDocLabel()).toBe('somsri@gmail.com')
  })

  it('รหัสผ่านผิด/อีเมลผิด = ไม่พบเอกสาร (ชี้คนละตำแหน่ง)', async () => {
    await saveCloudDocByEmail(ANSWERS, 'somsri@gmail.com', 'passphrase-123')
    clearCloudSession()
    await expect(
      openCloudDocByEmail('somsri@gmail.com', 'wrong-passphrase'),
    ).rejects.toThrow(/ไม่พบเอกสาร/)
    await expect(
      openCloudDocByEmail('another@gmail.com', 'passphrase-123'),
    ).rejects.toThrow(/ไม่พบเอกสาร/)
  })

  it('บันทึกซ้ำด้วยอีเมล+รหัสผ่านเดิม = ทับฉบับเดิม ไม่งอกเอกสารใหม่', async () => {
    await saveCloudDocByEmail(ANSWERS, 'somsri@gmail.com', 'passphrase-123')
    clearCloudSession()
    await saveCloudDocByEmail(
      { fullName: 'สมศรี ฉบับล่าสุด' },
      'somsri@gmail.com',
      'passphrase-123',
    )
    expect(store.size).toBe(1)

    clearCloudSession()
    const opened = await openCloudDocByEmail('somsri@gmail.com', 'passphrase-123')
    expect(opened).toEqual({ fullName: 'สมศรี ฉบับล่าสุด' })
  })

  it('อีเมลเดิมแต่รหัสผ่านใหม่ = เอกสารคนละฉบับ (ไม่ทับกัน)', async () => {
    await saveCloudDocByEmail(ANSWERS, 'somsri@gmail.com', 'passphrase-one')
    await saveCloudDocByEmail(ANSWERS, 'somsri@gmail.com', 'passphrase-two')
    expect(store.size).toBe(2)
  })

  it('บันทึกทับผ่าน session และลบได้ เหมือนโหมดรหัสเอกสาร', async () => {
    await saveCloudDocByEmail(ANSWERS, 'somsri@gmail.com', 'passphrase-123')
    await overwriteCloudDoc({ fullName: 'สมศรี แก้ไขแล้ว' })
    expect(store.size).toBe(1)
    await deleteCloudDoc()
    expect(store.size).toBe(0)
    expect(currentCloudDocId()).toBeNull()
  })

  it('client แอบ PUT ตำแหน่งที่มีเอกสารอยู่ด้วย token อื่น = 403 (กันสวมทับ)', async () => {
    await saveCloudDocByEmail(ANSWERS, 'somsri@gmail.com', 'passphrase-123')
    const locator = currentCloudDocId()
    const res = await fetch(`/api/docs/${locator}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        v: 1,
        salt: 'c2FsdA==',
        iv: 'aXZpdml2aXZpdg==',
        data: 'ZmFrZS1kYXRh',
        authToken: 'attacker-token-attacker-token-xx',
      }),
    })
    expect(res.status).toBe(403)
  })
})

describe('normalizeDocCode / formatDocCode', () => {
  it('รับรหัสที่มีขีด เว้นวรรค ตัวพิมพ์เล็ก', () => {
    expect(normalizeDocCode(' abcde-23456 ')).toBe('ABCDE23456')
    expect(normalizeDocCode('ABC DE 234 56')).toBe('ABCDE23456')
  })

  it('ปฏิเสธรหัสสั้น/ยาว/มีอักษรต้องห้าม (0 O 1 I L U)', () => {
    expect(() => normalizeDocCode('ABC')).toThrow(CloudDocError)
    expect(() => normalizeDocCode('ABCDE-2345O')).toThrow(CloudDocError)
    expect(() => normalizeDocCode('ABCDE-234567')).toThrow(CloudDocError)
  })

  it('formatDocCode คั่นกลางด้วยขีด', () => {
    expect(formatDocCode('ABCDE23456')).toBe('ABCDE-23456')
  })
})
