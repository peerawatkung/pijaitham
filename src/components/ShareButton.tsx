import { useState } from 'react'
import { APP_CONFIG } from '../config/app'

/**
 * ลิงก์ที่แชร์แนบ openExternalBrowser=1 เสมอ —
 * คนที่กดจากแชท LINE จะเปิดในเบราว์เซอร์จริงทันที ไม่ติดข้อจำกัดดาวน์โหลดไฟล์
 */
const SHARE_URL = `https://${APP_CONFIG.domain}/?openExternalBrowser=1`
const SHARE_TEXT = `ชวนเขียน "หนังสือแสดงเจตนา" (Living Will) กับ${APP_CONFIG.name} — บอกความตั้งใจเรื่องการดูแลช่วงท้ายของชีวิตไว้ล่วงหน้า ให้คนที่เรารักไม่ต้องเดา ใช้ฟรี ไม่เก็บข้อมูลใด ๆ`

export function ShareButton() {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    // มือถือ: เมนูแชร์ของระบบ (ส่งเข้า LINE/Messenger ได้ตรง)
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: APP_CONFIG.name,
          text: SHARE_TEXT,
          url: SHARE_URL,
        })
        return
      } catch (err) {
        // ผู้ใช้กดปิดเมนูเอง — จบเงียบ ๆ
        if (err instanceof DOMException && err.name === 'AbortError') return
        // แชร์ไม่ได้ — ลองคัดลอกแทน
      }
    }
    // เดสก์ท็อป: คัดลอกข้อความชวน + ลิงก์
    try {
      await navigator.clipboard.writeText(`${SHARE_TEXT}\n${SHARE_URL}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      // clipboard ใช้ไม่ได้ — เปิดหน้าแชร์ของ LINE เป็นทางสุดท้าย
      window.open(
        `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(SHARE_URL)}`,
        '_blank',
      )
    }
  }

  return (
    <button
      type="button"
      className="inline-flex items-center gap-2.5 rounded-xl bg-tea-700 px-7 py-3.5 text-lg font-bold text-white shadow-sm transition-colors hover:bg-tea-600 focus:outline-none focus:ring-4 focus:ring-tea-600/40"
      onClick={() => void handleShare()}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 10.7 6.8-4.4M8.6 13.3l6.8 4.4" />
      </svg>
      {copied ? 'คัดลอกข้อความชวนแล้ว — วางส่งได้เลย' : 'แชร์ให้คนที่คุณรัก'}
    </button>
  )
}
