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
