// components/SleepCalendar.tsx
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { sleepDataMap } from "../utils/sleepDataMap";
import { format } from "date-fns";

export const SleepCalendar = () => {
	// Custom render for each day
	const renderDay = (date: Date) => {
		const dateKey = date.toISOString().slice(0, 10);
		const data = sleepDataMap[dateKey];

		return (
			<div className="flex flex-col items-center justify-center h-full">
				<span>{date.getDate()}</span>
				{data && (
					<span className="text-xs text-green-700 font-semibold">
						{Math.round(data.duration / 60)}h
					</span>
				)}
			</div>
		);
	};

	return (
		<div className="p-4 bg-white rounded-lg shadow-md">
			<DayPicker
				showOutsideDays
				components={{
					Day: ({ date }) => (
						<div className="h-12 w-12 flex items-center justify-center">
							{renderDay(date)}
						</div>
					),
				}}
				className="border rounded-lg p-4"
			/>
		</div>
	);
};
