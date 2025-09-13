"use client";
import { createContext, useContext, useState } from "react";

const GlobalContext = createContext(null);

export function GlobalProvider({ children }) {
	const [global, setGlobal] = useState({
		selectedDate: "2025-09-10",
	});

	return (
		<GlobalContext.Provider value={{ global, setGlobal }}>
			{children}
		</GlobalContext.Provider>
	);
}

export function useGlobal() {
	return useContext(GlobalContext);
}
