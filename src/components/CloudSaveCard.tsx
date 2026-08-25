import { useState } from 'react'
import {
  clearCloudSession,
  cloudErrorMessage,
  currentCloudDocId,
  deleteCloudDoc,
  formatDocCode,
  overwriteCloudDoc,
  saveCloudDoc,
} from '../lib/cloudDoc'
import { PASSPHRASE_MIN_LENGTH } from '../lib/e2ee'
import type { FormAnswers } from '../types/form'

type Busy = 'save' | 'overwrite' | 'delete' | null

/**
 * การ์ด "เก็บแบบออนไลน์ (อิเล็กทรอนิกส์)" — ใช้ในหน้าตรวจทานและหน้าขั้นตอนถัดไป
 * เอกสารถูกเข้ารหัสในเครื่องผู้ใช้ก่อนส่งขึ้นเซิร์ฟเวอร์เสมอ (ดู lib/e2ee.ts)
 */
export function CloudSaveCard({
  answers,
  onGoNext,
}: {
  answers: FormAnswers
  /** ปุ่ม "ไปดูขั้นตอนถัดไป" หลังบันทึกสำเร็จ (ใช้ในหน้าตรวจทาน) */
  onGoNext?: () => void
}) {
  const [passphrase, setPassphrase] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [busy, setBusy] = useState<Busy>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleted, setDeleted] = useState(false)
  // มีรหัสเดิมใน session (เพิ่งบันทึก หรือเปิดจากรหัสมา) → เสนอ "บันทึกทับ"
  const [existingId, setExistingId] = useState<string | null>(() =>
    currentCloudDocId(),
  )
  const [asNewCode, setAsNewCode] = useState(false)

  const showForm = existingId === null || asNewCode

  const validateForm = (): string | null => {
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
      const id = await saveCloudDoc(answers, passphrase)
      setSavedId(id)
      setExistingId(id)
      setAsNewCode(false)
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
      setSavedId(currentCloudDocId())
      setDeleted(false)
    } catch (err) {
      setError(cloudErrorMessage(err))
      setExistingId(currentCloudDocId()) // session อาจถูกล้างเมื่อรหัสเดิมใช้ไม่ได้
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
      setExistingId(null)
      setSavedId(null)
      setConfirmDelete(false)
      setDeleted(true)
    } catch (err) {
      setError(cloudErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const handleCopy = async () => {
    if (!savedId) return
    try {
      await navigator.clipboard.writeText(formatDocCode(savedId))
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // คัดลอกอัตโนมัติไม่ได้ (เบราว์เซอร์เก่า) — ผู้ใช้ยังเห็นรหัสบนจอ จดเองได้
    }
  }

  const inputClass =
    'w-full rounded-xl border border-tea-200 bg-white px-4 py-3 text-lg text-ink focus:outline-none focus:ring-4 focus:ring-tea-600/30'

  return (
    <div className="rounded-xl border border-tea-200 bg-card p-5">
      <h3 className="text-xl font-bold text-ink">
        เก็บแบบออนไลน์ (อิเล็กทรอนิกส์)
      </h3>
      <p className="mt-2 text-base leading-relaxed text-ink">
        เอกสารจะถูก<strong>เข้ารหัสในเครื่องของคุณก่อน</strong>ส่งขึ้นเซิร์ฟเวอร์
        — เซิร์ฟเวอร์เก็บได้เพียงข้อมูลที่อ่านไม่ออก
        ไม่มีใครถอดได้หากไม่มีรหัสผ่านของคุณ (รวมถึงผู้พัฒนาเว็บนี้)
        คุณจะได้ &ldquo;รหัสเอกสาร&rdquo; ไว้เปิดจากเครื่องไหนก็ได้
      </p>

      {/* ---- บันทึกสำเร็จ: แสดงรหัสเอกสาร ---- */}
      {savedId ? (
        <div className="mt-4 rounded-xl border border-tea-200 bg-tea-100/60 p-4 text-center">
          <p className="text-base font-bold text-ink">
            เก็บขึ้นเซิร์ฟเวอร์เรียบร้อย — รหัสเอกสารของคุณคือ
          </p>
          <p className="mt-2 select-all font-mono text-3xl font-bold tracking-wider text-tea-700">
            {formatDocCode(savedId)}
          </p>
          <button
            type="button"
            className="mt-3 inline-flex min-h-[44px] items-center rounded-xl border border-tea-200 bg-white px-6 py-2 text-base text-ink transition-colors hover:bg-tea-100 focus:outline-none focus:ring-4 focus:ring-tea-600/30"
            onClick={() => void handleCopy()}
          >
            {copied ? 'คัดลอกแล้ว ✓' : 'คัดลอกรหัส'}
          </button>
          <ul className="mt-3 list-disc space-y-1 pl-6 text-left text-base leading-relaxed text-ink">
            <li>
              จดรหัสเอกสารและรหัสผ่านไว้ในที่ปลอดภัย —
              บอกรหัสทั้งสองแก่คนที่คุณไว้วางใจ (เช่น ผู้ตัดสินใจแทน)
              เพื่อให้เปิดเอกสารได้ยามจำเป็น
            </li>
            <li>
              <strong>หากลืมรหัสผ่าน จะไม่มีใครกู้เอกสารนี้ได้</strong> —
              แต่สร้างใหม่ได้เสมอ
            </li>
            <li>
              เอกสารเก็บไว้ 1 ปีนับจากการเปิดครั้งล่าสุด แล้วลบตัวเองอัตโนมัติ
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

      {/* ---- มีรหัสเดิมใน session: เสนอบันทึกทับ ---- */}
      {existingId !== null && !asNewCode ? (
        <div className="mt-4 space-y-3">
          <button
            type="button"
            disabled={busy !== null}
            className="w-full rounded-xl bg-tea-700 px-8 py-4 text-xl font-bold text-white shadow-sm transition-colors hover:bg-tea-600 focus:outline-none focus:ring-4 focus:ring-tea-600/40 disabled:cursor-wait disabled:opacity-60"
            onClick={() => void handleOverwrite()}
          >
            {busy === 'overwrite'
              ? 'กำลังบันทึก...'
              : `บันทึกทับรหัสเดิม (${formatDocCode(existingId)})`}
          </button>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-1">
            <button
              type="button"
              className="inline-flex min-h-[44px] items-center text-base text-ink-soft underline underline-offset-4 hover:text-ink"
              onClick={() => {
                setAsNewCode(true)
                setError(null)
              }}
            >
              เก็บเป็นรหัสใหม่แทน
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

      {/* ---- ฟอร์มตั้งรหัสผ่าน + บันทึกเป็นรหัสใหม่ ---- */}
      {showForm ? (
        <div className="mt-4 space-y-3">
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
            เลือกรหัสผ่านที่คุณจำได้แต่คนอื่นเดายาก —
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
          {asNewCode ? (
            <button
              type="button"
              className="inline-flex min-h-[44px] items-center text-base text-ink-soft underline underline-offset-4 hover:text-ink"
              onClick={() => {
                setAsNewCode(false)
                setError(null)
              }}
            >
              กลับไปบันทึกทับรหัสเดิม
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
