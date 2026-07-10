import { FontSizeControl } from './components/FontSizeControl'
import { InAppBrowserNotice } from './components/InAppBrowserNotice'
import { Logo } from './components/Logo'
import { APP_CONFIG } from './config/app'
import { About } from './pages/About'
import { Done } from './pages/Done'
import { Faq } from './pages/Faq'
import { Home } from './pages/Home'
import { Resources } from './pages/Resources'
import { Review } from './pages/Review'
import { Sample } from './pages/Sample'
import { TalkGuide } from './pages/TalkGuide'
import { Wizard } from './pages/Wizard'
import { useForm } from './state/FormContext'

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
            className="flex items-center gap-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-tea-600/40"
            onClick={goHome}
            aria-label="กลับหน้าแรก พิใจธรรม"
          >
            <Logo size={34} />
            <span className="text-lg font-bold text-tea-700">
              {APP_CONFIG.name}
            </span>
          </button>
        )}
        <FontSizeControl />
      </header>
      <CurrentPage />
    </>
  )
}
