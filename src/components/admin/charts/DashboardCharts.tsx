'use client';

import React, { useMemo } from 'react';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';

// --- Pipeline Donut Chart ---

interface PipelineData {
    pending: number;
    waitlist: number;
    accepted: number;
    in_progress: number;
    on_delivery: number;
    completed: number;
}

export function PipelineDonut({ data }: { data: PipelineData }) {
    const chartData = useMemo(() => [
        { name: 'Pending Review', value: data.pending, color: '#525252' },
        { name: 'Waitlist', value: data.waitlist, color: '#ca8a04' },
        { name: 'In Progress', value: data.accepted + data.in_progress, color: '#2563eb' },
        { name: 'On Delivery', value: data.on_delivery, color: '#9333ea' },
        { name: 'Completed', value: data.completed, color: '#E2B859' }, // Using gold accent
    ].filter(item => item.value > 0), [data]);

    const total = Object.values(data).reduce((a, b) => a + b, 0);

    if (total === 0) {
        return (
            <div className="h-48 flex items-center justify-center text-neutral-600 text-[10px] uppercase tracking-widest font-bold">
                No Pipeline Data
            </div>
        );
    }

    return (
        <div className="relative h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#0a0a0a',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                        }}
                        itemStyle={{ color: '#fff' }}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-cinzel text-white leading-none">{total}</span>
                <span className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold mt-1">Total Orders</span>
            </div>
        </div>
    );
}

// --- Growth Trend Area Chart ---

interface RevenuePoint {
    date: string;
    amount: number;
}

export function GrowthTrend({ data }: { data: RevenuePoint[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-neutral-600 text-[10px] uppercase tracking-widest font-bold">
                Awaiting more data points...
            </div>
        );
    }

    return (
        <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#E2B859" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#E2B859" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#525252', fontSize: 9 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#525252', fontSize: 9 }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#0a0a0a',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: 'bold'
                        }}
                        formatter={(value: number | string | undefined) => [`₹${value}`, 'Revenue']}
                    />
                    <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#E2B859"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
