import { useEffect, useMemo, useState } from 'react';
import AnalogClock from '../components/AnalogClock';
import {
  Typography,
  Card,
  CardBody,
  Button,
  Progress,
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
} from "@material-tailwind/react";
import Chart from 'react-apexcharts';
import dayjs from 'dayjs';

// Utility: convert Gregorian date to Islamic (Hijri) date using algorithm
function gregorianToHijri(gDate: Date) {
  const g_y = gDate.getFullYear();
  const g_m = gDate.getMonth() + 1;
  const g_d = gDate.getDate();

  const jd = Math.floor((1461 * (g_y + 4800 + Math.floor((g_m - 14) / 12))) / 4)
    + Math.floor((367 * (g_m - 2 - 12 * Math.floor((g_m - 14) / 12))) / 12)
    - Math.floor((3 * Math.floor((g_y + 4900 + Math.floor((g_m - 14) / 12)) / 100)) / 4)
    + g_d - 32075;

  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) + (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
  l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - Math.floor(j / 16) + 29;
  const m = Math.floor((24 * l) / 709);
  const d = l - Math.floor((709 * m) / 24);
  const y = 30 * n + j - 30;

  return { day: d, month: m - 1, year: y };
}

function formatHijri(date: Date) {
  try {
    const h = gregorianToHijri(date);
    const months = ['محرم','صفر','ربيع الأول','ربيع الآخر','جمادى الأولى','جمادى الآخرة','رجب','شعبان','رمضان','شوال','ذو القعدة','ذو الحجة'];
    return `${h.day} ${months[h.month]} ${h.year} هـ`;
  } catch {
    return '';
  }
}

function HeaderTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const greg = dayjs(now).format('D MMMM YYYY, HH:mm:ss');
  const hij = formatHijri(now);

  return (
    <div className="flex flex-col items-start">
      <Typography variant="h4" className="text-blue-700 font-bold mb-1">{greg}</Typography>
      <Typography variant="h4" className="text-green-700 font-bold">{hij}</Typography>
    </div>
  );
}

