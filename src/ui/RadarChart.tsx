import { HeroDefinition } from "../game/core/types";

interface RadarChartProps {
  radar: HeroDefinition["radar"];
}

const axes: Array<[keyof HeroDefinition["radar"], string]> = [
  ["damage", "输出"],
  ["durability", "承伤"],
  ["control", "控制"],
  ["mobility", "机动"],
  ["utility", "支援"]
];

function points(values: number[], radius: number): string {
  return values
    .map((value, index) => {
      const angle = -Math.PI / 2 + (index / values.length) * Math.PI * 2;
      const r = radius * (value / 100);
      return `${64 + Math.cos(angle) * r},${64 + Math.sin(angle) * r}`;
    })
    .join(" ");
}

export function RadarChart({ radar }: RadarChartProps) {
  const values = axes.map(([key]) => radar[key]);
  return (
    <div className="radar-wrap">
      <svg viewBox="0 0 128 128" className="radar-chart" aria-label="能力雷达图">
        {[1, 0.75, 0.5, 0.25].map((rate) => (
          <polygon key={rate} points={points([100, 100, 100, 100, 100], 54 * rate)} className="radar-grid" />
        ))}
        {axes.map(([, label], index) => {
          const angle = -Math.PI / 2 + (index / axes.length) * Math.PI * 2;
          return (
            <g key={label}>
              <line x1="64" y1="64" x2={64 + Math.cos(angle) * 56} y2={64 + Math.sin(angle) * 56} className="radar-axis" />
              <text x={64 + Math.cos(angle) * 64} y={64 + Math.sin(angle) * 64} className="radar-label">
                {label}
              </text>
            </g>
          );
        })}
        <polygon points={points(values, 54)} className="radar-value" />
      </svg>
    </div>
  );
}
