// components/SleepCalendar.tsx
"use client";

import { DayPicker } from "react-day-picker";
import type { DayProps } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { sleepDataMap } from "../utils/sleepDataMap";
export const SleepCalendar = () => {
	const CustomDay = (props: DayProps) => {
		const { day, modifiers } = props;
		const dateKey = day.date.toISOString().slice(0, 10);
		const data = sleepDataMap[dateKey];

		return (
			<td
				className={`
		  h-16 w-16 text-black
		  ${modifiers?.today ? "font-bold text-blue-600" : ""}
		  ${data ? "bg-green-100" : ""}
		  relative
		`}
			>
				<div className="flex flex-col items-center justify-center h-full">
					<span className="text-sm">{day.date.getDate()}</span>
					{data && (
						<div className="absolute bottom-1 right-2 flex flex-col items-center">
							<span className="text-[0.6rem] font-semibold text-green-700">
								{Math.round(data.duration / 60)}h
							</span>
							<div className="w-3 h-1 bg-green-200 rounded-full mt-0.5" />
						</div>
					)}
				</div>
			</td>
		);
	};

	return (
		<div className="p-4 bg-white rounded-lg shadow-md border text-black ">
			<DayPicker
				mode="single"
				components={{
					Day: CustomDay
				}}
				classNames={{
					day: "hover:bg-gray-50",
					head_cell: "text-gray-500 text-sm font-medium",
					month: "space-y-3",
					caption_label: "text-lg font-semibold",
					nav_button_previous: "text-gray-400 hover:text-gray-600",
					nav_button_next: "text-gray-400 hover:text-gray-600"
				}}
			/>
		</div>
	);
};
