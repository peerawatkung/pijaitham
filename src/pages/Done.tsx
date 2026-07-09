import { useCallback, useEffect, useState } from 'react'
import { ShareButton } from '../components/ShareButton'
import { PDF_TEXT } from '../content/pdfText'
import { usePdfDownload } from '../hooks/usePdfDownload'
import { downloadErrorMessage } from '../lib/browser'
import { exportDraft } from '../lib/draft'
import { downloadReviewReminder } from '../lib/reviewReminder'
import { useForm } from '../state/FormContext'

/** หน้า "ขั้นตอนถัดไป" — แสดงหลังดาวน์โหลด PDF สำเร็จ */
export function Done() {
  const { answers, goToReview, goHome, goToTalkGuide } = useForm()
  const { generating, error, download } = usePdfDownload(answers)

  const [cardGenerating, setCardGenerating] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)
  const downloadCard = useCallback(async () => {
    setCardGenerating(true)
    setCardError(null)
    try {
      // โหลด PDF engine เฉพาะเมื่อกดดาวน์โหลด เช่นเดียวกับเอกสารหลัก
      const { downloadWalletCardPdf } = await import('../lib/pdf/walletCardPdf')
      await downloadWalletCardPdf(answers)
    } catch (err) {
      console.error(err)
      setCardError(downloadErrorMessage())
    } finally {
      setCardGenerating(false)
    }
  }, [answers])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">
        เอกสารของคุณพร้อมแล้ว
      </h1>
      <p className="mt-3 text-lg leading-relaxed text-ink-soft">
        ไฟล์ PDF ถูกบันทึกลงเครื่องของคุณแล้ว
        การเขียนถึงตรงนี้คือก้าวที่มีความหมายมาก —
        ขั้นตอนต่อจากนี้จะทำให้เจตนาของคุณมีผลจริง
      </p>

      <ol className="mt-8 space-y-4">
        {PDF_TEXT.appendix.afterPrintSteps.map((step, i) => (
          <li
            key={step}
            className="flex items-start gap-4 rounded-xl border border-tea-200 bg-card p-4"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tea-100 text-lg font-bold text-tea-700"
            >
              {i + 1}
            </span>
            <span className="text-lg leading-relaxed text-ink">{step}</span>
          </li>
        ))}
      </ol>

      <p className="mt-4 rounded-xl border border-tea-200 bg-tea-100/60 p-4 text-lg leading-relaxed text-ink">
        <span aria-hidden="true">💳</span> {PDF_TEXT.appendix.afterPrintNote}
      </p>

      <p className="mt-4 text-base leading-relaxed text-ink-soft">
        ขั้นตอนที่ 2 มักเป็นก้าวที่ยากที่สุด —{' '}
        <button
          type="button"
          className="underline underline-offset-4 hover:text-ink"
          onClick={goToTalkGuide}
        >
          เรามีคู่มือชวนครอบครัวคุยไว้ให้แล้ว
        </button>
      </p>

      <div className="mt-8 rounded-xl border border-dawn-100 bg-dawn-100/40 p-5">
        <p className="text-base leading-relaxed text-ink">
          แนะนำให้ทบทวนเอกสารทุก 1 ปี หรือเมื่อสุขภาพหรือชีวิตเปลี่ยนแปลงสำคัญ
          — หากจัดทำฉบับใหม่ ฉบับที่มีวันที่ล่าสุดจะมีผลเหนือฉบับเก่า
          เก็บไฟล์แบบร่าง (.json) ไว้ จะช่วยให้กลับมาแก้ไขได้โดยไม่ต้องเริ่มใหม่
        </p>
      </div>

      <div className="mt-8 space-y-3">
        <button
          type="button"
          disabled={generating}
          className="w-full rounded-xl border border-tea-200 px-8 py-4 text-xl text-ink transition-colors hover:bg-tea-100 focus:outline-none focus:ring-4 focus:ring-tea-600/30 disabled:cursor-wait disabled:opacity-60"
          onClick={() => void download()}
        >
          {generating ? 'กำลังสร้างเอกสาร...' : 'ดาวน์โหลด PDF อีกครั้ง'}
        </button>
        {error ? (
          <p role="alert" className="text-center text-lg text-red-700">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          disabled={cardGenerating}
          className="w-full rounded-xl border border-tea-200 px-8 py-4 text-xl text-ink transition-colors hover:bg-tea-100 focus:outline-none focus:ring-4 focus:ring-tea-600/30 disabled:cursor-wait disabled:opacity-60"
          onClick={() => void downloadCard()}
        >
          {cardGenerating
            ? 'กำลังสร้างการ์ด...'
            : 'ดาวน์โหลดการ์ดพกกระเป๋า (PDF)'}
        </button>
        <p className="text-center text-sm leading-relaxed text-ink-soft">
          การ์ดขนาดบัตร บอกว่าคุณมีหนังสือแสดงเจตนา เก็บไว้ที่ไหน และติดต่อใคร
          — ตัด พับ ใส่กระเป๋าเงิน มีประโยชน์ยามฉุกเฉินที่เอกสารตัวเต็มไม่ได้อยู่กับตัว
        </p>
        {cardError ? (
          <p role="alert" className="text-center text-lg text-red-700">
            {cardError}
          </p>
        ) : null}
        <button
          type="button"
          className="w-full rounded-xl border border-tea-200 px-8 py-4 text-xl text-ink transition-colors hover:bg-tea-100 focus:outline-none focus:ring-4 focus:ring-tea-600/30"
          onClick={() => exportDraft(answers)}
        >
          ดาวน์โหลดแบบร่าง (.json) ไว้แก้ไขภายหลัง
        </button>
        <button
          type="button"
          className="w-full rounded-xl border border-tea-200 px-8 py-4 text-xl text-ink transition-colors hover:bg-tea-100 focus:outline-none focus:ring-4 focus:ring-tea-600/30"
          onClick={() => void downloadReviewReminder()}
        >
          เพิ่มการเตือนทบทวนในปฏิทิน (ปีละครั้ง)
        </button>
        <p className="text-center text-sm leading-relaxed text-ink-soft">
          ได้ไฟล์ปฏิทิน (.ics) เปิดแล้วเพิ่มลง Google Calendar หรือปฏิทินมือถือได้ทันที
          — จะเตือนให้กลับมาทบทวนเอกสารทุกปี โดยไม่มีการเชื่อมต่อบัญชีใด ๆ
        </p>

        {/* ---- ชวนบอกต่อ — จังหวะที่เพิ่งทำเสร็จคือตอนที่อยากชวนคนอื่นที่สุด ---- */}
        <div className="mt-8 rounded-xl border border-tea-200 bg-tea-100/60 p-6 text-center">
          <p className="text-lg leading-relaxed text-ink">
            การวางแผนแบบนี้มีความหมายกับทุกครอบครัว
            <br />
            ชวนคนที่คุณรักมาเขียนของเขาบ้างไหม
          </p>
          <div className="mt-4">
            <ShareButton />
          </div>
        </div>
        <div className="flex justify-center gap-8 pt-4">
          <button
            type="button"
            className="text-base text-ink-soft underline underline-offset-4 hover:text-ink"
            onClick={goToReview}
          >
            กลับไปตรวจทาน/แก้ไข
          </button>
          <button
            type="button"
            className="text-base text-ink-soft underline underline-offset-4 hover:text-ink"
            onClick={goHome}
          >
            กลับหน้าแรก
          </button>
        </div>
      </div>

      <p className="mt-8 text-center text-base leading-relaxed text-ink-soft">
        ข้อมูลของคุณยังอยู่ในหน้านี้จนกว่าจะปิดหน้าต่าง —
        ถ้ายังไม่ได้บันทึกแบบร่าง อย่าลืมบันทึกก่อนปิด
      </p>
    </main>
  )
}
