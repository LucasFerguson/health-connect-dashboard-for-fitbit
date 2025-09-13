// src/components/SleepStagesGraph.tsx

"use client";

import React, { useEffect, useState, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { SleepData } from "~/utils/apiClient";

interface SleepStagesGraphProps {
	dataPromise: Promise<SleepData>;
}

export function SleepStagesGraph({ dataPromise }: SleepStagesGraphProps) {
	const [data, setData] = useState<SleepData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let isMounted = true;

		async function loadSleepData() {
			try {
				const sleep = await dataPromise;
				if (isMounted) setData(sleep);
			} catch (err) {
				if (isMounted) {
					setError("Failed to load sleep data");
					console.error(err);
				}
			} finally {
				if (isMounted) setLoading(false);
			}
		}

		loadSleepData();

		return () => {
			isMounted = false;
		};
	}, [dataPromise]);

	// Always call hooks at the top level
	const chartOptions = useMemo(() => {
		if (!data) return null;

		const sleep = data[0]; // take first record for now
		const stages = sleep.data.stages;

		// Convert to series data: [timestamp, stage]
		const stageSeries = stages.map((s) => [
			new Date(s.startTime).getTime(),
			s.stage,
		]);

		return {
			tooltip: { trigger: "axis" },
			xAxis: {
				type: "time",
				name: "Time",
			},
			yAxis: {
				type: "value",
				name: "Stage",
				inverse: true, // wake at top
				min: 0,
				max: 4,
				axisLabel: {
					formatter: (val: number) => {
						switch (val) {
							case 0: return "Wake";
							case 1: return "N1";
							case 2: return "N2";
							case 3: return "N3";
							case 4: return "REM";
							default: return "";
						}
					},
				},
			},
			series: [
				{
					name: "Sleep Stage",
					type: "line",
					step: "end",
					data: stageSeries,
					smooth: false,
					lineStyle: { width: 2 },
					symbol: "circle",
					symbolSize: 6,
				},
			],
		};
	}, [data]);

	if (loading) {
		return (
			<div className="p-4 bg-white/10 rounded-lg text-white">
				<p>Loading sleep data...</p>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="p-4 bg-white/10 rounded-lg text-red-400">
				<p>{error ?? "No sleep data available."}</p>
			</div>
		);
	}

	return (
		<div className="p-4 bg-white/10 rounded-lg shadow-md border text-white">
			<p className="text-lg font-semibold mb-2">Sleep Stages</p>
			{chartOptions ? (
				<ReactECharts
					option={chartOptions}
					style={{ height: "400px", width: "100%" }}
				/>
			) : (
				<p>No data for chart.</p>
			)}
		</div>
	);
}
