'use client';

import { Card } from '@/components/ui/card';
import { useMemo } from 'react';

interface HealthCheck {
  id: string;
  bookmark_id: string;
  status_code: number | null;
  response_time: number | null;
  is_healthy: boolean;
  error_message: string | null;
  checked_at: string;
}

interface HealthChartProps {
  data: HealthCheck[];
  type: 'response-time' | 'uptime';
}

export default function HealthChart({ data, type }: HealthChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Sort data by checked_at
    const sortedData = [...data].sort((a, b) => 
      new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime()
    );

    if (type === 'response-time') {
      return sortedData
        .filter(check => check.response_time !== null)
        .map(check => ({
          time: new Date(check.checked_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          value: check.response_time!,
          isHealthy: check.is_healthy
        }));
    } else {
      // Calculate uptime percentage over time windows
      const windows = [];
      const windowSize = Math.max(1, Math.floor(sortedData.length / 24)); // 24 data points max
      
      for (let i = 0; i < sortedData.length; i += windowSize) {
        const window = sortedData.slice(i, i + windowSize);
        const healthyCount = window.filter(check => check.is_healthy).length;
        const uptime = (healthyCount / window.length) * 100;
        
        windows.push({
          time: new Date(window[window.length - 1].checked_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          }),
          value: uptime,
          isHealthy: uptime > 95
        });
      }
      
      return windows;
    }
  }, [data, type]);

  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 100;
    if (type === 'uptime') return 100;
    return Math.max(...chartData.map(d => d.value)) * 1.1; // 10% padding
  }, [chartData, type]);

  const averageValue = useMemo(() => {
    if (chartData.length === 0) return 0;
    const sum = chartData.reduce((acc, d) => acc + d.value, 0);
    return sum / chartData.length;
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <Card className="p-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            {type === 'response-time' ? 'Response Time' : 'Uptime'}
          </h3>
          <div className="text-sm text-muted-foreground">
            No data available
          </div>
        </div>
        <div className="mt-6 h-48 flex items-center justify-center text-muted-foreground">
          No health check data to display
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {type === 'response-time' ? 'Response Time' : 'Uptime'}
          </h3>
          <div className="text-sm text-muted-foreground">
            Avg: {type === 'response-time' 
              ? `${Math.round(averageValue)}ms` 
              : `${averageValue.toFixed(1)}%`
            }
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {type === 'response-time' 
            ? 'Average response time over recent checks'
            : 'Uptime percentage over time'
          }
        </div>
      </div>

      <div className="mt-6 h-48 relative">
        <svg className="w-full h-full" viewBox="0 0 400 200">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-foreground/20"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Y-axis labels */}
          <text x="5" y="15" className="fill-muted-foreground text-xs">
            {type === 'response-time' ? `${Math.round(maxValue)}ms` : '100%'}
          </text>
          <text x="5" y="105" className="fill-muted-foreground text-xs">
            {type === 'response-time' ? `${Math.round(maxValue / 2)}ms` : '50%'}
          </text>
          <text x="5" y="195" className="fill-muted-foreground text-xs">
            {type === 'response-time' ? '0ms' : '0%'}
          </text>

          {/* Chart line */}
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`${
              type === 'response-time' 
                ? 'text-blue-500' 
                : 'text-green-500'
            }`}
            points={chartData
              .map((point, index) => {
                const x = 40 + (index * (360 / (chartData.length - 1)));
                const y = 180 - ((point.value / maxValue) * 160);
                return `${x},${y}`;
              })
              .join(' ')
            }
          />

          {/* Data points */}
          {chartData.map((point, index) => {
            const x = 40 + (index * (360 / (chartData.length - 1)));
            const y = 180 - ((point.value / maxValue) * 160);
            
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="3"
                  className={`${
                    point.isHealthy 
                      ? type === 'response-time'
                        ? 'fill-blue-500'
                        : 'fill-green-500'
                      : 'fill-red-500'
                  }`}
                />
                {/* Tooltip area */}
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  className="fill-transparent cursor-pointer"
                >
                  <title>{`${point.time}: ${
                    type === 'response-time'
                      ? `${Math.round(point.value)}ms`
                      : `${point.value.toFixed(1)}%`
                  }`}</title>
                </circle>
              </g>
            );
          })}

          {/* X-axis labels */}
          {chartData.length > 1 && (
            <>
              <text x="45" y="195" className="fill-muted-foreground text-xs">
                {chartData[0].time}
              </text>
              <text x="360" y="195" className="fill-muted-foreground text-xs text-end">
                {chartData[chartData.length - 1].time}
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center space-x-6 text-xs text-muted-foreground">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            type === 'response-time' ? 'bg-blue-500' : 'bg-green-500'
          }`} />
          <span>Healthy</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Unhealthy</span>
        </div>
      </div>
    </Card>
  );
}