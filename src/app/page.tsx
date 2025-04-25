import { SleepCalendar } from "~/components/SleepCalendar";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] p-6 text-white">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[4rem]">
          Health <span className="text-[hsl(280,100%,70%)]">Dashboard</span>
        </h1>
        <p className="mt-4 text-lg text-white/70">
          Overview of your sleep, activity, and health stats
        </p>
      </header>

      <section className="container mx-auto flex flex-col gap-12">
        {/* Sleep Overview */}
        <div>
          <h2 className="text-3xl font-bold mb-6">🛌 Sleep Overview</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="rounded-xl bg-white/10 p-6 min-h-[200px]">
                <p className="text-xl font-semibold">Sleep Duration Graph</p>
                <p className="mt-2 text-white/50">[Graph goes here]</p>
              </div>
              <div className="rounded-xl bg-white/10 p-6 min-h-[200px]">
                <p className="text-xl font-semibold">Sleep Stages Breakdown</p>
                <p className="mt-2 text-white/50">[Graph goes here]</p>
              </div>
            </div>
            <div className="rounded-xl bg-white/10 p-6 min-h-[420px]">
              <p className="text-xl font-semibold mb-4">📅 Sleep Calendar</p>
              <SleepCalendar />
            </div>
          </div>
        </div>

        {/* Activity Section */}
        <div>
          <h2 className="text-3xl font-bold mb-4">🏃 Activity Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl bg-white/10 p-6 min-h-[150px]">
              <p className="text-xl font-semibold">Steps</p>
              <p className="mt-2 text-white/50">[Steps graph or data]</p>
            </div>
            <div className="rounded-xl bg-white/10 p-6 min-h-[150px]">
              <p className="text-xl font-semibold">Calories Burned</p>
              <p className="mt-2 text-white/50">[Calories chart]</p>
            </div>
            <div className="rounded-xl bg-white/10 p-6 min-h-[150px]">
              <p className="text-xl font-semibold">Active Minutes</p>
              <p className="mt-2 text-white/50">[Activity bar chart]</p>
            </div>
          </div>
        </div>

        {/* Heart Rate Section */}
        <div>
          <h2 className="text-3xl font-bold mb-4">❤️ Heart Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl bg-white/10 p-6 min-h-[180px]">
              <p className="text-xl font-semibold">Resting Heart Rate</p>
              <p className="mt-2 text-white/50">[Line graph placeholder]</p>
            </div>
            <div className="rounded-xl bg-white/10 p-6 min-h-[180px]">
              <p className="text-xl font-semibold">Heart Rate Zones</p>
              <p className="mt-2 text-white/50">[Pie chart placeholder]</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
