"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type DemographicScores = Record<string, number>;

type AnalysisData = {
  race?: DemographicScores;
  age?: DemographicScores;
  gender?: DemographicScores;
};

type SelectionKey = "race" | "age" | "gender";

const categoryLabels: Record<SelectionKey, string> = {
  race: "Race",
  age: "Age",
  gender: "Sex",
};

export default function ResultsPage() {
  const router = useRouter();

  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

  const [activeCategory, setActiveCategory] = useState<SelectionKey>("race");

  const [selected, setSelected] = useState<Record<SelectionKey, string>>({
    race: "",
    age: "",
    gender: "",
  });

  function getHighestScore(scores?: DemographicScores) {
    if (!scores) {
      return null;
    }

    const entries = Object.entries(scores);

    if (entries.length === 0) {
      return null;
    }

    return [...entries].sort((a, b) => b[1] - a[1])[0];
  }

  useEffect(() => {
    const saved = localStorage.getItem("skinstricAnalysis");

    if (!saved) {
      router.push("/analysis");
      return;
    }

    try {
      const parsed: AnalysisData = JSON.parse(saved);

      setAnalysis(parsed);

      setSelected({
        race: getHighestScore(parsed.race)?.[0] ?? "",
        age: getHighestScore(parsed.age)?.[0] ?? "",
        gender: getHighestScore(parsed.gender)?.[0] ?? "",
      });
    } catch (error) {
      console.error("Unable to load analysis results:", error);
      router.push("/analysis");
    }
  }, [router]);

  const sortedResults = useMemo(() => {
    if (!analysis) {
      return null;
    }

    return {
      race: Object.entries(analysis.race ?? {}).sort((a, b) => b[1] - a[1]),

      age: Object.entries(analysis.age ?? {}).sort((a, b) => b[1] - a[1]),

      gender: Object.entries(analysis.gender ?? {}).sort((a, b) => b[1] - a[1]),
    };
  }, [analysis]);

  if (!analysis || !sortedResults) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FCFCFC] text-black">
        <p className="text-[10px] font-semibold uppercase">
          Loading analysis...
        </p>
      </main>
    );
  }

  const activeResults = sortedResults[activeCategory];

  const activeSelection = selected[activeCategory];

  const selectedScore =
    activeResults.find(([label]) => label === activeSelection)?.[1] ?? 0;

  const confidencePercentage = Math.round(selectedScore * 100);

  return (
    <main className="flex min-h-screen flex-col bg-[#FCFCFC] text-black">
      {/* HEADER */}
      <header className="flex items-center px-5 py-5 md:px-8">
        <div className="flex items-center gap-3">
          <h1 className="text-[11px] font-semibold uppercase tracking-tight">
            Skinstric
          </h1>

          <span className="text-[10px] uppercase text-gray-500">
            [ Analysis ]
          </span>
        </div>
      </header>

      {/* MAIN */}
      <section className="flex-1 px-5 pt-4 md:px-8">
        {/* TITLE */}
        <div>
          <p className="text-[11px] font-semibold uppercase">A.I. Analysis</p>

          <h2 className="mt-2 text-4xl font-normal uppercase tracking-[-0.04em] sm:text-5xl md:text-6xl">
            Demographics
          </h2>

          <p className="mt-2 text-[10px] font-medium uppercase">
            Predicted Race & Age
          </p>
        </div>

        {/* RESULTS */}
        <div className="mt-10 grid gap-4 lg:grid-cols-[220px_1fr_330px]">
          {/* CATEGORY SELECTOR */}
          <aside className="space-y-[2px]">
            {(["race", "age", "gender"] as SelectionKey[]).map((category) => {
              const active = activeCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`w-full border-t border-black px-4 py-5 text-left transition ${
                    active
                      ? "bg-[#1A1A1A] text-white"
                      : "bg-[#EAEAEA] text-black hover:bg-[#DDDDDD]"
                  }`}
                >
                  <p className="text-xl font-normal capitalize">
                    {selected[category] || "Unknown"}
                  </p>

                  <p
                    className={`mt-2 text-[9px] font-medium uppercase ${
                      active ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {categoryLabels[category]}
                  </p>
                </button>
              );
            })}
          </aside>

          {/* SELECTED RESULT / CONFIDENCE */}
          <div className="flex min-h-[430px] flex-col justify-between border-t border-black bg-[#F1F1F1] p-6 sm:p-8">
            <p className="text-3xl font-light capitalize sm:text-4xl">
              {activeSelection || "Unknown"}
            </p>

            <div className="flex flex-1 items-center justify-center">
              <div
                className="relative flex h-56 w-56 items-center justify-center rounded-full sm:h-64 sm:w-64"
                style={{
                  background: `conic-gradient(
                    #1A1A1A ${confidencePercentage}%,
                    #D9D9D9 ${confidencePercentage}% 100%
                  )`,
                }}
              >
                <div className="flex h-[94%] w-[94%] items-center justify-center rounded-full bg-[#F1F1F1]">
                  <p className="text-4xl font-light">
                    {confidencePercentage}
                    <span className="text-xl">%</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CONFIDENCE OPTIONS */}
          <div className="border-t border-black bg-[#F1F1F1]">
            <div className="flex items-center justify-between px-4 py-4">
              <p className="text-[10px] font-semibold uppercase">
                {categoryLabels[activeCategory]}
              </p>

              <p className="text-[10px] font-semibold uppercase">
                A.I. Confidence
              </p>
            </div>

            <div>
              {activeResults.map(([label, score]) => {
                const active = selected[activeCategory] === label;

                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() =>
                      setSelected((previous) => ({
                        ...previous,
                        [activeCategory]: label,
                      }))
                    }
                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
                      active ? "bg-[#1A1A1A] text-white" : "hover:bg-[#E2E2E2]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`flex h-3 w-3 items-center justify-center rounded-full border ${
                          active ? "border-white" : "border-black"
                        }`}
                      >
                        {active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </span>

                      <span className="capitalize">{label}</span>
                    </span>

                    <span>{(score * 100).toFixed(0)}%</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <p className="mt-6 text-[9px] font-medium uppercase">
          If A.I. estimate is wrong, select the correct one.
        </p>
      </section>

      {/* FOOTER */}
      <footer className="flex items-center justify-between px-5 py-6 md:px-8">
        <button
          type="button"
          onClick={() => router.push("/analysis")}
          className="flex items-center gap-3 text-[9px] font-medium uppercase"
        >
          <span className="flex h-7 w-7 rotate-45 items-center justify-center border border-black">
            <span className="-rotate-45">←</span>
          </span>
          Back
        </button>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-3 text-[9px] font-medium uppercase"
        >
          Home
          <span className="flex h-7 w-7 rotate-45 items-center justify-center border border-black">
            <span className="-rotate-45">→</span>
          </span>
        </button>
      </footer>
    </main>
  );
}
