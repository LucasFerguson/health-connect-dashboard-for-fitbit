"use client";

import React, { useEffect, useState } from "react";
import { SleepCalendar } from "~/components/SleepCalendar";
import type { SleepData } from "~/utils/apiClient";

interface SleepCalendarWrapperProps {
	dataPromise: Promise<SleepData>;
}

export function SleepCalendarWrapper({ dataPromise }: SleepCalendarWrapperProps) {
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

	return <SleepCalendar sleepSessionData={data} />;
}
