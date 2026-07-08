import { useEffect, useState } from 'react'

/** ขนาดฐานของ html (px) — ทุกอย่างในแอปใช้ rem จึงขยายตามทั้งหมด */
const SIZES = [15, 17, 19, 21]
const DEFAULT_INDEX = 1

const buttonClass =
  'rounded-md px-2.5 py-1 text-ink transition-colors hover:bg-tea-100 focus:outline-none focus:ring-2 focus:ring-tea-600/40 disabled:opacity-35 disabled:hover:bg-transparent'

/** ปุ่มปรับขนาดตัวอักษร — ผู้ใช้สูงวัยจำนวนมากต้องการตัวหนังสือใหญ่ขึ้น */
export function FontSizeControl() {
  const [index, setIndex] = useState(DEFAULT_INDEX)

  useEffect(() => {
    document.documentElement.style.fontSize = `${SIZES[index]}px`
  }, [index])

  return (
    <div
      role="group"
      aria-label="ปรับขนาดตัวอักษร"
      className="flex items-center gap-0.5 rounded-lg border border-tea-200 bg-card px-1 py-0.5"
    >
      <button
        type="button"
        aria-label="ลดขนาดตัวอักษร"
        disabled={index === 0}
        className={`${buttonClass} text-sm`}
        onClick={() => setIndex((i) => Math.max(0, i - 1))}
      >
        ก−
      </button>
      <button
        type="button"
        aria-label="เพิ่มขนาดตัวอักษร"
        disabled={index === SIZES.length - 1}
        className={`${buttonClass} text-xl leading-none`}
        onClick={() => setIndex((i) => Math.min(SIZES.length - 1, i + 1))}
      >
        ก+
      </button>
    </div>
  )
}
