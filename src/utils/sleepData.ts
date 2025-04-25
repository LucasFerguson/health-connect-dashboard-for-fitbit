import sleepDataJSON from './sleep_data.json';

export const sleepData = sleepDataJSON as Array<{
	_id: string;
	app: string;
	start: string;
	end: string;
	id: string;
	data: {
		notes: string | null;
		title: string | null;
		stages: Array<{
			startTime: string;
			endTime: string;
			stage: number; // 4 for deep sleep, 5 for light sleep
		}>;
	};
}>;



// Exampe data structure
// export const sleepData = [
// 	{
// 		_id: "b773e4e3-fd8b-3c51-bbb5-794bf22ebfd2",
// 		app: "com.google.android.apps.fitness",
// 		start: "2025-04-15T06:51:00Z",
// 		end: "2025-04-15T11:48:00Z",
// 		id: "b773e4e3-fd8b-3c51-bbb5-794bf22ebfd2",
// 		data: {
// 			notes: null,
// 			title: null,
// 			stages: [
// 				{ startTime: "2025-04-15T06:51:00Z", endTime: "2025-04-15T07:19:00Z", stage: 4 },
// 				{ startTime: "2025-04-15T07:19:00Z", endTime: "2025-04-15T07:39:00Z", stage: 5 },
// 				{ startTime: "2025-04-15T07:39:00Z", endTime: "2025-04-15T08:07:00Z", stage: 4 },
// 				{ startTime: "2025-04-15T08:07:00Z", endTime: "2025-04-15T08:19:00Z", stage: 5 },
// 				{ startTime: "2025-04-15T08:19:00Z", endTime: "2025-04-15T08:48:00Z", stage: 4 },
// 				{ startTime: "2025-04-15T08:48:00Z", endTime: "2025-04-15T09:09:00Z", stage: 5 },
// 				{ startTime: "2025-04-15T09:09:00Z", endTime: "2025-04-15T09:48:00Z", stage: 4 },
// 				{ startTime: "2025-04-15T09:48:00Z", endTime: "2025-04-15T10:15:00Z", stage: 5 },
// 				{ startTime: "2025-04-15T10:15:00Z", endTime: "2025-04-15T10:57:00Z", stage: 4 },
// 				{ startTime: "2025-04-15T10:57:00Z", endTime: "2025-04-15T11:17:00Z", stage: 5 },
// 				{ startTime: "2025-04-15T11:17:00Z", endTime: "2025-04-15T11:48:00Z", stage: 4 }
// 			]
// 		}
// 	},
// 	// ...more entries
// ];

