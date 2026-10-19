import React from "react";
import { CHART_COLOR } from "../data/careerCompassData";

export function DonutChart({ items = [], size = 176, thickness = 28 }) {
  const total = items.reduce((a, b) => a + (b.value || 0), 0) || 1;
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;
  let acc = 0;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="proportion chart">
      {items.length === 0 ? (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line)" strokeWidth={thickness} />
      ) : (
        items.map((it, idx) => {
          const frac = (it.value || 0) / total;
          const len = frac * C;
          const rotate = -90 + (acc / total) * 360;
          acc += it.value || 0;
          return (
            <circle
              key={it.label || idx}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={it.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${C - len}`}
              transform={`rotate(${rotate} ${cx} ${cy})`}
            />
          );
        })
      )}
    </svg>
  );
}

export function ColumnChart({ items = [], width = 360, height = 200 }) {
  const padT = 26, padB = 34, padX = 14;
  const innerW = width - padX * 2, innerH = height - padT - padB;
  const n = items.length || 1;
  const gap = 14;
  const barW = (innerW - gap * (n - 1)) / n;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label="bar chart">
      <line x1={padX} y1={padT + innerH} x2={width - padX} y2={padT + innerH} stroke="var(--line)" strokeWidth="1" />
      {items.map((it, i) => {
        const h = Math.max(2, ((it.pct || 0) / 100) * innerH);
        const x = padX + i * (barW + gap);
        const y = padT + innerH - h;
        return (
          <g key={it.label || i}>
            <rect x={x} y={y} width={barW} height={h} rx="6" fill={it.color} />
            <text x={x + barW / 2} y={y - 8} textAnchor="middle" className="cv" fill="var(--ink)" style={{ font: "700 11px 'IBM Plex Mono', monospace" }}>
              {it.pct}%
            </text>
            <text x={x + barW / 2} y={height - 10} textAnchor="middle" className="cl" fill="var(--steel)" style={{ font: "600 10px 'Source Sans 3', sans-serif" }}>
              {it.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function LineChart({ items = [], width = 360, height = 190, color = CHART_COLOR.slate }) {
  const padT = 26, padB = 30, padX = 28;
  const innerW = width - padX * 2, innerH = height - padT - padB;
  const n = items.length || 1;
  const pts = items.map((it, i) => {
    const x = padX + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const y = padT + innerH - ((it.pct || 0) / 100) * innerH;
    return { x, y, it };
  });

  const lineStr = pts.map(p => `${p.x},${p.y}`).join(" ");
  const areaStr = `${padX},${padT + innerH} ${lineStr} ${padX + innerW},${padT + innerH}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label="line chart">
      <line x1={padX} y1={padT + innerH} x2={width - padX} y2={padT + innerH} stroke="var(--line)" strokeWidth="1" />
      <polygon points={areaStr} fill={color} opacity="0.12" />
      <polyline points={lineStr} fill="none" stroke={color} strokeWidth="2.5" />
      {pts.map((p, idx) => (
        <g key={p.it.label || idx}>
          <circle cx={p.x} cy={p.y} r="5.5" fill={color} stroke="#fff" strokeWidth="2" />
          <text x={p.x} y={p.y - 13} textAnchor="middle" fill="var(--ink)" style={{ font: "700 11px 'IBM Plex Mono', monospace" }}>
            {p.it.pct}%
          </text>
          <text x={p.x} y={height - 8} textAnchor="middle" fill="var(--steel)" style={{ font: "600 10px 'Source Sans 3', sans-serif" }}>
            {p.it.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function TwinBars({ longPct = 0, shortPct = 0, width = 360, height = 110 }) {
  const padX = 110, barH = 26, gapY = 18, top = 16;
  const innerW = width - padX - 50;
  const rows = [
    { label: "Long-term", pct: longPct, color: CHART_COLOR.red },
    { label: "Short-term", pct: shortPct, color: CHART_COLOR.slate }
  ];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label="long vs short term orientation">
      {rows.map((r, i) => {
        const y = top + i * (barH + gapY);
        const w = Math.max(3, ((r.pct || 0) / 100) * innerW);
        return (
          <g key={r.label}>
            <text x="0" y={y + barH / 2 + 4} fill="#211B19" style={{ font: "700 12px 'Source Sans 3', sans-serif" }}>
              {r.label}
            </text>
            <rect x={padX} y={y} width={innerW} height={barH} rx="13" fill="#F2F4F6" />
            <rect x={padX} y={y} width={w} height={barH} rx="13" fill={r.color} />
            <text x={padX + innerW + 12} y={y + barH / 2 + 4} fill="#211B19" style={{ font: "700 12px 'IBM Plex Mono', monospace" }}>
              {r.pct}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function HBarChart({ items = [], width = 360 }) {
  const padX = 150, barH = 22, gapY = 14, top = 6;
  const innerW = width - padX - 50;
  const height = top * 2 + items.length * (barH + gapY) - gapY;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label="horizontal bar chart">
      {items.map((r, i) => {
        const y = top + i * (barH + gapY);
        const w = Math.max(3, ((r.pct || 0) / 100) * innerW);
        return (
          <g key={r.label || i}>
            <text x="0" y={y + barH / 2 + 4} fill="#211B19" style={{ font: "600 11.5px 'Source Sans 3', sans-serif" }}>
              {r.label}
            </text>
            <rect x={padX} y={y} width={innerW} height={barH} rx="6" fill="#F2F4F6" />
            <rect x={padX} y={y} width={w} height={barH} rx="6" fill={r.color} />
            <text x={padX + innerW + 12} y={y + barH / 2 + 4} fill="#211B19" style={{ font: "700 11.5px 'IBM Plex Mono', monospace" }}>
              {r.pct}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}
