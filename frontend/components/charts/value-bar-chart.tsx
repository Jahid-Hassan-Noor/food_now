"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function valuesTotal(values: number[]) {
  return values.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0)
}

export function ValueBarChart({
  title,
  subtitle,
  labels,
  values,
  isDark,
  formatter,
  gradientId,
  startColor,
  endColor,
  totalLabel,
  peakLabel,
  leftPadding = 52,
}: {
  title: string
  subtitle: string
  labels: string[]
  values: number[]
  isDark: boolean
  formatter: (value: number) => string
  gradientId: string
  startColor: string
  endColor: string
  totalLabel: string
  peakLabel: string
  leftPadding?: number
}) {
  const width = 740
  const height = 300
  const padding = { top: 22, right: 18, bottom: 42, left: leftPadding }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const maxValue = Math.max(1, ...values)
  const slotWidth = chartWidth / Math.max(labels.length, 1)
  const barWidth = Math.min(30, slotWidth * 0.58)
  const total = valuesTotal(values)
  const peak = Math.max(...values, 0)
  const gridColor = isDark ? "rgba(148, 163, 184, 0.28)" : "#e2e8f0"
  const axisTextColor = isDark ? "#cbd5e1" : "#64748b"

  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-foreground text-base">{title}</CardTitle>
        <CardDescription className="text-muted-foreground text-sm">{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="h-72 min-w-[680px]">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={startColor} stopOpacity="0.95" />
                <stop offset="100%" stopColor={endColor} stopOpacity="0.5" />
              </linearGradient>
            </defs>
            {Array.from({ length: 5 }, (_, idx) => {
              const y = padding.top + (idx / 4) * chartHeight
              const value = maxValue - (idx / 4) * maxValue
              return (
                <g key={idx}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + chartWidth}
                    y2={y}
                    stroke={gridColor}
                    strokeWidth="1"
                    strokeDasharray="4 8"
                  />
                  <text x={8} y={y + 4} fill={axisTextColor} fontSize="11">
                    {formatter(value)}
                  </text>
                </g>
              )
            })}
            {values.map((value, idx) => {
              const x = padding.left + idx * slotWidth + (slotWidth - barWidth) / 2
              const barHeight = (value / maxValue) * chartHeight
              const y = padding.top + chartHeight - barHeight
              return (
                <g key={labels[idx] ?? idx}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="8"
                    fill={`url(#${gradientId})`}
                    opacity="0.95"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={height - 12}
                    fill={axisTextColor}
                    fontSize="11"
                    textAnchor="middle"
                  >
                    {labels[idx]}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="bg-muted/40 border-border rounded-xl border p-3">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">{totalLabel}</p>
            <p className="text-foreground mt-1 text-lg font-semibold">{formatter(total)}</p>
          </div>
          <div className="bg-muted/40 border-border rounded-xl border p-3">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">{peakLabel}</p>
            <p className="text-foreground mt-1 text-lg font-semibold">{formatter(peak)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
