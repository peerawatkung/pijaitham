import { useState } from 'react'
import {
  clearCloudSession,
  cloudErrorMessage,
  currentCloudDocLabel,
  deleteCloudDoc,
  overwriteCloudDoc,
  saveCloudDocByEmail,
} from '../lib/cloudDoc'
import { PASSPHRASE_MIN_LENGTH } from '../lib/e2ee'
import type { FormAnswers } from '../types/form'

type Busy = 'save' | 'overwrite' | 'delete' | null

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

/** ถ้อยคำตามบริบท: เก็บเอกสารฉบับเสร็จ vs บันทึกแบบร่างกลางทาง (กลไกเดียวกัน) */
const COPY = {
  document: {
    title: 'เก็บแบบออนไลน์ (อิเล็กทรอนิกส์)',
    thing: 'เอกสาร',
    successTitle: 'เก็บขึ้นเซิร์ฟเวอร์เรียบร้อยแล้ว ✓',
    successHint: 'เปิดจากเครื่องไหนก็ได้ด้วย',
  },
  draft: {
    title: 'บันทึกแบบร่างออนไลน์',
    thing: 'แบบร่าง',
    successTitle: 'บันทึกแบบร่างเรียบร้อยแล้ว ✓',
    successHint: 'กลับมาทำต่อจากเครื่องไหนก็ได้ด้วย',
  },
} as const

/**
 * การ์ด "เก็บแบบออนไลน์ (อิเล็กทรอนิกส์)" — ใช้ในหน้าเลือกวิธีเก็บ หน้าขั้นตอนถัดไป
 * และ (variant "draft") ปุ่มบันทึกแบบร่างระหว่างกรอกฟอร์ม
 * ระบุเอกสารด้วย อีเมล + รหัสผ่าน — derive เป็นกุญแจ/ตำแหน่งในเครื่องผู้ใช้
 * (อีเมลและรหัสผ่านไม่ถูกส่งขึ้นเซิร์ฟเวอร์ — ดู lib/e2ee.ts)
 * แบบร่างและฉบับเสร็จใช้ช่องเก็บเดียวกันต่ออีเมล+รหัสผ่านหนึ่งชุด —
 * บันทึกครั้งถัดไปทับของเดิมเสมอ จึงได้ฉบับล่าสุดฉบับเดียวไม่สับสน
 */
