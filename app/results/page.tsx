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
  gender: "Gender",
};

export default function ResultsPage() {
  const router = useRouter();

  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

  const [selected, setSelected] = useState<Record<SelectionKey, string>>({
    race: "",
    age: "",
    gender: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("skinstricAnalysis");

    if (!saved) {
      router.push("/analysis");
      return;
    }

    const parsed: AnalysisData = JSON.parse(saved);

    setAnalysis(parsed);

    setSelected({
      race: getHighestScore(parsed.race)?.[0] ?? "",
      age: getHighestScore(parsed.age)?.[0] ?? "",
      gender: getHighestScore(parsed.gender)?.[0] ?? "",
    });
  }, [router]);

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
      <main className="flex min-h-screen items-center justify-center bg-white text-black">
        <p className="text-sm uppercase">Loading analysis...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-white text-black">
      {/* HEADER */}
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-bold uppercase tracking-tight">
            Skinstric
          </h1>

          <span className="hidden text-xs uppercase text-gray-500 sm:block">
            [ Analysis ]
          </span>
        </div>

        <button
          type="button"
          className="bg-black px-4 py-2 text-xs font-semibold uppercase text-white"
        >
          Enter Code
        </button>
      </header>

      {/* MAIN */}
      <section className="flex-1 px-6 py-10 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase">A.I. Analysis</p>

            <h2 className="mt-2 text-4xl font-normal uppercase tracking-tight md:text-5xl">
              Demographics
            </h2>

            <p className="mt-2 text-sm uppercase text-gray-500">
              Predicted race, age and gender
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr_1fr]">
            {/* SELECTED VALUES */}
            <aside className="space-y-3">
              {(["race", "age", "gender"] as SelectionKey[]).map((category) => (
                <div
                  key={category}
                  className="border-t border-black bg-gray-100 p-5"
                >
                  <p className="text-xs uppercase text-gray-500">
                    {categoryLabels[category]}
                  </p>

                  <p className="mt-3 text-2xl font-normal capitalize">
                    {selected[category] || "Unknown"}
                  </p>
                </div>
              ))}
            </aside>

            {/* CENTER PANEL */}
            <div className="flex min-h-[430px] flex-col justify-between border-t border-black bg-gray-100 p-8">
              <div>
                <p className="text-xs uppercase text-gray-500">
                  Selected Demographics
                </p>

                <div className="mt-8 space-y-8">
                  <div>
                    <p className="text-sm uppercase text-gray-500">Race</p>
                    <p className="mt-2 text-4xl font-light capitalize">
                      {selected.race}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm uppercase text-gray-500">Age</p>
                    <p className="mt-2 text-4xl font-light">{selected.age}</p>
                  </div>

                  <div>
                    <p className="text-sm uppercase text-gray-500">Gender</p>
                    <p className="mt-2 text-4xl font-light capitalize">
                      {selected.gender}
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-8 max-w-sm text-xs uppercase leading-5 text-gray-500">
                Click any value in the confidence table to update the selected
                demographic.
              </p>
            </div>

            {/* CONFIDENCE TABLES */}
            <div className="space-y-6">
              {(["race", "age", "gender"] as SelectionKey[]).map((category) => (
                <div key={category} className="border-t border-black pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold uppercase">
                      {categoryLabels[category]}
                    </p>

                    <p className="text-xs uppercase text-gray-500">
                      Confidence
                    </p>
                  </div>

                  <div className="space-y-1">
                    {sortedResults[category].map(([label, score]) => {
                      const active = selected[category] === label;

                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() =>
                            setSelected((prev) => ({
                              ...prev,
                              [category]: label,
                            }))
                          }
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                            active ? "bg-black text-white" : "hover:bg-gray-100"
                          }`}
                        >
                          <span className="capitalize">{label}</span>

                          <span>{(score * 100).toFixed(2)}%</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="flex items-center justify-between px-6 py-6 md:px-10">
        <button
          type="button"
          onClick={() => router.push("/analysis")}
          className="flex items-center gap-3 text-xs font-semibold uppercase"
        >
          <span className="flex h-9 w-9 rotate-45 items-center justify-center border border-black">
            <span className="-rotate-45">←</span>
          </span>
          Back
        </button>

        <button
          type="button"
          onClick={() => router.push("/selfie")}
          className="flex items-center gap-3 text-xs font-semibold uppercase"
        >
          Proceed
          <span className="flex h-9 w-9 rotate-45 items-center justify-center border border-black">
            <span className="-rotate-45">→</span>
          </span>
        </button>
      </footer>
    </main>
  );
}
