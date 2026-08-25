import { useEffect } from 'react'
import { BackLink } from '../components/BackLink'
import { CloudSaveCard } from '../components/CloudSaveCard'
import { usePdfDownload } from '../hooks/usePdfDownload'
import { exportDraft } from '../lib/draft'
import { useForm } from '../state/FormContext'

/**
 * หน้า "เลือกวิธีเก็บเอกสาร" — ขั้นตอนของตัวเองหลังตรวจทานเสร็จ
 * ผู้ใช้เลือกได้ว่าจะเก็บแบบไหน (หรือทั้งสองแบบ):
 * 1. ออนไลน์ (อิเล็กทรอนิกส์) — อีเมล+รหัสผ่าน เปิดจากเครื่องไหนก็ได้
 * 2. ไฟล์ในเครื่อง / พิมพ์เป็นกระดาษ — PDF ไปลงนามกับพยาน
 */
export function StoreChoice() {
  const { answers, goToReview, goToDone } = useForm()
  // ดาวน์โหลดสำเร็จ → พาไปหน้า "ขั้นตอนถัดไป"
  const {
    generating,
    error: pdfError,
    download: handleDownloadPdf,
  } = usePdfDownload(answers, goToDone)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <header className="space-y-3">
        <BackLink onClick={goToReview} label="กลับไปตรวจทาน" />
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">
          เอกสารของคุณพร้อมแล้ว — เลือกวิธีเก็บ
        </h1>
        <p className="text-lg leading-relaxed text-ink-soft">
          เลือกแบบที่สะดวกกับคุณ หรือใช้ทั้งสองแบบคู่กันก็ได้
        </p>
      </header>

      <div className="mt-8 space-y-5">
        {/* ---- แบบที่ 1: ออนไลน์ (อิเล็กทรอนิกส์) ---- */}
        <section aria-label="เก็บแบบออนไลน์">
          <CloudSaveCard answers={answers} onGoNext={goToDone} />
        </section>

        {/* ---- แบบที่ 2: ไฟล์ในเครื่อง / กระดาษ ---- */}
        <section
          aria-label="เก็บเป็นไฟล์และกระดาษ"
          className="rounded-xl border border-tea-200 bg-card p-5"
        >
          <h3 className="text-xl font-bold text-ink">
            เก็บเป็นไฟล์ในเครื่อง / พิมพ์เป็นกระดาษ
          </h3>
          <p className="mt-2 text-base leading-relaxed text-ink">
            ดาวน์โหลด PDF ลงเครื่อง แล้วพิมพ์ไปลงนามพร้อมพยาน —
            ฉบับกระดาษที่ลงนามแล้วคือฉบับที่ยื่นโรงพยาบาลได้ทันที
            เหมาะสำหรับมอบสำเนาให้แพทย์และครอบครัว
          </p>
          <button
            type="button"
            disabled={generating}
            className="mt-3 w-full rounded-xl bg-tea-700 px-8 py-4 text-xl font-bold text-white shadow-sm transition-colors hover:bg-tea-600 focus:outline-none focus:ring-4 focus:ring-tea-600/40 disabled:cursor-wait disabled:opacity-60"
            onClick={() => void handleDownloadPdf()}
          >
            {generating ? 'กำลังสร้างเอกสาร...' : 'ดาวน์โหลด PDF'}
          </button>
          {pdfError ? (
            <p role="alert" className="mt-2 text-center text-lg text-red-700">
              {pdfError}
            </p>
          ) : null}
        </section>

        <button
          type="button"
          className="w-full rounded-xl border border-tea-200 px-8 py-4 text-xl text-ink transition-colors hover:bg-tea-100 focus:outline-none focus:ring-4 focus:ring-tea-600/30"
          onClick={() => exportDraft(answers)}
        >
          ดาวน์โหลดแบบร่าง (.json) ไว้ทำต่อภายหลัง
        </button>

        <p className="text-center text-base leading-relaxed text-ink-soft">
          เก็บเรียบร้อยแล้ว?{' '}
          <button
            type="button"
            className="underline underline-offset-4 hover:text-ink"
            onClick={goToDone}
          >
            ไปดูขั้นตอนถัดไป
          </button>
        </p>
      </div>
    </main>
  )
}