export function CloudSaveCard({
  answers,
  onGoNext,
  variant = 'document',
}: {
  answers: FormAnswers
  /** ปุ่ม "ไปดูขั้นตอนถัดไป" หลังบันทึกสำเร็จ (ใช้ในหน้าตรวจทาน) */
  onGoNext?: () => void
  variant?: keyof typeof COPY
}) {
  const copy = COPY[variant]
  const [email, setEmail] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [busy, setBusy] = useState<Busy>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedAs, setSavedAs] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleted, setDeleted] = useState(false)
  // มีเอกสารเดิมใน session (เพิ่งบันทึก หรือเปิดเข้ามา) → เสนอ "บันทึกทับ"
  const [existingLabel, setExistingLabel] = useState<string | null>(() =>
    currentCloudDocLabel(),
  )
  const [asNew, setAsNew] = useState(false)

  const showForm = existingLabel === null || asNew

  const validateForm = (): string | null => {
    if (!EMAIL_PATTERN.test(email.trim())) {
      return 'กรุณากรอกอีเมลให้ถูกต้อง เช่น somsri@gmail.com'
    }
    if (passphrase.length < PASSPHRASE_MIN_LENGTH) {
      return `รหัสผ่านต้องยาวอย่างน้อย ${PASSPHRASE_MIN_LENGTH} ตัวอักษร`
    }
    if (passphrase !== confirm) {
      return 'รหัสผ่านทั้งสองช่องไม่ตรงกัน'
    }
    return null
  }

  const handleSave = async () => {
    const invalid = validateForm()
    if (invalid) {
      setError(invalid)
      return
    }
    setBusy('save')
    setError(null)
    try {
      await saveCloudDocByEmail(answers, email, passphrase)
      const label = currentCloudDocLabel()
      setSavedAs(label)
      setExistingLabel(label)
      setAsNew(false)
      setDeleted(false)
      setPassphrase('')
      setConfirm('')
    } catch (err) {
      setError(cloudErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const handleOverwrite = async () => {
    setBusy('overwrite')
    setError(null)
    try {
      await overwriteCloudDoc(answers)
      setSavedAs(currentCloudDocLabel())
      setDeleted(false)
    } catch (err) {
      setError(cloudErrorMessage(err))
      setExistingLabel(currentCloudDocLabel()) // session อาจถูกล้างเมื่อของเดิมใช้ไม่ได้
    } finally {
      setBusy(null)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setBusy('delete')
    setError(null)
    try {
      await deleteCloudDoc()
      clearCloudSession()
      setExistingLabel(null)
      setSavedAs(null)
      setConfirmDelete(false)
      setDeleted(true)
    } catch (err) {
      setError(cloudErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-tea-200 bg-white px-4 py-3 text-lg text-ink focus:outline-none focus:ring-4 focus:ring-tea-600/30'

  return (
    <div className="rounded-xl border border-tea-200 bg-card p-5">
      <h3 className="text-xl font-bold text-ink">{copy.title}</h3>
      <p className="mt-2 text-base leading-relaxed text-ink">
        ใช้แค่ <strong>อีเมล + รหัสผ่าน</strong> เปิด{copy.thing}
        ได้จากทุกเครื่อง — {copy.thing}ถูก
        <strong>เข้ารหัสในเครื่องของคุณก่อน</strong>ส่งขึ้นเซิร์ฟเวอร์
        แม้แต่อีเมลก็ไม่ถูกส่งไป เซิร์ฟเวอร์จึงเก็บได้เพียงข้อมูลที่อ่านไม่ออก
        ไม่มีใครถอดได้หากไม่มีรหัสผ่านของคุณ (รวมถึงผู้พัฒนาเว็บนี้)
      </p>

      {/* ---- บันทึกสำเร็จ ---- */}
      {savedAs ? (
        <div className="mt-4 rounded-xl border border-tea-200 bg-tea-100/60 p-4">
          <p className="text-center text-base font-bold text-ink">
            {copy.successTitle}
          </p>
          <p className="mt-1 text-center text-lg leading-relaxed text-ink">
            {copy.successHint} <strong>{savedAs}</strong> และรหัสผ่านที่ตั้งไว้
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-6 text-left text-base leading-relaxed text-ink">
            <li>
              บอกอีเมลและรหัสผ่านแก่คนที่คุณไว้วางใจ (เช่น ผู้ตัดสินใจแทน)
              เพื่อให้เปิดเอกสารได้ยามจำเป็น
            </li>
            <li>
              บันทึกครั้งถัดไปด้วยอีเมลและรหัสผ่านเดิม
              จะแทนที่ฉบับเดิมโดยอัตโนมัติ — ใช้รหัสผ่านเดิมทุกครั้ง
            </li>
            <li>
              <strong>หากลืมรหัสผ่าน จะไม่มีใครกู้เอกสารนี้ได้</strong> —
              แต่สร้างใหม่ได้เสมอ
            </li>
            <li>
              เอกสารเก็บไว้ 3 ปีนับจากการเปิดครั้งล่าสุด แล้วลบตัวเองอัตโนมัติ
            </li>
          </ul>
          {onGoNext ? (
            <button
              type="button"
              className="mt-4 w-full rounded-xl bg-tea-700 px-8 py-3 text-lg font-bold text-white shadow-sm transition-colors hover:bg-tea-600 focus:outline-none focus:ring-4 focus:ring-tea-600/40"
              onClick={onGoNext}
            >
              ไปดูขั้นตอนถัดไป
            </button>
          ) : null}
        </div>
      ) : null}

      {deleted ? (
        <p className="mt-4 rounded-xl border border-tea-200 bg-tea-100/60 p-4 text-base leading-relaxed text-ink">
          ลบเอกสารออกจากเซิร์ฟเวอร์เรียบร้อยแล้ว —
          จะเก็บใหม่อีกครั้งเมื่อไรก็ได้
        </p>
      ) : null}

      {/* ---- มีเอกสารเดิมใน session: เสนอบันทึกทับ ---- */}
      {existingLabel !== null && !asNew ? (
        <div className="mt-4 space-y-3">
          <button
            type="button"
            disabled={busy !== null}
            className="w-full rounded-xl bg-tea-700 px-8 py-4 text-xl font-bold text-white shadow-sm transition-colors hover:bg-tea-600 focus:outline-none focus:ring-4 focus:ring-tea-600/40 disabled:cursor-wait disabled:opacity-60"
            onClick={() => void handleOverwrite()}
          >
            {busy === 'overwrite'
              ? 'กำลังบันทึก...'
              : `บันทึกทับฉบับเดิม (${existingLabel})`}
          </button>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-1">
            <button
              type="button"
              className="inline-flex min-h-[44px] items-center text-base text-ink-soft underline underline-offset-4 hover:text-ink"
              onClick={() => {
                setAsNew(true)
                setError(null)
              }}
            >
              เก็บด้วยอีเมล/รหัสผ่านอื่นแทน
            </button>
            <button
              type="button"
              disabled={busy !== null}
              className="inline-flex min-h-[44px] items-center text-base text-red-700 underline underline-offset-4 hover:text-red-800 disabled:opacity-60"
              onClick={() => void handleDelete()}
            >
              {busy === 'delete'
                ? 'กำลังลบ...'
                : confirmDelete
                  ? 'ยืนยันลบถาวร — กดอีกครั้ง'
                  : 'ลบเอกสารออกจากเซิร์ฟเวอร์'}
            </button>
          </div>
        </div>
      ) : null}

      {/* ---- ฟอร์มอีเมล + รหัสผ่าน ---- */}
      {showForm ? (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-base font-bold text-ink">อีเมลของคุณ</span>
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="เช่น somsri@gmail.com"
              className={`mt-1 ${inputClass}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-base font-bold text-ink">
              ตั้งรหัสผ่านเอกสาร (อย่างน้อย {PASSPHRASE_MIN_LENGTH} ตัวอักษร)
            </span>
            <input
              type={showPassphrase ? 'text' : 'password'}
              autoComplete="new-password"
              className={`mt-1 ${inputClass}`}
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-base font-bold text-ink">
              พิมพ์รหัสผ่านอีกครั้งเพื่อยืนยัน
            </span>
            <input
              type={showPassphrase ? 'text' : 'password'}
              autoComplete="new-password"
              className={`mt-1 ${inputClass}`}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
          <label className="-mx-2 flex min-h-[44px] w-fit cursor-pointer items-center gap-2 rounded-lg px-2 text-base text-ink">
            <input
              type="checkbox"
              className="h-5 w-5 accent-tea-700"
              checked={showPassphrase}
              onChange={(e) => setShowPassphrase(e.target.checked)}
            />
            แสดงรหัสผ่าน
          </label>
          <p className="text-sm leading-relaxed text-ink-soft">
            อีเมลใช้เป็นส่วนหนึ่งของกุญแจเข้ารหัสในเครื่องคุณเท่านั้น
            ไม่ถูกส่งไปที่ใด และไม่มีอีเมลใด ๆ ส่งถึงคุณ —
            หากลืมรหัสผ่าน จะไม่มีใครกู้เอกสารได้ (รวมถึงผู้พัฒนา)
          </p>
          <button
            type="button"
            disabled={busy !== null}
            className="w-full rounded-xl bg-tea-700 px-8 py-4 text-xl font-bold text-white shadow-sm transition-colors hover:bg-tea-600 focus:outline-none focus:ring-4 focus:ring-tea-600/40 disabled:cursor-wait disabled:opacity-60"
            onClick={() => void handleSave()}
          >
            {busy === 'save'
              ? 'กำลังเข้ารหัสและบันทึก...'
              : 'เข้ารหัสและเก็บขึ้นเซิร์ฟเวอร์'}
          </button>
          {asNew ? (
            <button
              type="button"
              className="inline-flex min-h-[44px] items-center text-base text-ink-soft underline underline-offset-4 hover:text-ink"
              onClick={() => {
                setAsNew(false)
                setError(null)
              }}
            >
              กลับไปบันทึกทับฉบับเดิม
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 text-lg text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}
