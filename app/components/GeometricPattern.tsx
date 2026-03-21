interface GeometricPatternProps {
  size?: number;
  opacity?: number;
  className?: string;
}

export function GeometricPattern({
  size = 200,
  opacity = 0.06,
  className = '',
}: GeometricPatternProps) {
  const cx = 100;
  const cy = 100;
  const midRadius = 52;

  const dots = [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => ({
    x: cx + midRadius * Math.cos(((deg - 90) * Math.PI) / 180),
    y: cy + midRadius * Math.sin(((deg - 90) * Math.PI) / 180),
  }));

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      className={`text-amber-500 pointer-events-none select-none ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* Outer octagon ring */}
      <polygon
        points="100,8 142,30 172,72 172,128 142,170 100,192 58,170 28,128 28,72 58,30"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      {/* 8-pointed star */}
      <polygon
        points="100,22 114,58 150,58 122,80 133,116 100,95 67,116 78,80 50,58 86,58"
        stroke="currentColor"
        strokeWidth="0.75"
        fill="none"
      />
      {/* Second rotated 8-pointed star (45 deg) */}
      <polygon
        points="100,32 118,65 155,65 127,87 138,122 100,100 62,122 73,87 45,65 82,65"
        stroke="currentColor"
        strokeWidth="0.4"
        fill="none"
        opacity="0.5"
      />
      {/* Center circle */}
      <circle cx={cx} cy={cy} r="16" stroke="currentColor" strokeWidth="0.75" fill="none" />
      {/* Inner detail ring */}
      <circle cx={cx} cy={cy} r="28" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.5" />
      {/* 8 dot markers at mid-radius */}
      {dots.map((dot, i) => (
        <circle key={i} cx={dot.x} cy={dot.y} r="2" fill="currentColor" opacity="0.55" />
      ))}
    </svg>
  );
}
