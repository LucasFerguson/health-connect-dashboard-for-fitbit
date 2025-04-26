// components/SleepCalendar.tsx
"use client";

import { DayPicker, type DayProps } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { type SleepData } from "~/utils/apiClient";
import { parseISO, differenceInMinutes, format } from "date-fns";
import { useState } from "react";

type SleepCalendarProps = {
	sleepSessionData: SleepData;
};

export const SleepCalendar = ({ sleepSessionData }: SleepCalendarProps) => {
	// Build a map: "YYYY-MM-DD" → { duration: minutes }
	const sleepDataMap = sleepSessionData.reduce<Record<string, { duration: number }>>(
		(map, session) => {
			const start = parseISO(session.start);
			const end = parseISO(session.end);
			const duration = differenceInMinutes(end, start);
			const key = format(start, "yyyy-MM-dd");
			map[key] = { duration };
			return map;
		},
		{}
	);

	// Selected date state
	const [selected, setSelected] = useState<Date | undefined>();

	// Toggle selection on/off
	const handleSelect = (date: Date | undefined) => {
		if (date && selected?.toDateString() === date.toDateString()) {
			setSelected(undefined);
		} else {
			setSelected(date);
		}
	};

	// Style thresholds: <3h danger, <5h warning, else success
	const styleConfig = {
		danger: { bg: "bg-red-100", text: "text-red-700", bar: "bg-red-200" },
		warning: { bg: "bg-yellow-100", text: "text-yellow-700", bar: "bg-yellow-200" },
		success: { bg: "bg-green-100", text: "text-green-700", bar: "bg-green-200" },
	} as const;

	const getStyles = (duration: number) => {
		const hours = duration / 60;
		if (hours < 3) return styleConfig.danger;
		if (hours < 5) return styleConfig.warning;
		return styleConfig.success;
	};

	// Custom Day cell: must render <td> to keep table semantics
	const CustomDay = (props: DayProps) => {
		const { day, modifiers, ...tdProps } = props;

		const key = format(day.date, "yyyy-MM-dd");
		const data = sleepDataMap[key];
		const styles = data ? getStyles(data.duration) : null;

		return (
			<td
				{...tdProps}
				className={`
		  h-16 w-16 text-black align-top relative cursor-pointer
		  ${modifiers.today ? "font-bold text-blue-600" : ""}
		  ${styles?.bg ?? ""}
		`}
				onClick={() => handleSelect(day.date)}
			>
				<div className="flex flex-col items-center justify-center h-full">
					<span className={`text-sm ${modifiers.selected ? "text-white bg-blue-800 px-2 rounded-full" : ""}`}>
						{day.date.getDate()}
					</span>
					{data && (
						<div className="absolute bottom-1 right-2 flex flex-col items-center">
							<span className={`text-[0.6rem] font-semibold ${styles.text}`}>
								{Math.round(data.duration / 60)}h
							</span>
							<div className={`w-3 h-1 ${styles.bar} rounded-full mt-0.5`} />
						</div>
					)}
				</div>
			</td>
		);
	};

	return (
		<div className="p-4 bg-white rounded-lg shadow-md border text-black">
			<DayPicker
				mode="single"
				selected={selected}
				onSelect={handleSelect}
				components={{ Day: CustomDay }}
				classNames={{
					day: "hover:bg-gray-50",
					head_cell: "text-gray-500 text-sm font-medium",
					month: "space-y-3",
					caption_label: "text-lg font-semibold",
					nav_button_previous: "text-gray-400 hover:text-gray-600",
					nav_button_next: "text-gray-400 hover:text-gray-600",
				}}
				// add footer 
				footer={
					<div className="flex justify-between items-center mt-4">
						<button
							className="text-gray-500 hover:text-gray-700"
							onClick={() => setSelected(undefined)}
						>
							Clear Selection
						</button>
						<span className="text-sm text-gray-500">
							{selected ? `Selected: ${format(selected, "yyyy-MM-dd")}` : "No date selected"}
						</span>
					</div>
				}
			/>
		</div>
	);
};
