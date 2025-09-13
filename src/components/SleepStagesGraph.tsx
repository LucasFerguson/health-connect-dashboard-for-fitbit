// src/components/SleepStagesGraph.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { SleepData } from "~/utils/apiClient";
import { useGlobal } from "~/app/GlobalContext";
import { format, parseISO } from "date-fns";

interface SleepStagesGraphProps {
	dataPromise: Promise<SleepData>;
}

export function SleepStagesGraph({ dataPromise }: SleepStagesGraphProps) {
	const { global } = useGlobal(); // get selectedDate from context
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

	const chartOptions = useMemo(() => {
		if (!data) return null;

		console.log("Selected date in SleepStagesGraph:", global.selectedDate, data);

		// Find sleep data matching the selected date
		const sleepForDate = data.find(
			(record) => format(parseISO(record.start), "yyyy-MM-dd") == global.selectedDate
		);

		if (!sleepForDate) return null;

		const stages = sleepForDate.data.stages;

		console.log("Graphing stages:", stages);

		// const stageSeries = stages.map((s) => [new Date(s.startTime).getTime(), s.stage]);


		// Stage names
		const stageMap: Record<number, string> = {
			0: "Unknown",
			1: "Awake",
			2: "Unknown",
			3: "Unknown",
			4: "Light",
			5: "Deep",
			6: "REM",
		};

		// Stage colors
		const stageColors: Record<number, string> = {
			0: "#888888", // Unknown - gray
			1: "#ff4d4f", // Awake - red
			2: "#bbbbbb", // Unknown - light gray
			3: "#bbbbbb", // Unknown - light gray
			4: "#ffd666", // Light - yellow
			5: "#73d13d", // Deep - green
			6: "#40a9ff", // REM - blue
		};

		// Map stages to visual order for y-axis: Awake (top), REM, Light, Deep, Unknown at bottom
		const stageVisualOrder: Record<number, number> = {
			1: 0, // Awake
			6: 1, // REM
			4: 2, // Light
			5: 3, // Deep
			0: 4, // Unknown
			2: 4,
			3: 4,
		};

		// Convert stages for chart: [timestamp, visualOrder, originalStage]
		const stageSeries = stages.map((s) => [
			new Date(s.startTime).getTime(),
			stageVisualOrder[s.stage] ?? 4,
			s.stage,
		]);

		return {
			backgroundColor: "#ffffff",
			textStyle: { color: "#000000" },
			tooltip: {
				trigger: "axis",
				formatter: (params: any) => {
					const p = params[0];
					const originalStage = p.value[2];
					return `${new Date(p.value[0]).toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
					})}: ${stageMap[originalStage] ?? originalStage}`;
				},
			},
			xAxis: {
				type: "time",
				name: "Time",
				axisLabel: {
					formatter: (value: number) =>
						new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
					color: "#000000",
				},
				splitLine: { lineStyle: { color: "#ddd" } },
			},
			yAxis: {
				type: "value",
				name: "Stage",
				inverse: true,
				min: 0,
				max: 4,
				axisLabel: {
					formatter: (val: number) => {
						// Reverse map visual order to stage name
						const stage = Object.keys(stageVisualOrder).find(
							(k) => stageVisualOrder[parseInt(k)] === val
						);
						return stageMap[parseInt(stage!)] ?? "";
					},
					color: "#000000",
				},
				splitLine: { lineStyle: { color: "#ddd" } },
			},
			series: [
				{
					name: "Sleep Stage",
					type: "line",
					step: "end",
					data: stageSeries.map(([time, visual]) => [time, visual]),
					smooth: false,
					lineStyle: {
						width: 2,
						color: "#6e3bff", // fallback line color
					},
					itemStyle: {
						color: (params: any) => {
							const originalStage = stageSeries[params.dataIndex][2] as number;
							return stageColors[originalStage] ?? "#000000";
						},
					},
					symbol: "circle",
					symbolSize: 6,
				},
			],
		};
	}, [data, global.selectedDate]);

	if (loading) {
		return (
			<div className="p-4 bg-white/10 rounded-lg text-white">
				<p>Loading sleep data...</p>
			</div>
		);
	}

	if (error || !chartOptions) {
		return (
			<div className="p-4 bg-white/10 rounded-lg text-red-400">
				<p>{error ?? "No sleep data available for the date: " + global.selectedDate} </p>
			</div>
		);
	}

	return (
		<div className="p-4 bg-white/10 rounded-lg shadow-md border text-white">
			<p className="text-lg font-semibold mb-2">Sleep Stages</p>
			<ReactECharts
				option={chartOptions}
				style={{ height: "400px", width: "100%" }}
			/>
		</div>
	);
}
