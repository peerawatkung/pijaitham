import { detectInAppBrowser } from './browser'

/**
 * ส่งมอบไฟล์ให้ผู้ใช้แบบเหมาะกับสภาพแวดล้อม:
 * เบราว์เซอร์ในแอป (LINE ฯลฯ) บล็อกการดาวน์โหลด blob — ใช้เมนูแชร์ของระบบแทน
 * (ผู้ใช้เลือก "บันทึกลงไฟล์" จาก share sheet ได้) เบราว์เซอร์ปกติดาวน์โหลดตรง
 */
export async function shareOrDownload(
  blob: Blob,
  fileName: string,
): Promise<void> {
  if (detectInAppBrowser().inApp && typeof navigator.canShare === 'function') {
    const file = new File([blob], fileName, { type: blob.type })
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] })
        return
      } catch (err) {
        // ผู้ใช้กดปิด share sheet เอง — ไม่ใช่ข้อผิดพลาด
        if (err instanceof DOMException && err.name === 'AbortError') return
        // แชร์ไม่ได้ — ลองดาวน์โหลดปกติ
      }
    }
  }
  downloadBlob(blob, fileName)
}

/** ดาวน์โหลด Blob เป็นไฟล์ในเบราว์เซอร์ — ใช้ร่วมกันทั้ง PDF และแบบร่าง JSON */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** แปลงชื่อคนเป็นส่วนหนึ่งของชื่อไฟล์ที่ปลอดภัยทุก OS */
export function safeFileSlug(name: string): string {
  return name.replace(/[\\/:*?"<>|\s]+/g, '-').replace(/^-+|-+$/g, '')
}

/** วันที่รูปแบบ YYYYMMDD (ค.ศ.) สำหรับชื่อไฟล์ */
export function ymd(date: Date = new Date()): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('')
}
