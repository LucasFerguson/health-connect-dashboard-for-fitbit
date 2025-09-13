// src / components / SleepStagesGraph.tsx

"use client";

import React, { useEffect, useState } from "react";
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

	console.log("Sleep Stages Data:", data);

	// export type SleepData = Array<{
	// 	_id: string;
	// 	app: string;
	// 	start: string;
	// 	end: string;
	// 	id: string;
	// 	data: {
	// 		notes: string | null;
	// 		title: string | null;
	// 		stages: Array<{
	// 			startTime: string;
	// 			endTime: string;
	// 			stage: number;
	// 		}>;
	// 	};
	// }>;

	return <div className="p-4 bg-white/10 rounded-lg shadow-md border text-white">
		<p className="text-lg font-semibold">Sleep Stages</p>
		<p className="mt-1 text-white/50">[Graph Placeholder] + some data {data.toString()}</p>
	</div>
}
