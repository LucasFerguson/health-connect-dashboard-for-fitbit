// src/app/page.tsx
import { SleepCalendarWrapper } from "~/components/SleepCalendarWrapper";
import { SleepStagesGraph } from "~/components/SleepStagesGraph";
import { fetchSleepData } from "~/utils/apiClient";

export default async function HomePage() {
  const sleepDataPromise = fetchSleepData();

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] px-4 py-6 text-white">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Health <span className="text-[hsl(280,100%,70%)]">Dashboard</span>
        </h1>
        <p className="mt-1 text-sm text-white/70">
          Sleep, activity, and heart health at a glance
        </p>
      </header>

      <section className="container mx-auto flex flex-col gap-8">
        {/* Sleep Overview */}
        <div>
          <h2 className="text-2xl font-bold mb-3">🛌 Sleep Overview</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Calendar now on the left */}
            <div className="rounded-xl bg-white/10 p-4 min-h-[360px]">
              <p className="text-lg font-semibold mb-2">📅 Sleep Calendar</p>
              <SleepCalendarWrapper dataPromise={sleepDataPromise} />
            </div>

            {/* Sleep graphs to the right */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="rounded-xl bg-white/10 p-4 min-h-[150px]">
                <p className="text-lg font-semibold">Sleep Stages</p>
                <p className="mt-1 text-white/50">[Graph Placeholder]</p>
                <SleepStagesGraph dataPromise={sleepDataPromise} />
              </div>
              <div className="rounded-xl bg-white/10 p-4 min-h-[150px]">
                <p className="text-lg font-semibold">Sleep Duration</p>
                <p className="mt-1 text-white/50">[Graph Placeholder]</p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity */}
        <div>
          <h2 className="text-2xl font-bold mb-3">🏃 Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-white/10 p-4 min-h-[100px]">
              <p className="text-lg font-semibold">Steps</p>
              <p className="text-white/50">[Steps Graph]</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 min-h-[100px]">
              <p className="text-lg font-semibold">Calories</p>
              <p className="text-white/50">[Calories Graph]</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 min-h-[100px]">
              <p className="text-lg font-semibold">Active Minutes</p>
              <p className="text-white/50">[Activity Graph]</p>
            </div>
          </div>
        </div>

        {/* Heart Health */}
        <div>
          <h2 className="text-2xl font-bold mb-3">❤️ Heart Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/10 p-4 min-h-[120px]">
              <p className="text-lg font-semibold">Resting Heart Rate</p>
              <p className="text-white/50">[Line Graph Placeholder]</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 min-h-[120px]">
              <p className="text-lg font-semibold">Heart Rate Zones</p>
              <p className="text-white/50">[Pie Chart Placeholder]</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}



// // src/app/page.tsx

// import React from "react";
// import { SleepCalendar } from "~/components/SleepCalendar";
// import { login, getData } from "~/utils/apiClient";

// export default function HomePage() {


//   return (
//     <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] px-4 py-6 text-white">
//       <header className="mb-6 text-center">
//         <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
//           Health <span className="text-[hsl(280,100%,70%)]">Dashboard</span>
//         </h1>
//         <p className="mt-1 text-sm text-white/70">
//           Sleep, activity, and heart health at a glance
//         </p>
//       </header>

//       <section className="container mx-auto flex flex-col gap-8">
//         {/* Sleep Overview */}
//         <div>
//           <h2 className="text-2xl font-bold mb-3">🛌 Sleep Overview</h2>
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//             {/* Calendar now on the left */}
//             <div className="rounded-xl bg-white/10 p-4 min-h-[360px]">
//               <p className="text-lg font-semibold mb-2">📅 Sleep Calendar</p>
//               <ComponentCalendar />
//             </div>

//             {/* Sleep graphs to the right */}
//             <div className="lg:col-span-2 flex flex-col gap-4">
//               <div className="rounded-xl bg-white/10 p-4 min-h-[150px]">
//                 <p className="text-lg font-semibold">Sleep Duration</p>
//                 <p className="mt-1 text-white/50">[Graph Placeholder]</p>
//               </div>
//               <div className="rounded-xl bg-white/10 p-4 min-h-[150px]">
//                 <p className="text-lg font-semibold">Sleep Stages</p>
//                 <p className="mt-1 text-white/50">[Graph Placeholder]</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Activity */}
//         <div>
//           <h2 className="text-2xl font-bold mb-3">🏃 Activity</h2>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="rounded-xl bg-white/10 p-4 min-h-[100px]">
//               <p className="text-lg font-semibold">Steps</p>
//               <p className="text-white/50">[Steps Graph]</p>
//             </div>
//             <div className="rounded-xl bg-white/10 p-4 min-h-[100px]">
//               <p className="text-lg font-semibold">Calories</p>
//               <p className="text-white/50">[Calories Graph]</p>
//             </div>
//             <div className="rounded-xl bg-white/10 p-4 min-h-[100px]">
//               <p className="text-lg font-semibold">Active Minutes</p>
//               <p className="text-white/50">[Activity Graph]</p>
//             </div>
//           </div>
//         </div>

//         {/* Heart Health */}
//         <div>
//           <h2 className="text-2xl font-bold mb-3">❤️ Heart Health</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="rounded-xl bg-white/10 p-4 min-h-[120px]">
//               <p className="text-lg font-semibold">Resting Heart Rate</p>
//               <p className="text-white/50">[Line Graph Placeholder]</p>
//             </div>
//             <div className="rounded-xl bg-white/10 p-4 min-h-[120px]">
//               <p className="text-lg font-semibold">Heart Rate Zones</p>
//               <p className="text-white/50">[Pie Chart Placeholder]</p>
//             </div>
//           </div>
//         </div>
//       </section>
//     </main>
//   );
// }

// // Dashboard Components
// // - Sleep Calendar
// // - Sleep Stages Graph + Heart Rate Graph

// function ComponentCalendar() {
//   const [data, setData] = React.useState(null);
//   const [isLoading, setIsLoading] = React.useState(true);

//   React.useEffect(() => {
//     const fetchData = async () => {
//       try {
//         await login();
//         const sleepData = await getData("sleepSession");
//         setData(sleepData);
//       } catch (error) {
//         console.error("Error fetching data:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   return (
//     <div className="p-4 bg-white/10 rounded-lg shadow-md border text-white">
//       {isLoading ? (
//         <p>Loading sleep data...</p>
//       ) : data ? (
//         <SleepCalendar sleepSessionData={data} />
//       ) : (
//         <p>No sleep data available</p>
//       )}
//     </div>
//   );
// }

// function ComponentSleepStages() {

//   return (
//     <div className="p-4 bg-white/10 rounded-lg shadow-md border text-white">
//       <p className="text-lg font-semibold">Sleep Stages</p>
//       <p className="mt-1 text-white/50">[Graph Placeholder]</p>
//     </div>
//   );
// }
