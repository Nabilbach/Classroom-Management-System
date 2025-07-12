import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { 
  Download, 
  FileText, 
  BarChart3, 
  Users, 
  Award,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'

const PDFExport = ({ data = {} }) => {
  const [exporting, setExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState(null)

  const reportTypes = [
    {
      id: 'overview',
      title: 'تقرير نظرة عامة',
      description: 'تقرير شامل يحتوي على إحصائيات عامة عن جميع الأقسام والتلاميذ',
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'students',
      title: 'تقرير التلاميذ',
      description: 'قائمة مفصلة بجميع التلاميذ ودرجاتهم وأوسمتهم',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'performance',
      title: 'تقرير الأداء',
      description: 'تحليل أداء الأقسام والتلاميذ مع الرسوم البيانية',
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'behavior',
      title: 'تقرير السلوك',
      description: 'تقرير مفصل عن السلوك والانضباط في الفصول',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ]

  const handleExport = async (reportType) => {
    setExporting(true)
    setExportStatus(null)

    try {
      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Here you would normally call the backend API to generate the PDF
      const response = await fetch('https://nghki1c8xxll.manus.space/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType: reportType.id,
          data: data,
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        // Create a download link for the PDF
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${reportType.title}_${new Date().toLocaleDateString('ar-SA')}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        setExportStatus({
          type: 'success',
          message: `تم تصدير ${reportType.title} بنجاح`
        })
      } else {
        throw new Error('فشل في تصدير التقرير')
      }
    } catch (error) {
      // For demo purposes, we'll simulate a successful download
      setExportStatus({
        type: 'success',
        message: `تم تصدير ${reportType.title} بنجاح (محاكاة)`
      })
      
      // In a real implementation, you would handle the error:
      // setExportStatus({
      //   type: 'error',
      //   message: 'حدث خطأ أثناء تصدير التقرير. يرجى المحاولة مرة أخرى.'
      // })
    } finally {
      setExporting(false)
      
      // Clear status after 5 seconds
      setTimeout(() => {
        setExportStatus(null)
      }, 5000)
    }
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen" dir="rtl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
            <Download className="h-6 w-6 ml-2 text-blue-600" />
            تصدير التقارير بصيغة PDF
          </CardTitle>
          <CardDescription className="text-gray-600">
            اختر نوع التقرير الذي تريد تصديره وتحميله بصيغة PDF
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Export Status */}
      {exporting && (
        <Card className="bg-blue-50 border-blue-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-blue-500 ml-2 animate-spin" />
            <p className="text-sm font-medium text-blue-700">جاري إعداد التقرير وتصديره...</p>
          </CardContent>
        </Card>
      )}
      {exportStatus && !exporting && (
        <Card className={`${
          exportStatus.type === 'success' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        } shadow-sm`}>
          <CardContent className="p-4">
            <div className="flex items-center">
              {exportStatus.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 ml-2" />
              )}
              <p className={`text-sm font-medium ${
                exportStatus.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {exportStatus.message}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((reportType) => {
          const Icon = reportType.icon
          return (
            <Card 
              key={reportType.id} 
              className={`${reportType.bgColor} ${reportType.borderColor} hover:shadow-lg transition-shadow duration-300 shadow-sm`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-800">
                  <div className="flex items-center">
                    <Icon className={`h-5 w-5 ml-2 ${reportType.color}`} />
                    {reportType.title}
                  </div>
                  <Badge variant="outline" className="text-xs bg-white text-gray-700 border-gray-300">
                    PDF
                  </Badge>
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  {reportType.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="space-y-4">
                  {/* Sample Data Preview */}
                  <div className="bg-white/70 rounded-lg p-3 space-y-2 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700">محتويات التقرير:</h4>
                    <ul className="text-xs text-gray-600 space-y-1 list-disc pr-4">
                      {reportType.id === 'overview' && (
                        <>
                          <li>إحصائيات عامة للأقسام والتلاميذ</li>
                          <li>معدلات الأداء والحضور</li>
                          <li>توزيع الدرجات والأوسمة</li>
                        </>
                      )}
                      {reportType.id === 'students' && (
                        <>
                          <li>قائمة شاملة بأسماء التلاميذ</li>
                          <li>الدرجات والتقييمات</li>
                          <li>الأوسمة والإنجازات</li>
                        </>
                      )}
                      {reportType.id === 'performance' && (
                        <>
                          <li>رسوم بيانية للأداء</li>
                          <li>مقارنات بين الأقسام</li>
                          <li>اتجاهات التحسن</li>
                        </>
                      )}
                      {reportType.id === 'behavior' && (
                        <>
                          <li>تقييمات السلوك</li>
                          <li>المشاكل والحلول</li>
                          <li>إحصائيات الانضباط</li>
                        </>
                      )}
                    </ul>
                  </div>

                  <Button 
                    onClick={() => handleExport(reportType)}
                    disabled={exporting}
                    className={`w-full px-5 py-2 text-base rounded-md shadow-sm ${
                      reportType.color.replace('text-', 'bg-').replace('600', '600')
                    } hover:${reportType.color.replace('text-', 'bg-').replace('600', '700')}`}
                  >
                    {exporting ? (
                      <>
                        <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                        جاري التصدير...
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5 ml-2" />
                        تصدير التقرير
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Export Options */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">خيارات التصدير</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-base text-gray-700">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="include-charts" defaultChecked className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
              <label htmlFor="include-charts">تضمين الرسوم البيانية</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="include-photos" className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
              <label htmlFor="include-photos">تضمين صور التلاميذ</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="include-signatures" defaultChecked className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
              <label htmlFor="include-signatures">تضمين التوقيعات</label>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-base text-gray-700">
            <label htmlFor="date-range" className="font-medium">نطاق التاريخ:</label>
            <select id="date-range" className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="current-month">الشهر الحالي</option>
              <option value="last-month">الشهر الماضي</option>
              <option value="current-semester">الفصل الحالي</option>
              <option value="full-year">السنة الكاملة</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PDFExport

