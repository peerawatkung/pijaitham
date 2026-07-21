import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { saveStoredDraft } from '../lib/draftStorage'
import type { AnswerValue, FormAnswers } from '../types/form'

/**
 * การนำทางภายในแอปใช้ state ล้วน (ไม่ใช้ router) —
 * ข้อมูลอยู่ใน memory เท่านั้น การ refresh คือการเริ่มใหม่โดยตั้งใจ
 */
export type Page =
  | { name: 'home' }
  | { name: 'wizard'; step: number }
  | { name: 'review' }
  | { name: 'done' }
  | { name: 'faq' }
  | { name: 'sample' }
  | { name: 'about' }
  | { name: 'talkGuide' }
  | { name: 'resources' }
  | { name: 'forDoctors' }
  | { name: 'helpParents' }

interface FormContextValue {
  answers: FormAnswers
  setAnswer: (id: string, value: AnswerValue | undefined) => void
  /** แทนที่คำตอบทั้งหมด (ใช้ตอนเปิดแบบร่างจากไฟล์) */
  loadAnswers: (answers: FormAnswers) => void
  page: Page
  goHome: () => void
  goToStep: (step: number) => void
  goToReview: () => void
  goToDone: () => void
  goToFaq: () => void
  goToSample: () => void
  goToAbout: () => void
  goToTalkGuide: () => void
  goToResources: () => void
  goToForDoctors: () => void
  goToHelpParents: () => void
}

const FormContext = createContext<FormContextValue | null>(null)

/**
 * รองรับ deep link เส้นทางเดียว: /doctors (ปลายทางของ QR บนการ์ดและเอกสาร)
 * — เส้นทางอื่นเริ่มที่หน้าแรกเสมอ
 */
function initialPage(): Page {
  if (
    typeof window !== 'undefined' &&
    window.location.pathname.replace(/\/+$/, '') === '/doctors'
  ) {
    return { name: 'forDoctors' }
  }
  return { name: 'home' }
}

export function FormProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<FormAnswers>({})
  const [page, setPage] = useState<Page>(initialPage)

  const setAnswer = useCallback(
    (id: string, value: AnswerValue | undefined) => {
      setAnswers((prev) => {
        const next = { ...prev }
        if (value === undefined) {
          delete next[id]
        } else {
          next[id] = value
        }
        return next
      })
    },
    [],
  )

  const loadAnswers = useCallback((next: FormAnswers) => {
    setAnswers(next)
  }, [])

  // บันทึกร่างอัตโนมัติลง localStorage (อยู่ในเครื่องเท่านั้น) —
  // debounce สั้น ๆ กันเขียนถี่เกินระหว่างพิมพ์
  const [draftSaveFailed, setDraftSaveFailed] = useState(false)
  useEffect(() => {
    if (Object.keys(answers).length === 0) return
    const timer = setTimeout(() => {
      setDraftSaveFailed(!saveStoredDraft(answers))
    }, 400)
    return () => clearTimeout(timer)
  }, [answers])

  // เตือนก่อนปิด/refresh เฉพาะเมื่อบันทึกอัตโนมัติใช้ไม่ได้ (เช่นโหมดส่วนตัว)
  // — กรณีปกติร่างถูกเก็บในเครื่องแล้ว ปิดหน้าได้อย่างปลอดภัย
  useEffect(() => {
    if (!draftSaveFailed || Object.keys(answers).length === 0) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = '' // จำเป็นสำหรับ Chrome รุ่นเก่า
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [answers, draftSaveFailed])

  const goHome = useCallback(() => setPage({ name: 'home' }), [])
  const goToStep = useCallback(
    (step: number) => setPage({ name: 'wizard', step }),
    [],
  )
  const goToReview = useCallback(() => setPage({ name: 'review' }), [])
  const goToDone = useCallback(() => setPage({ name: 'done' }), [])
  const goToFaq = useCallback(() => setPage({ name: 'faq' }), [])
  const goToSample = useCallback(() => setPage({ name: 'sample' }), [])
  const goToAbout = useCallback(() => setPage({ name: 'about' }), [])
  const goToTalkGuide = useCallback(() => setPage({ name: 'talkGuide' }), [])
  const goToResources = useCallback(() => setPage({ name: 'resources' }), [])
  const goToForDoctors = useCallback(() => setPage({ name: 'forDoctors' }), [])
  const goToHelpParents = useCallback(
    () => setPage({ name: 'helpParents' }),
    [],
  )

  return (
    <FormContext.Provider
      value={{
        answers,
        setAnswer,
        loadAnswers,
        page,
        goHome,
        goToStep,
        goToReview,
        goToDone,
        goToFaq,
        goToSample,
        goToAbout,
        goToTalkGuide,
        goToResources,
        goToForDoctors,
        goToHelpParents,
      }}
    >
      {children}
    </FormContext.Provider>
  )
}

export function useForm(): FormContextValue {
  const ctx = useContext(FormContext)
  if (!ctx) throw new Error('useForm ต้องใช้ภายใน <FormProvider>')
  return ctx
}
