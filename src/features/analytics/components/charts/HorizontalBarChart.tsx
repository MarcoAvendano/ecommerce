"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { useTheme } from "@mui/material/styles";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface HorizontalBarChartProps {
  categories: string[];
  series: Array<{
    name: string;
    data: number[];
  }>;
  height?: number;
  valueFormatter?: (value: number) => string;
}

export function HorizontalBarChart({
  categories,
  series,
  height = 340,
  valueFormatter,
}: HorizontalBarChartProps) {
  const theme = useTheme();

  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: {
        show: false,
      },
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: theme.palette.text.secondary,
    },
    colors: [theme.palette.secondary.main],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 8,
        borderRadiusApplication: "end",
        barHeight: "56%",
        distributed: false,
      },
    },
    dataLabels: {
      enabled: true,
      offsetX: 6,
      style: {
        fontSize: "11px",
        fontWeight: 600,
      },
      formatter: valueFormatter
        ? (value: number) => valueFormatter(Number(value))
        : undefined,
    },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 5,
      xaxis: {
        lines: {
          show: true,
        },
      },
    },
    xaxis: {
      categories,
      labels: {
        formatter: valueFormatter
          ? (value: string | number) => valueFormatter(Number(value))
          : undefined,
        style: {
          fontSize: "11px",
        },
      },
    },
    yaxis: {
      labels: {
        maxWidth: 260,
        style: {
          fontSize: "12px",
          fontWeight: 500,
        },
      },
    },
    tooltip: {
      theme: theme.palette.mode === "dark" ? "dark" : "light",
      x: {
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

  return <Chart options={options} series={series} type="bar" height={height} width="100%" />;
}