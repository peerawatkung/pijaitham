interface BackLinkProps {
  onClick: () => void
}

/** ลิงก์ "กลับหน้าแรก" ที่ใช้ซ้ำในหลายหน้า — พื้นที่กดอย่างน้อย 44px ตาม WCAG 2.5.5 */
export function BackLink({ onClick }: BackLinkProps) {
  return (
    <button
      type="button"
      className="inline-flex min-h-[44px] items-center whitespace-nowrap text-base text-ink-soft underline underline-offset-4 hover:text-ink"
      onClick={onClick}
    >
      กลับหน้าแรก
    </button>
  )
}
