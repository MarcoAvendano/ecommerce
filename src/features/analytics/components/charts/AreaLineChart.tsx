"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { useTheme } from "@mui/material/styles";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface AreaLineChartProps {
  categories: string[];
  series: Array<{
    name: string;
    data: number[];
  }>;
  height?: number;
  valueFormatter?: (value: number) => string;
}

export function AreaLineChart({
  categories,
  series,
  height = 320,
  valueFormatter,
}: AreaLineChartProps) {
  const theme = useTheme();

  const options: ApexOptions = {
    chart: {
      type: "area",
      toolbar: {
        show: false,
      },
      sparkline: {
        enabled: false,
      },
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: theme.palette.text.secondary,
      zoom: {
        enabled: false,
      },
    },
    stroke: {
      curve: "smooth",
      width: 4,
      lineCap: "round",
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 0.2,
        opacityFrom: 0.55,
        opacityTo: 0.06,
        stops: [0, 100],
      },
    },
    colors: [theme.palette.primary.main],
    markers: {
      size: 0,
      strokeWidth: 0,
      hover: {
        size: 5,
      },
    },
    dataLabels: {
      enabled: false,
    },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 5,
      padding: {
        left: 8,
        right: 8,
      },
    },
    xaxis: {
      categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        rotate: 0,
        style: {
          fontSize: "11px",
        },
      },
    },
    yaxis: {
      labels: {
        formatter: valueFormatter
          ? (value: string | number) => valueFormatter(Number(value))
          : undefined,
        style: {
          fontSize: "11px",
        },
      },
    },
    tooltip: {
      theme: theme.palette.mode === "dark" ? "dark" : "light",
      marker: {
        show: false,
      },
      y: {
        formatter: valueFormatter
          ? (value: number) => valueFormatter(Number(value))
          : undefined,
      },
    },
    legend: {
      show: false,
    },
  };

  return <Chart options={options} series={series} type="area" height={height} width="100%" />;
}