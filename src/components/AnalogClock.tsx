import React, { useEffect, useState } from 'react';

function getTimeParts(date: Date) {
  return {
    hours: date.getHours() % 12,
    minutes: date.getMinutes(),
    seconds: date.getSeconds(),
  };
}

export default function AnalogClock({ size = 140 }: { size?: number }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const { hours, minutes, seconds } = getTimeParts(now);
  const radius = size / 2;
  const center = radius;
  const hourLength = radius * 0.5;
  const minuteLength = radius * 0.7;
  const secondLength = radius * 0.85;

  // Calculate angles
  const hourAngle = ((hours + minutes / 60) * 30 - 90) * Math.PI / 180;
  const minuteAngle = ((minutes + seconds / 60) * 6 - 90) * Math.PI / 180;
  const secondAngle = (seconds * 6 - 90) * Math.PI / 180;

  // Numbers positions
  const numbers = Array.from({ length: 12 }, (_, i) => {
    const angle = ((i + 1) * 30 - 90) * Math.PI / 180;
    const x = center + Math.cos(angle) * (radius * 0.8);
    const y = center + Math.sin(angle) * (radius * 0.8);
    return { x, y, n: i + 1 };
  });

  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={center} cy={center} r={radius - 4} fill="#fff" stroke="#333" strokeWidth={3} />
      {/* Numbers */}
      {numbers.map(({ x, y, n }) => (
        <text key={n} x={x} y={y + 5} textAnchor="middle" fontSize={size * 0.13} fill="#333" fontWeight="bold">{n}</text>
      ))}
      {/* Hour hand */}
      <line x1={center} y1={center} x2={center + Math.cos(hourAngle) * hourLength} y2={center + Math.sin(hourAngle) * hourLength} stroke="#222" strokeWidth={5} strokeLinecap="round" />
      {/* Minute hand */}
      <line x1={center} y1={center} x2={center + Math.cos(minuteAngle) * minuteLength} y2={center + Math.sin(minuteAngle) * minuteLength} stroke="#1976d2" strokeWidth={3} strokeLinecap="round" />
      {/* Second hand */}
      <line x1={center} y1={center} x2={center + Math.cos(secondAngle) * secondLength} y2={center + Math.sin(secondAngle) * secondLength} stroke="#e53935" strokeWidth={2} strokeLinecap="round" />
      {/* Center dot */}
      <circle cx={center} cy={center} r={6} fill="#1976d2" />
    </svg>
  );
}
