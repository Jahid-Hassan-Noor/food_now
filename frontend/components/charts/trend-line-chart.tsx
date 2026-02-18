"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Point = {
  x: number
  y: number
}

function tickIndexes(length: number, desiredTicks = 6) {
  if (length <= desiredTicks) return Array.from({ length }, (_, idx) => idx)
  const last = length - 1
  const steps = desiredTicks - 1
  const indexes = new Set<number>()
  for (let idx = 0; idx < desiredTicks; idx += 1) {
    indexes.add(Math.round((idx * last) / steps))
  }
  return Array.from(indexes).sort((a, b) => a - b)
}

function createLinePath(points: Point[]) {
  if (!points.length) return ""
  return points.map((point, idx) => `${idx === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")
}

function createAreaPath(points: Point[], baselineY: number) {
  if (!points.length) return ""
  const linePath = createLinePath(points)
  const first = points[0]
  const last = points[points.length - 1]
  return `${linePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`
}

function valuesTotal(values: number[]) {
  return values.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0)
}

function defaultDateLabel(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number)
  if (!year || !month || !day) return isoDate
  return new Date(year, month - 1, day).toLocaleDateString("en-MY", { month: "short", day: "numeric" })
}

export function TrendLineChart({
  title,
  subtitle,
  labels,
  values,
  lineColor,
  startColor,
  endColor,
  gradientId,
  isDark,
  formatter,
  leftPadding = 52,
  xLabelFormatter = defaultDateLabel,
}: {
  title: string
  subtitle: string
  labels: string[]
  values: number[]
  lineColor: string
  startColor: string
  endColor: string
  gradientId: string
  isDark: boolean
  formatter: (value: number) => string
  leftPadding?: number
  xLabelFormatter?: (value: string) => string
}) {
  const width = 740
  const height = 300
  const padding = { top: 24, right: 20, bottom: 40, left: leftPadding }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const maxValue = Math.max(1, ...values)
  const points = values.map((value, idx) => {
    const x = padding.left + (idx / Math.max(values.length - 1, 1)) * chartWidth
    const y = padding.top + (1 - value / maxValue) * chartHeight
    return { x, y }
  })
  const linePath = createLinePath(points)
  const areaPath = createAreaPath(points, padding.top + chartHeight)
  const xTicks = tickIndexes(labels.length, 6)
  const total = valuesTotal(values)
  const average = values.length ? total / values.length : 0
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
                <stop offset="0%" stopColor={startColor} stopOpacity="0.38" />
                <stop offset="100%" stopColor={endColor} stopOpacity="0.02" />
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
            {areaPath ? <path d={areaPath} fill={`url(#${gradientId})`} /> : null}
            {linePath ? (
              <path
                d={linePath}
                fill="none"
                stroke={lineColor}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            {points.map((point, idx) => {
              const isEdge = idx === 0 || idx === points.length - 1
              if (!isEdge && idx % 6 !== 0) return null
              return <circle key={idx} cx={point.x} cy={point.y} r="4" fill={lineColor} />
            })}
            {xTicks.map((idx) => {
              const x = padding.left + (idx / Math.max(labels.length - 1, 1)) * chartWidth
              return (
                <text key={idx} x={x} y={height - 12} fill={axisTextColor} fontSize="11" textAnchor="middle">
                  {xLabelFormatter(labels[idx] ?? "")}
                </text>
              )
            })}
          </svg>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="bg-muted/40 border-border rounded-xl border p-3">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Range Total</p>
            <p className="text-foreground mt-1 text-lg font-semibold">{formatter(total)}</p>
          </div>
          <div className="bg-muted/40 border-border rounded-xl border p-3">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Daily Average</p>
            <p className="text-foreground mt-1 text-lg font-semibold">{formatter(average)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
