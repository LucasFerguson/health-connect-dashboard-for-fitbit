// lib/apiClient.ts
'use server';

// const API_URL = "http://192.168.8.238:6644";
const API_URL = process.env.API_URL || "http://192.168.8.238:6644";

let expiry: string | null = null;
let refresh: string | null = null;
let token: string | null = null;

export async function login() {
	console.log("Logging in to API...");
	const response = await fetch(`${API_URL}/api/v2/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			username: process.env.API_USERNAME!,
			password: process.env.API_PASSWORD!
		}),
	});
	if (!response.ok) throw new Error("Login failed, you might need to create a .env file with API_USERNAME and API_PASSWORD");
	const data = await response.json();
	expiry = data.expiry;
	refresh = data.refresh;
	token = data.token;
	return data;
}
const VALID_METHODS = [
	'activeCaloriesBurned', 'basalBodyTemperature', 'basalMetabolicRate',
	'bloodGlucose', 'bloodPressure', 'bodyFat', 'bodyTemperature',
	'boneMass', 'cervicalMucus', 'distance', 'exerciseSession',
	'elevationGained', 'floorsClimbed', 'heartRate', 'height',
	'hydration', 'leanBodyMass', 'menstruationFlow', 'menstruationPeriod',
	'nutrition', 'ovulationTest', 'oxygenSaturation', 'power',
	'respiratoryRate', 'restingHeartRate', 'sleepSession', 'speed',
	'steps', 'stepsCadence', 'totalCaloriesBurned', 'vo2Max',
	'weight', 'wheelchairPushes'
];

export async function getData(method: string, queries = {}) {
	if (!token) throw new Error("Not authenticated. Call login() first.");
	if (!VALID_METHODS.includes(method)) {
		throw new Error(`Invalid method: ${method}. Must be one of: ${VALID_METHODS.join(', ')}`);
	}
	console.log("Fetching data for method:", method);
	const response = await fetch(`${API_URL}/api/v2/fetch/${method}`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ queries }),
	});
	console.log("Response:", response);

	if (!response.ok) throw new Error(`Failed to fetch ${method}`);
	return response.json();
}

export async function fetchSleepData(): Promise<SleepData> {
	await login();
	return await getData("sleepSession");
}



export type SleepData = Array<{
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
			stage: number;
		}>;
	};
}>;