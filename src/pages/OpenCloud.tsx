import { useState } from 'react'
import type { FormEvent } from 'react'
import { BackLink } from '../components/BackLink'
import {
  cloudErrorMessage,
  openCloudDoc,
  openCloudDocByEmail,
} from '../lib/cloudDoc'
import { useForm } from '../state/FormContext'

/**
 * หน้า "เปิดเอกสารที่เก็บออนไลน์ไว้" — เปิดด้วย อีเมล + รหัสผ่าน
 * (รหัสเอกสาร 10 ตัวแบบเดิมยังเปิดได้ ผ่านตัวเลือกด้านล่าง)
 * ดึงข้อมูลเข้ารหัสจากเซิร์ฟเวอร์แล้วถอดรหัสในเครื่องนี้ จากนั้นพาไปหน้าตรวจทาน
 */
export function OpenCloud() {
  const { loadAnswers, goToReview, goHome } = useForm()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [useLegacyCode, setUseLegacyCode] = useState(false)
  const [passphrase, setPassphrase] = useState('')
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpen = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const answers = useLegacyCode
        ? await openCloudDoc(code, passphrase)
        : await openCloudDocByEmail(email, passphrase)
      loadAnswers(answers)
      goToReview()
    } catch (err) {
      setError(cloudErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-tea-200 bg-white px-4 py-3 text-lg text-ink focus:outline-none focus:ring-4 focus:ring-tea-600/30'

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <header className="space-y-3">
        <BackLink onClick={goHome} />
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">
          เปิดเอกสารที่เก็บออนไลน์ไว้
        </h1>
        <p className="text-lg leading-relaxed text-ink-soft">
          กรอกอีเมลและรหัสผ่านที่ใช้ตอนบันทึก —
          เอกสารจะถูกถอดรหัสในเครื่องนี้เท่านั้น
        </p>
      </header>

      <form className="mt-8 space-y-4" onSubmit={(e) => void handleOpen(e)}>
        {useLegacyCode ? (
          <label className="block">
            <span className="text-base font-bold text-ink">
              รหัสเอกสาร (10 ตัว เช่น ABCDE-23456)
            </span>
            <input
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              placeholder="XXXXX-XXXXX"
              className={`mt-1 font-mono tracking-wider ${inputClass}`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>
        ) : (
          <label className="block">
            <span className="text-base font-bold text-ink">
              อีเมลที่ใช้ตอนบันทึก
            </span>
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
        )}
        <label className="block">
          <span className="text-base font-bold text-ink">รหัสผ่านเอกสาร</span>
          <input
            type={showPassphrase ? 'text' : 'password'}
            autoComplete="current-password"
            className={`mt-1 ${inputClass}`}
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
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

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-tea-700 px-8 py-4 text-xl font-bold text-white shadow-sm transition-colors hover:bg-tea-600 focus:outline-none focus:ring-4 focus:ring-tea-600/40 disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? 'กำลังเปิดเอกสาร...' : 'เปิดเอกสาร'}
        </button>
        {error ? (
          <p role="alert" className="text-lg text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          className="inline-flex min-h-[44px] items-center text-base text-ink-soft underline underline-offset-4 hover:text-ink"
          onClick={() => {
            setUseLegacyCode((prev) => !prev)
            setError(null)
          }}
        >
          {useLegacyCode
            ? 'กลับไปเปิดด้วยอีเมล'
            : 'เคยได้ "รหัสเอกสาร 10 ตัว" มา? เปิดด้วยรหัสเอกสารแทน'}
        </button>
      </form>

      <div className="mt-8 rounded-xl border border-dawn-100 bg-dawn-100/40 p-5">
        <ul className="list-disc space-y-1.5 pl-6 text-base leading-relaxed text-ink">
          <li>
            เอกสารถูกเก็บแบบเข้ารหัสตั้งแต่ก่อนออกจากเครื่องของผู้เขียน —
            เซิร์ฟเวอร์อ่านเนื้อหาไม่ได้ (แม้แต่อีเมลก็ไม่ถูกส่งไป)
            และถอดรหัสได้ด้วยอีเมล+รหัสผ่านชุดเดิมเท่านั้น
          </li>
          <li>
            เอกสารเก็บไว้ 1 ปีนับจากการเปิดครั้งล่าสุด —
            เปิดครั้งนี้จะต่ออายุให้อีก 1 ปีโดยอัตโนมัติ
          </li>
          <li>
            หากลืมรหัสผ่าน จะไม่มีใครกู้เอกสารได้ —
            แต่กลับไปเริ่มเขียนฉบับใหม่ได้เสมอ
          </li>
        </ul>
      </div>
    </main>
  )
}
