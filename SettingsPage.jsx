import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/my_components/ui/card';
import { Button } from '@material-tailwind/react';
import { Label } from '@/my_components/ui/label';
import { Input } from '@/my_components/ui/input';
import { Switch } from '@/my_components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/my_components/ui/select';
import { Bell, Palette, Lock, Users, Info, Database, DownloadCloud, RefreshCw } from 'lucide-react';

const SettingsPage = () => {
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
    const [theme, setTheme] = React.useState('light');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [adminEmail, setAdminEmail] = React.useState('admin@example.com');
    const [studentsPerPage, setStudentsPerPage] = React.useState(10);

    const handleSaveChanges = () => {
        console.log('Settings saved:', { notificationsEnabled, theme, password, adminEmail, studentsPerPage });
        alert('تم حفظ الإعدادات بنجاح!');
    };

    return (
        <div className="space-y-6 p-6 bg-gray-50 min-h-screen" dir="rtl">
            <h1 className="text-3xl font-bold text-gray-900">الإعدادات</h1>
            <p className="text-gray-600 text-lg">تخصيص تفضيلات النظام وإدارتها</p>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
                        <Palette className="w-6 h-6 ml-2 text-blue-600" />
                        إعدادات عامة
                    </CardTitle>
                    <CardDescription>تفضيلات العرض والإشعارات.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="notifications" className="text-base">تفعيل الإشعارات</Label>
                        <Switch id="notifications" checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="theme" className="text-base">الوضع الداكن / الفاتح</Label>
                        <Select value={theme} onValueChange={setTheme}>
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="اختر الوضع" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">فاتح</SelectItem>
                                <SelectItem value="dark">داكن</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
                        <Lock className="w-6 h-6 ml-2 text-red-600" />
                        إعدادات الأمان
                    </CardTitle>
                    <CardDescription>إدارة كلمات المرور ومعلومات المسؤول.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني للمسؤول</Label>
                        <Input id="admin-email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="example@example.com" className="border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div>
                        <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور الجديدة</Label>
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" className="border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div>
                        <Label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">تأكيد كلمة المرور الجديدة</Label>
                        <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="********" className="border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                </CardContent>
            </Card>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
                        <Database className="w-6 h-6 ml-2 text-green-600" />
                        إدارة البيانات
                    </CardTitle>
                    <CardDescription>خيارات النسخ الاحتياطي واستعادة البيانات.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button className="w-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2">
                        <DownloadCloud className="w-5 h-5" />
                        إنشاء نسخة احتياطية الآن
                    </Button>
                    <Button variant="outlined" className="w-full border-gray-300 hover:bg-gray-100 text-gray-700 flex items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5" />
                        استعادة من نسخة احتياطية
                    </Button>
                </CardContent>
            </Card>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
                        <Users className="w-6 h-6 ml-2 text-purple-600" />
                        إعدادات عرض التلاميذ
                    </CardTitle>
                    <CardDescription>تحديد عدد التلاميذ المعروضين في كل صفحة.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="students-per-page" className="block text-sm font-medium text-gray-700 mb-1">عدد التلاميذ لكل صفحة</Label>
                        <Input id="students-per-page" type="number" value={studentsPerPage} onChange={(e) => setStudentsPerPage(parseInt(e.target.value))} placeholder="10" min="1" className="border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                </CardContent>
            </Card>
            <div className="flex justify-end mt-6">
                <Button onClick={handleSaveChanges} className="px-6 py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors duration-300">
                    حفظ التغييرات
                </Button>
            </div>
        </div>
    );
};

export default SettingsPage;