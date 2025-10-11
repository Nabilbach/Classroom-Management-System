import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Typography, Card, CardBody, Button } from "@material-tailwind/react";
import Chart from 'react-apexcharts';

// Small reusable card
function DashboardCard({ title, value, children }: { title: string; value: string | number; children?: ReactNode }) {
  return (
    <Card className="p-4 shadow-sm">
      <CardBody>
        <div className="flex justify-between items-start">
          <div>
            <Typography variant="small" className="text-gray-600">
              {title}
            </Typography>
            <Typography variant="h5" className="font-semibold mt-2">
              {value}
            </Typography>
          </div>
          <div className="text-sm text-gray-400">{children}</div>
        </div>
      </CardBody>
    </Card>
  );
}

// Simple analog clock using SVG
function AnalogClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const seconds = now.getSeconds();
  const minutes = now.getMinutes() + seconds / 60;
  const hours = now.getHours() % 12 + minutes / 60;

  const secAngle = (seconds / 60) * 360;
  const minAngle = (minutes / 60) * 360;
  const hourAngle = (hours / 12) * 360;

  return (
    <div role="figure" aria-label="Analog Clock" className="w-40 h-40 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
        <g transform="translate(50,50)">
          <line x1="0" y1="0" x2="0" y2="-34" stroke="#111827" strokeWidth="2.5" transform={`rotate(${hourAngle})`} strokeLinecap="round" />
          <line x1="0" y1="0" x2="0" y2="-42" stroke="#111827" strokeWidth="1.8" transform={`rotate(${minAngle})`} strokeLinecap="round" />
          <line x1="0" y1="10" x2="0" y2="-44" stroke="#ef4444" strokeWidth="0.9" transform={`rotate(${secAngle})`} strokeLinecap="round" />
          <circle cx="0" cy="0" r="2.5" fill="#111827" />
        </g>
      </svg>
    </div>
  );
}

export default function Dashboard() {
  // Mock summary data — safe and fast to render locally
  const [summary] = useState({ liveClass: 'لا يوجد', attendance: '92%', assessments: 48, upcoming: 3 });

  const weeklySeries = useMemo(() => ({
    options: {
      chart: { id: 'weekly', toolbar: { show: false } },
      xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      stroke: { curve: 'smooth' as const },
    } as any,
    series: [
      { name: 'الحضور', data: [90, 92, 89, 94, 91] },
      { name: 'التقييمات (متوسط)', data: [80, 82, 85, 88, 87] },
    ],
  }), []);

  const leaderboard = [
    { id: 1, name: 'Sara', score: 95 },
    { id: 2, name: 'Omar', score: 90 },
    { id: 3, name: 'Layla', score: 88 },
  ];

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Typography variant="h4" className="font-bold">لوحة القيادة</Typography>
          <Typography variant="small" className="text-gray-600">نظرة عامة سريعة على الحصص، الحضور، والتقييمات</Typography>
        </div>
        <AnalogClock />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <DashboardCard title="حصّة مباشرة" value={summary.liveClass} />
        <DashboardCard title="متوسط الحضور" value={summary.attendance} />
        <DashboardCard title="إجمالي التقييمات" value={summary.assessments} />
        <DashboardCard title="أحداث قادمة" value={summary.upcoming}>
          <Button size="sm" color="blue" variant="text">عرض</Button>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardBody>
            <Typography variant="h6" className="mb-4">اتجاهات الأسبوع</Typography>
            <div dir="ltr">
              <Chart options={weeklySeries.options} series={weeklySeries.series} type="line" height={320} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Typography variant="h6" className="mb-4">أفضل الطلاب هذا الأسبوع</Typography>
            <ul className="space-y-3">
              {leaderboard.map((s) => (
                <li key={s.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">{s.name[0]}</div>
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-gray-500">نقاط: {s.score}</div>
                    </div>
                  </div>
                  <Button size="sm" color="blue" variant="outlined">عرض</Button>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}