"use client";

import { useId } from "react";

const LEVEL_COLORS: Record<number, { start: string; end: string }> = {
  1: { start: "#9e9e9e", end: "#5a5a5a" },
  2: { start: "#9e9e9e", end: "#5a5a5a" },
  3: { start: "#9e9e9e", end: "#5a5a5a" },
  4: { start: "#1ce400", end: "#0d7a00" },
  5: { start: "#1ce400", end: "#0d7a00" },
  6: { start: "#ffd700", end: "#8b7200" },
  7: { start: "#ffd700", end: "#8b7200" },
  8: { start: "#ff8000", end: "#994d00" },
  9: { start: "#ff8000", end: "#994d00" },
  10: { start: "#f50000", end: "#8b0000" },
};

interface FaceitSkillIconProps {
  level: number;
  size?: number;
  className?: string;
}

export function FaceitSkillIcon({ level, size = 24, className }: FaceitSkillIconProps) {
  const uid = useId().replace(/:/g, "");
  const clamped = Math.min(10, Math.max(1, Math.round(level)));
  const colors = LEVEL_COLORS[clamped] ?? { start: "#9e9e9e", end: "#5a5a5a" };

  const bgGrad = `bar-bg-gradient__${uid}`;
  const fillGrad = `fill-gradient__${uid}`;
  const calGrad = `fill-calibration__${uid}`;
  const dashOffset = (10 - clamped + 0.01).toFixed(2);

  const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={className}
      aria-label={`Nível FACEIT ${clamped}`}
      style={
        {
          "--fill-start": colors.start,
          "--fill-end": colors.end,
        } as React.CSSProperties
      }
    >
      <defs>
        <radialGradient id={bgGrad} cx="0.5" cy="0.5" r="0.55">
          <stop offset="0.4" stopColor="#5D5D5D" />
          <stop offset="1" stopColor="#242424" />
        </radialGradient>
        <linearGradient id={fillGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.5" stopColor={colors.start} />
          <stop offset="1" stopColor={colors.end} />
        </linearGradient>
        <radialGradient id={calGrad} cx="0" cy="0.9" r="2">
          <stop offset="0.0865385" stopColor="#2A2A2A" />
          <stop offset="0.384615" stopColor="#4A4A4A" />
          <stop offset="0.711538" stopColor="#8D8D8D" />
          <stop offset="1" stopColor="#A6A6A6" />
        </radialGradient>
      </defs>

      <circle r="50%" cx="50%" cy="50%" fill="#060606" />

      <path
        d=" M 6.5, 18.4 A 8.4, 8.4 0 1 1 17.5, 18.4 "
        stroke={`url(#${bgGrad})`}
        strokeWidth="2.4"
      />
      <path
        d=" M 6.5, 18.4 A 8.4, 8.4 0 1 1 17.5, 18.4 "
        stroke={`url(#${fillGrad})`}
        strokeWidth="2.4"
        strokeDasharray="10.1, 10000"
        strokeDashoffset={dashOffset}
        pathLength="10"
      />

      {levels.map((n) => (
        <text
          key={n}
          x={n === 10 ? "49%" : n % 2 === 0 ? "51%" : "50%"}
          y="49%"
          fill={`url(#${fillGrad})`}
          style={{
            fontSize: "8px",
            fontFamily: "sans-serif",
            fontWeight: "bold",
            textAnchor: "middle",
            dominantBaseline: "central",
            userSelect: "none",
            cursor: "default",
            opacity: n === clamped ? 1 : 0,
          }}
        >
          {n}
        </text>
      ))}
    </svg>
  );
}
