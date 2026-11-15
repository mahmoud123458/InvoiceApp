'use client';

import { useMemo } from 'react';
import { Invoice } from '@/types';
import { formatCurrency } from '@/lib/format';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';

interface InvoiceActivityChartProps {
  invoices: Invoice[];
  loading: boolean;
}

interface ChartPoint {
  date: Date;
  amount: number;
}

const chartWidth = 840;
const chartHeight = 260;
const chartTop = 18;
const chartBottom = 210;
const chartLeft = 58;
const chartRight = 824;

function formatAmount(amount: number): string {
  return formatCurrency(amount);
}

function createLinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;

    const previous = points[index - 1];
    const beforePrevious = points[index - 2] || previous;
    const next = points[index + 1] || point;
    const controlOneX = previous.x + (point.x - beforePrevious.x) / 6;
    const controlOneY = previous.y + (point.y - beforePrevious.y) / 6;
    const controlTwoX = point.x - (next.x - previous.x) / 6;
    const controlTwoY = point.y - (next.y - previous.y) / 6;

    return `${path} C ${controlOneX} ${controlOneY}, ${controlTwoX} ${controlTwoY}, ${point.x} ${point.y}`;
  }, '');
}

export default function InvoiceActivityChart({ invoices, loading }: InvoiceActivityChartProps) {
  const points = useMemo<ChartPoint[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (29 - index));
      return { date, amount: 0 };
    });
    const amountsByDay = new Map(days.map((day) => [day.date.toDateString(), day]));

    invoices.forEach((invoice) => {
      if (invoice.status === 'draft' || invoice.status === 'cancelled') return;

      const createdAt = new Date(invoice.createdAt);
      createdAt.setHours(0, 0, 0, 0);
      const day = amountsByDay.get(createdAt.toDateString());
      if (day) day.amount += invoice.total;
    });

    return days;
  }, [invoices]);

  const chartData = useMemo(() => {
    const maximumAmount = Math.max(...points.map((point) => point.amount), 0);
    const axisMaximum = maximumAmount > 0 ? maximumAmount * 1.15 : 1;
    const coordinates = points.map((point, index) => ({
      x: chartLeft + (index / (points.length - 1)) * (chartRight - chartLeft),
      y: chartBottom - (point.amount / axisMaximum) * (chartBottom - chartTop),
    }));
    const linePath = createLinePath(coordinates);
    const lastPoint = coordinates[coordinates.length - 1];
    const firstPoint = coordinates[0];
    const areaPath = `${linePath} L ${lastPoint.x} ${chartBottom} L ${firstPoint.x} ${chartBottom} Z`;

    return { axisMaximum, coordinates, linePath, areaPath, total: points.reduce((sum, point) => sum + point.amount, 0) };
  }, [points]);

  const monthChangeIndex = points.findIndex((point, index) =>
    index > 0 && point.date.getMonth() !== points[index - 1].date.getMonth()
  );
  const xTickIndexes = new Set([0, 7, 14, 21, 29]);
  if (monthChangeIndex > 0) {
    const nearestRegularTick = [...xTickIndexes]
      .filter((index) => index !== 0 && index !== 29)
      .sort((a, b) => Math.abs(a - monthChangeIndex) - Math.abs(b - monthChangeIndex))[0];
    if (nearestRegularTick !== undefined) xTickIndexes.delete(nearestRegularTick);
    xTickIndexes.add(monthChangeIndex);
  }
  const hasInvoices = chartData.total > 0;

  return (
    <Card className="mt-6 gap-0 overflow-hidden rounded-xl py-0">
      <CardHeader className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-5">
        <div>
          <CardTitle className="text-sm">Invoiced amount</CardTitle>
          <CardDescription className="mt-1 text-xs">Sent and paid invoices over the last 30 days</CardDescription>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold tracking-tight text-gray-900">
            {loading ? '—' : formatAmount(chartData.total)}
          </p>
          <p className="mt-1 text-xs text-gray-500">Last 30 days</p>
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto px-4 pb-4 pt-5 sm:px-6">
        {loading ? (
          <div className="h-[260px] min-w-[640px] animate-pulse rounded-xl bg-gray-50" />
        ) : (
          <svg
            aria-label="Daily invoiced amount for the last 30 days"
            className="h-auto w-full min-w-[640px]"
            role="img"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          >
            <defs>
              <linearGradient id="invoice-chart-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#4775f5" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#4775f5" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
              const y = chartBottom - fraction * (chartBottom - chartTop);
              const value = chartData.axisMaximum * fraction;

              return (
                <g key={fraction}>
                  <line x1={chartLeft} x2={chartRight} y1={y} y2={y} stroke="var(--border)" strokeDasharray="3 5" />
                  <text x={chartLeft - 12} y={y + 4} textAnchor="end" fill="var(--foreground)" fontSize="10">
                    {formatAmount(value)}
                  </text>
                </g>
              );
            })}

            <path d={chartData.areaPath} fill="url(#invoice-chart-fill)" />
            <path d={chartData.linePath} fill="none" stroke="#4775f5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />

            {chartData.coordinates.map((coordinate, index) => (
              <circle key={points[index].date.toISOString()} cx={coordinate.x} cy={coordinate.y} r="2.5" fill="var(--surface)" stroke="#4775f5" strokeWidth="1.5">
                <title>
                  {points[index].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: {formatAmount(points[index].amount)}
                </title>
              </circle>
            ))}

            {[...xTickIndexes].sort((a, b) => a - b).map((index) => (
              <text
                key={index}
                x={chartData.coordinates[index].x}
                y={chartHeight - 14}
                textAnchor="middle"
                fill="var(--foreground)"
                fontSize="10"
              >
                {index === 0 || index === 29 || index === monthChangeIndex
                  ? points[index].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : points[index].date.getDate()}
              </text>
            ))}

            {!hasInvoices && (
              <text x={(chartLeft + chartRight) / 2} y={(chartTop + chartBottom) / 2} textAnchor="middle" fill="var(--foreground)" fontSize="12">
                No sent or paid invoices in this period
              </text>
            )}
          </svg>
        )}
      </CardContent>
    </Card>
  );
}
