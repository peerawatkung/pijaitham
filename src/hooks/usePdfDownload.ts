import { useCallback, useState } from 'react'
import type { FormAnswers } from '../types/form'

/** สถานะการสร้าง/ดาวน์โหลด PDF — ใช้ร่วมกันในหน้าตรวจทานและหน้าขั้นตอนถัดไป */
export function usePdfDownload(answers: FormAnswers, onSuccess?: () => void) {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const download = useCallback(async () => {
    setGenerating(true)
    setError(null)
    try {
      // โหลด PDF engine (pdf-lib) เฉพาะเมื่อผู้ใช้กดดาวน์โหลด — ไม่ถ่วง bundle หลัก
      const { downloadPdf } = await import('../lib/pdf/generator')
      await downloadPdf(answers)
      onSuccess?.()
    } catch (err) {
      console.error(err)
      setError('สร้างเอกสารไม่สำเร็จ กรุณาลองอีกครั้ง')
    } finally {
      setGenerating(false)
    }
  }, [answers, onSuccess])

  return { generating, error, download }
}
