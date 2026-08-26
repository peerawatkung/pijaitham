import { Suspense, lazy } from 'react'
import { FontSizeControl } from './components/FontSizeControl'
import { InAppBrowserNotice } from './components/InAppBrowserNotice'
import { Logo } from './components/Logo'
import { APP_CONFIG } from './config/app'
import { Done } from './pages/Done'
import { Home } from './pages/Home'
import { OpenCloud } from './pages/OpenCloud'
import { Review } from './pages/Review'
import { StoreChoice } from './pages/StoreChoice'
import { Wizard } from './pages/Wizard'
import { useForm } from './state/FormContext'

// หน้าเนื้อหา (ไม่อยู่ใน flow หลักของการกรอกเอกสาร) โหลดเมื่อผู้ใช้เปิดเท่านั้น —
// ลด bundle แรกที่ต้องรอก่อนเห็นหน้าแรก; chunk เหล่านี้ยังถูก SW precache
// อัตโนมัติ จึงใช้ออฟไลน์ได้เหมือนเดิมหลังเปิดเว็บครั้งแรก
const About = lazy(() => import('./pages/About').then((m) => ({ default: m.About })))
const Faq = lazy(() => import('./pages/Faq').then((m) => ({ default: m.Faq })))
const ForDoctors = lazy(() =>
  import('./pages/ForDoctors').then((m) => ({ default: m.ForDoctors })),
)
const HelpParents = lazy(() =>
  import('./pages/HelpParents').then((m) => ({ default: m.HelpParents })),
)
const Resources = lazy(() =>
  import('./pages/Resources').then((m) => ({ default: m.Resources })),
)
const Sample = lazy(() =>
  import('./pages/Sample').then((m) => ({ default: m.Sample })),
)
const TalkGuide = lazy(() =>
  import('./pages/TalkGuide').then((m) => ({ default: m.TalkGuide })),
)

function CurrentPage() {
  const { page } = useForm()

  switch (page.name) {
    case 'home':
      return <Home />
    case 'wizard':
      return <Wizard step={page.step} />
    case 'review':
      return <Review />
    case 'done':
      return <Done />
    case 'faq':
      return <Faq />
    case 'sample':
      return <Sample />
    case 'about':
      return <About />
    case 'talkGuide':
      return <TalkGuide />
    case 'resources':
      return <Resources />
    case 'forDoctors':
      return <ForDoctors />
    case 'helpParents':
      return <HelpParents />
    case 'openCloud':
      return <OpenCloud />
    case 'storeChoice':
      return <StoreChoice />
  }
}

export function App() {
  const { page, goHome } = useForm()

  return (
    <>
      <InAppBrowserNotice />
      <header className="mx-auto flex max-w-2xl items-center justify-between px-5 pt-4">
        {page.name === 'home' ? (
          <span />
        ) : (
          <button
            type="button"
            className="flex min-h-[44px] items-center gap-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-tea-600/40"
            onClick={goHome}
            aria-label="กลับหน้าแรก พิใจธรรม"
          >
            <Logo size={34} />
            <span className="whitespace-nowrap text-lg font-bold text-tea-700">
              {APP_CONFIG.name}
            </span>
          </button>
        )}
        <FontSizeControl />
      </header>
      <Suspense
        fallback={
          <p className="p-10 text-center text-lg text-ink-soft">
            กำลังเปิดหน้า...
          </p>
        }
      >
        <CurrentPage />
      </Suspense>
    </>
  )
}