function LiveClassAlert({ live }: { live: { active: boolean; section?: string; subject?: string } }) {
  if (!live.active) {
    return (
      <Card className="bg-white shadow-md">
        <CardBody>
          <Typography variant="h6">لا توجد حصة مباشرة الآن</Typography>
          <Typography className="text-sm text-gray-500">آخر حصة: غير متاحة</Typography>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-500 to-teal-400 text-white shadow-md">
      <CardBody>
        <div className="flex items-center justify-between">
          <div>
            <Typography variant="h6" className="font-semibold">🔔 أنت الآن في حصة</Typography>
            <Typography className="mt-2">القسم: <strong>{live.section}</strong> — المادة: <strong>{live.subject}</strong></Typography>
          </div>
          <div className="flex items-center gap-3">
            <Button color="white" variant="filled" size="sm" className="bg-white text-blue-700">الانتقال لصفحة الحصة وتسجيل الحضور</Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function SmallCard({ title, value, action }: { title: string; value: string | number; action?: { label: string; onClick?: () => void } }) {
  return (
    <Card className="p-4">
      <CardBody>
        <div className="flex items-center justify-between">
          <div>
            <Typography variant="small" className="text-gray-600">{title}</Typography>
            <Typography variant="h5" className="font-semibold mt-2">{value}</Typography>
          </div>
          {action && (
            <Button size="sm" variant="text" onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export default function Dashboard() {
  // Quick-win: greeting and theme toggle
  const [userName, setUserName] = useState(() => {
    try { return localStorage.getItem('cmsUserName') || 'نبيل'; } catch { return 'نبيل'; }
  });

  const [theme, setTheme] = useState<'light'|'dark'>(() => {
    try { return (localStorage.getItem('cmsTheme') as 'light'|'dark') || 'light'; } catch { return 'light'; }
  });

  useEffect(() => {
    try { localStorage.setItem('cmsTheme', theme); } catch {}
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);
  // Mock state — replace with real data fetching later
  const [live] = useState({ active: true, section: 'TCSF-1', subject: 'Mathematics' });
  const [daily] = useState({ assessmentsToday: 3, attendancePercent: 92 });
  const [curriculumProgress] = useState(65);

  const weeklySeries = useMemo(() => ({
    options: {
      chart: { id: 'weekly', toolbar: { show: false } },
      xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      stroke: { curve: 'smooth' as const },
      colors: ['#10b981', '#3b82f6'],
      legend: { position: 'top' },
    } as any,
    series: [
      { name: 'متوسط الحضور', data: [90, 92, 89, 94, 91] },
      { name: 'متوسط التقييمات', data: [80, 82, 85, 88, 87] },
    ],
  }), []);

  const [leaderTimeframe, setLeaderTimeframe] = useState<'today'|'week'|'month'>('week');
  const leaderboardData = useMemo(() => {
    const base = [
      { id:1, name: 'Sara', score: 95 },
      { id:2, name: 'Omar', score: 90 },
      { id:3, name: 'Layla', score: 88 },
      { id:4, name: 'Hassan', score: 84 },
      { id:5, name: 'Mona', score: 82 },
    ];
    // mock filter by timeframe (no-op here)
    return base;
  }, [leaderTimeframe]);

  const followUps = [
    { id:1, name:'Fatima', reason: 'غياب مفرط' },
    { id:2, name:'Ali', reason: 'تراجع أداء' },
  ];

  const notes = [ 'مراجعة خطط 2BAC الأسبوع القادم', 'تحضير أنشطة لليوم التالي', 'إرسال تنبيهات أولياء الأمور' ];

  const holidayConflicts = [ { section: 'TCSF-1', clash: 'امتحان وطني' } ];

  // Countdown example
  const countdownTarget = useMemo(() => new Date(Date.now() + 1000*60*60*24*10), []); // 10 days from now
  const [countdown, setCountdown] = useState('');
  useEffect(() => {
    const id = setInterval(() => {
      const diff = countdownTarget.getTime() - Date.now();
      if (diff <= 0) { setCountdown('انتهى'); return; }
      const days = Math.floor(diff / (1000*60*60*24));
      const hours = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
      setCountdown(`${days} يوم ${hours} ساعة`);
    }, 1000);
    return () => clearInterval(id);
  }, [countdownTarget]);

  return (
  <div className="p-6 pr-4" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 flex items-center gap-6">
          <div className="flex items-center">
            <div className="ml-4">
              <AnalogClock size={120} />
            </div>
            <div>
              <Typography variant="h4" className="font-bold">مركز القيادة الشخصي</Typography>
              <Typography className="text-gray-600">نظرة شاملة وسريعة لأنشطتك التعليمية</Typography>
              <div className="text-sm text-gray-700 mt-2">مرحباً، <strong>{userName}</strong></div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2"><HeaderTime /></div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outlined" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? 'وضع نهاري' : 'وضع داكن'}</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="col-span-2">
          <LiveClassAlert live={live} />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <SmallCard title="تقييمات اليوم 🎯" value={daily.assessmentsToday} action={{ label: 'إضافة تقييم' }} />
            <SmallCard title="نسبة الحضور اليوم" value={`${daily.attendancePercent}%`} action={{ label: 'تفاصيل الحضور' }} />
            <SmallCard title="مهام معلقة" value={2} action={{ label: 'عرض المهام' }} />
            <SmallCard title="أحداث قادمة" value={3} action={{ label: 'عرض الأحداث' }} />
          </div>

          <div className="mt-6 bg-white p-4 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <Typography variant="h6">اتجاهات الأداء الأسبوعية</Typography>
            </div>
            <div dir="ltr">
              <Chart options={weeklySeries.options} series={weeklySeries.series} type="line" height={280} />
            </div>
          </div>
        </div>

        <div className="col-span-1">
          <Card className="p-4 mb-4">
            <CardBody>
              <Typography variant="h6">أين وصلت في الدروس؟</Typography>
              <div className="mt-4">
                <Progress value={curriculumProgress} className="h-4 rounded-full" />
                <div className="flex items-center justify-between mt-2">
                  <Typography className="text-sm">{curriculumProgress}% من المنهاج</Typography>
                  <Button size="sm" variant="text">مراجعة خطة الدروس</Button>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="p-4 mb-4">
            <CardBody>
              <div className="flex items-center justify-between mb-2">
                <Typography variant="h6">أفضل التلاميذ أداءً</Typography>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outlined" onClick={() => {
                    // export leaderboard as CSV
                    const rows = leaderboardData.map(l => `${l.id},"${l.name}",${l.score}`);
                    const csv = ['id,name,score', ...rows].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'leaderboard.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}>Export CSV</Button>
                </div>
              </div>
              <Tabs value={leaderTimeframe} className="mt-2">
                <TabsHeader>
                  <Tab value="today" onClick={() => setLeaderTimeframe('today')}>اليوم</Tab>
                  <Tab value="week" onClick={() => setLeaderTimeframe('week')}>هذا الأسبوع</Tab>
                  <Tab value="month" onClick={() => setLeaderTimeframe('month')}>هذا الشهر</Tab>
                </TabsHeader>
                <TabsBody>
                  <TabPanel value="today">
                    {leaderboardData.slice(0,3).map(s => (
                      <div key={s.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">{s.name[0]}</div>
                          <div>
                            <div className="font-medium">{s.name}</div>
                            <div className="text-xs text-gray-500">نقاط: {s.score}</div>
                          </div>
                        </div>
                        <div>🥇</div>
                      </div>
                    ))}
                  </TabPanel>
                  <TabPanel value="week">
                    {leaderboardData.slice(0,5).map((s,i) => (
                      <div key={s.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">{s.name[0]}</div>
                          <div>
                            <div className="font-medium">{s.name}</div>
                            <div className="text-xs text-gray-500">نقاط: {s.score}</div>
                          </div>
                        </div>
                        <div>{i===0?'🥇': i===1?'🥈':'🥉'}</div>
                      </div>
                    ))}
                  </TabPanel>
                  <TabPanel value="month">
                    {leaderboardData.slice(0,5).map(s => (
                      <div key={s.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">{s.name[0]}</div>
                          <div>
                            <div className="font-medium">{s.name}</div>
                            <div className="text-xs text-gray-500">نقاط: {s.score}</div>
                          </div>
                        </div>
                        <div>—</div>
                      </div>
                    ))}
                  </TabPanel>
                </TabsBody>
              </Tabs>
            </CardBody>
          </Card>

          <Card className="p-4 mb-4">
            <CardBody>
              <Typography variant="h6">تنبيهات المتابعة</Typography>
              <ul className="mt-3 space-y-2">
                {followUps.map(f => (
                  <li key={f.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{f.name}</div>
                      <div className="text-xs text-gray-500">{f.reason}</div>
                    </div>
                    <Button size="sm" variant="outlined">متابعة</Button>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card className="p-4 mb-4">
            <CardBody>
              <Typography variant="h6">ملاحظات سريعة</Typography>
              <ul className="mt-3 list-disc list-inside text-sm text-gray-700">
                {notes.slice(0,3).map((n,i) => <li key={i}>{n}</li>)}
              </ul>
            </CardBody>
          </Card>

          <Card className="p-4 mb-4 bg-yellow-50">
            <CardBody>
              <Typography variant="h6" className="text-red-600">تعارض العطل مع الحصص</Typography>
              {holidayConflicts.map((h,i) => (
                <div key={i} className="mt-2">
                  <div className="font-medium">{h.section}</div>
                  <div className="text-sm text-gray-600">{h.clash}</div>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card className="p-4">
            <CardBody>
              <Typography variant="h6">العد التنازلي للأحداث</Typography>
              <div className="mt-3 text-lg font-semibold">{countdown}</div>
            </CardBody>
          </Card>

        </div>
      </div>
    </div>
  );
}