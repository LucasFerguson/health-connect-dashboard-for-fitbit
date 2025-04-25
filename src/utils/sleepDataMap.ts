import { sleepData } from "./sleepData";

export const sleepDataMap = sleepData.reduce((acc, entry) => {
	const dateKey = new Date(entry.start).toISOString().slice(0, 10); // "YYYY-MM-DD"

	// Sum up duration of all sleep stages
	const duration = entry.data?.stages?.reduce((total, stage) => {
		const start = new Date(stage.startTime).getTime();
		const end = new Date(stage.endTime).getTime();
		return total + (end - start);
	}, 0) ?? 0;

	acc[dateKey] = {
		...entry,
		duration: duration / 1000 / 60 // convert to minutes
	};

	return acc;
}, {} as Record<string, { duration: number }>);
