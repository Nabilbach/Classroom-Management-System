import React from 'react';
import Chart from 'react-apexcharts';
import { SectionPerformanceData } from '../utils/dashboardUtils';

interface SectionPerformanceChartProps {
  performanceData: SectionPerformanceData[];
  averageCompletion: number;
}

function SectionPerformanceChart({ performanceData, averageCompletion }: SectionPerformanceChartProps) {
  const categories = performanceData.map(s => s.sectionName);
  const seriesData = performanceData.map(s => s.overallProgress);

  // Prepare colors for each bar based on sectionColor
  const barColors = performanceData.map(s => s.sectionColor);

  const options = {
    chart: {
      height: 350,
      type: 'bar',
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        endingShape: 'rounded'
      },
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: [0, 2], // 0 for bars, 2 for line
      colors: ['transparent', '#000000'] // Transparent for bars, black for line
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: '#616161',
          fontSize: '12px',
          fontFamily: 'inherit',
          fontWeight: 400,
        },
      },
    },
    yaxis: {
      title: {
        text: 'نسبة الإنجاز (%)'
      },
      labels: {
        style: {
          colors: '#616161',
          fontSize: '12px',
          fontFamily: 'inherit',
          fontWeight: 400,
        },
      },
      min: 0,
      max: 100,
    },
    fill: {
      opacity: [0.85, 1],
      colors: barColors // Apply section colors to bars
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val + " %"
        }
      }
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      fontFamily: 'inherit',
      markers: {
        radius: 99,
      },
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          plotOptions: {
            bar: {
              columnWidth: '75%',
            },
          },
          xaxis: {
            labels: {
              rotate: -45,
            },
          },
        },
      },
    ],
  };

  const series = [
    {
      name: 'نسبة الإنجاز',
      type: 'bar',
      data: seriesData,
    },
    {
      name: 'متوسط الفصل',
      type: 'line',
      data: categories.map(() => averageCompletion), // Line representing average
    },
  ];

  return (
    <div dir="ltr"> {/* ApexCharts renders LTR, so wrap it */}
      <Chart options={options} series={series} type="bar" height={350} />
    </div>
  );
}

export default SectionPerformanceChart;
