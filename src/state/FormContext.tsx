import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { ReactNode } from 'react'
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
}

const FormContext = createContext<FormContextValue | null>(null)

export function FormProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<FormAnswers>({})
  const [page, setPage] = useState<Page>({ name: 'home' })

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

  // ข้อมูลอยู่ใน memory เท่านั้น — เตือนก่อนปิด/refresh ถ้ามีคำตอบที่ยังไม่ได้บันทึก
  useEffect(() => {
    if (Object.keys(answers).length === 0) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = '' // จำเป็นสำหรับ Chrome รุ่นเก่า
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [answers])

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
