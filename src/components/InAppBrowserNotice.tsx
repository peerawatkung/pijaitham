import { detectInAppBrowser, externalBrowserUrl } from '../lib/browser'

const { inApp, isLine } = detectInAppBrowser()

/**
 * แถบเตือนเมื่อเปิดผ่านเบราว์เซอร์ในแอป (LINE ฯลฯ) ซึ่งดาวน์โหลดไฟล์ไม่ได้
 * — LINE รองรับลิงก์ openExternalBrowser=1 เปิด Chrome/Safari ให้อัตโนมัติ
 */
export function InAppBrowserNotice() {
  if (!inApp) return null

  return (
    <div className="bg-tea-700 px-4 py-2.5 text-center text-base leading-relaxed text-white">
      {isLine ? (
        <a href={externalBrowserUrl()} className="underline underline-offset-4">
          กำลังเปิดผ่านแอป LINE ซึ่งดาวน์โหลดไฟล์ไม่ได้ —
          แตะที่นี่เพื่อเปิดในเบราว์เซอร์ แล้วใช้งานได้เต็มรูปแบบ
        </a>
      ) : (
        <span>
          กำลังเปิดผ่านเบราว์เซอร์ในแอป ซึ่งอาจดาวน์โหลดไฟล์ไม่ได้ —
          แนะนำเปิดในเบราว์เซอร์ปกติ (เมนู ⋯ → เปิดในเบราว์เซอร์)
        </span>
      )}
    </div>
  )
}
