interface BackLinkProps {
  onClick: () => void
  /** ข้อความบนลิงก์ — ค่าเริ่มต้น "กลับหน้าแรก" */
  label?: string
}

/** ลิงก์ย้อนกลับที่ใช้ซ้ำในหลายหน้า — พื้นที่กดอย่างน้อย 44px ตาม WCAG 2.5.5 */
export function BackLink({ onClick, label = 'กลับหน้าแรก' }: BackLinkProps) {
  return (
    <button
      type="button"
      className="inline-flex min-h-[44px] items-center whitespace-nowrap text-base text-ink-soft underline underline-offset-4 hover:text-ink"
      onClick={onClick}
    >
      {label}
    </button>
  )
}
