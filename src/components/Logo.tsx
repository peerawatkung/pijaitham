/**
 * โลโก้พิใจธรรม (ฉบับ SVG วาดตามต้นแบบ): เส้นลายมือคลี่เป็นรูปหัวใจ
 * แล้วไหลต่อไปเป็นก้านของใบโพธิ์ — หัวใจ (พิใจ) เชื่อมกับธรรม (ใบโพธิ์)
 */
interface LogoProps {
  /** ความสูงหน่วย px (กว้างตามสัดส่วน) */
  size?: number
  className?: string
}

export function Logo({ size = 96, className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 260 120"
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* เส้นหัวใจลายมือ ต่อเนื่องเส้นเดียวไหลไปทางขวา */}
      <path
        d="M10,76
           C22,90 40,97 56,92
           C48,99 37,98 35,91
           C33,84 44,80 53,85
           C58,88 63,87 67,82
           C52,68 46,46 59,37
           C70,30 82,36 82,50
           C86,35 99,31 108,40
           C117,50 111,69 86,86
           C104,94 134,89 157,75
           C172,65 186,57 197,53"
        fill="none"
        stroke="#3d5244"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      {/* ใบโพธิ์ */}
      <path
        d="M197,53
           C182,32 196,10 214,7
           C234,4 248,20 242,38
           C237,52 216,62 197,53 Z"
        fill="#a9bfa0"
      />
      {/* ปลายใบ (drip tip) ของใบโพธิ์ */}
      <path
        d="M225,57 C228,70 226,82 219,93"
        fill="none"
        stroke="#a9bfa0"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* เส้นใบ */}
      <g stroke="#f6f3e8" strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M200,52 C214,42 228,28 238,14" />
        <path d="M208,46 C206,38 204,28 205,20" />
        <path d="M218,38 C219,29 221,22 224,15" />
        <path d="M214,44 C222,42 231,38 237,33" />
        <path d="M207,50 C215,51 226,50 233,46" />
      </g>
    </svg>
  )
}
