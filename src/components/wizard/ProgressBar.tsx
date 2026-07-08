import { SECTIONS, TOTAL_STEPS } from '../../content/questions'

interface ProgressBarProps {
  /** step ปัจจุบัน (0-based) */
  current: number
}

// ---- signature element: เส้นทางสายน้ำที่ค่อย ๆ เดินไปถึงปลายทาง ----
const W = 700
const H = 64
const PAD = 16
/** จังหวะคลื่นเบา ๆ ของเส้นทาง (ค่า y ของแต่ละหมุด) */
const WAVE = [46, 28, 42, 24, 40, 26, 36]

const points = SECTIONS.map((_, i) => ({
  x: PAD + (i * (W - PAD * 2)) / (TOTAL_STEPS - 1),
  y: WAVE[i % WAVE.length],
}))

/** เส้นโค้งลื่นผ่านทุกหมุด (แนวสัมผัสราบที่หมุด ให้ดูเป็นสายน้ำ) */
const pathD = points
  .map((p, i) => {
    if (i === 0) return `M ${p.x},${p.y}`
    const prev = points[i - 1]
    const half = (p.x - prev.x) / 2
    return `C ${prev.x + half},${prev.y} ${p.x - half},${p.y} ${p.x},${p.y}`
  })
  .join(' ')

export function ProgressBar({ current }: ProgressBarProps) {
  const section = SECTIONS[current]
  const fraction = TOTAL_STEPS > 1 ? current / (TOTAL_STEPS - 1) : 1

  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={TOTAL_STEPS}
      aria-valuenow={current + 1}
      aria-label={`ส่วนที่ ${current + 1} จาก ${TOTAL_STEPS}: ${section.shortTitle}`}
    >
      <p className="text-base text-ink-soft">
        ส่วนที่ {current + 1} จาก {TOTAL_STEPS} · {section.shortTitle}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-1 h-auto w-full"
        aria-hidden="true"
        focusable="false"
      >
        {/* เส้นทางทั้งหมด (จาง) */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--color-tea-200)"
          strokeWidth={3}
          strokeLinecap="round"
        />
        {/* ระยะทางที่เดินมาแล้ว */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--color-tea-600)"
          strokeWidth={3.5}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${fraction * 100} 100`}
          className="transition-[stroke-dasharray] duration-500"
        />
        {points.map((p, i) => {
          const isCurrent = i === current
          const isDone = i < current
          return (
            <g key={SECTIONS[i].id}>
              {isCurrent ? (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={11}
                  fill="none"
                  stroke="var(--color-tea-600)"
                  strokeWidth={1.5}
                  opacity={0.5}
                />
              ) : null}
              <circle
                cx={p.x}
                cy={p.y}
                r={isCurrent ? 7 : 5}
                fill={
                  isCurrent
                    ? 'var(--color-tea-700)'
                    : isDone
                      ? 'var(--color-tea-600)'
                      : 'var(--color-card)'
                }
                stroke={
                  isDone || isCurrent
                    ? 'var(--color-tea-600)'
                    : 'var(--color-tea-200)'
                }
                strokeWidth={2}
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
