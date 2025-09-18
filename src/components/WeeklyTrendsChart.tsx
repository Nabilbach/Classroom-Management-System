import React from 'react';
import Chart from 'react-apexcharts';
import { WeeklyTrendData } from '../utils/dashboardUtils';
import { Section } from '../contexts/SectionsContext';

interface WeeklyTrendsChartProps {
  weeklyTrends: WeeklyTrendData[];
  sections: Section[];
}

function WeeklyTrendsChart({ weeklyTrends, sections }: WeeklyTrendsChartProps) {
  if (!weeklyTrends || weeklyTrends.length === 0) {
    return <Typography>لا توجد بيانات اتجاهات أسبوعية لعرضها.</Typography>;
  }

  const categories = weeklyTrends.map(trend => trend.weekLabel);

  // Prepare series for ApexCharts
  const series = sections.map(section => {
    const data = weeklyTrends.map(trend => {
      const progress = trend[section.id];
      return typeof progress === 'number' ? progress : 0; // Ensure it's a number
    });
    return {
      name: section.name,
      data: data,
      color: section.color || '#8884d8', // Use section color for the line
    };
  });

  const options = {
    chart: {
      height: 350,
      type: 'line',
      toolbar: { show: false },
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    markers: {
      size: 4,
    },
    xaxis: {
      categories: categories,
      title: {
        text: 'الأسبوع'
      },
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
      min: 0,
      max: 100,
      labels: {
        style: {
          colors: '#616161',
          fontSize: '12px',
          fontFamily: 'inherit',
          fontWeight: 400,
        },
      },
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
          xaxis: {
            labels: {
              rotate: -45,
            },
          },
        },
      },
    ],
  };

  return (
    <div dir="ltr"> {/* ApexCharts renders LTR, so wrap it */}
      <Chart options={options} series={series} type="line" height={350} />
    </div>
  );
}

export default WeeklyTrendsChart;
