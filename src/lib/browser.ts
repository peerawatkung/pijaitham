/**
 * ตรวจจับเบราว์เซอร์ในแอป (LINE / Facebook / Instagram / Messenger)
 * ซึ่งมักบล็อกการดาวน์โหลดไฟล์ blob — ต้องพาผู้ใช้ออกไปเบราว์เซอร์จริง
 */
export function detectInAppBrowser(): { inApp: boolean; isLine: boolean } {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const isLine = /\bLine\//i.test(ua)
  const inApp = isLine || /FBAN|FBAV|FB_IAB|Instagram|Messenger/i.test(ua)
  return { inApp, isLine }
}

/**
 * ลิงก์เปิดหน้าปัจจุบันในเบราว์เซอร์ภายนอก —
 * LINE รองรับพารามิเตอร์ openExternalBrowser=1 อย่างเป็นทางการ
 */
export function externalBrowserUrl(): string {
  const url = new URL(window.location.href)
  url.searchParams.set('openExternalBrowser', '1')
  return url.toString()
}

/** ข้อความแนะนำเมื่อดาวน์โหลดล้มเหลวในเบราว์เซอร์ในแอป */
export function downloadErrorMessage(): string {
  return detectInAppBrowser().inApp
    ? 'เบราว์เซอร์ในแอป (เช่น LINE) มักไม่รองรับการดาวน์โหลดไฟล์ — กรุณาแตะแถบด้านบนสุดเพื่อเปิดในเบราว์เซอร์ปกติ แล้วลองอีกครั้ง'
    : 'สร้างเอกสารไม่สำเร็จ กรุณาลองอีกครั้ง'
}
