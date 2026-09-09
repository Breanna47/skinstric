"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DemographicScores = Record<string, number>;

type AnalysisResponse = {
  race?: DemographicScores;
  age?: DemographicScores;
  gender?: DemographicScores;
  [key: string]: unknown;
};

export default function AnalysisPage() {
  const router = useRouter();

  const [preview, setPreview] = useState<string>("");
  const [imageBase64, setImageBase64] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<AnalysisResponse | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("skinstricUser");

    if (!saved) {
      router.push("/");
    }
  }, [router]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }

    setError("");
    setResults(null);

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;

      setPreview(result);

      const base64 = result.split(",")[1] ?? "";
      setImageBase64(base64);
    };

    reader.onerror = () => {
      setError("Unable to read this image.");
    };

    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imageBase64) {
      setError("Please upload an image first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "https://us-central1-frontend-simplified.cloudfunctions.net/skinstricPhaseTwo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: imageBase64,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();

        console.error("Phase Two API error:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });

        setError(
          `API error ${response.status}: ${errorText || response.statusText}`,
        );

        return;
      }

      const data: AnalysisResponse = await response.json();

      console.log("Phase Two response:", data);

      setResults(data.data as AnalysisResponse);

      localStorage.setItem(
  "skinstricAnalysis",
  JSON.stringify(data.data)
);

    } catch (err) {
      console.error(err);
      setError("Something went wrong while analyzing the image.");
    } finally {
      setLoading(false);
    }
  };

  const getTopResult = (scores?: DemographicScores) => {
    if (!scores) {
      return null;
    }

    const entries = Object.entries(scores);

    if (entries.length === 0) {
      return null;
    }

    return entries.sort((a, b) => b[1] - a[1])[0];
  };

  const topRace = getTopResult(results?.race);
  const topAge = getTopResult(results?.age);
  const topGender = getTopResult(results?.gender);

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

      {/* CONTENT */}
      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-5xl">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase">To Start Analysis</p>

            <h2 className="mt-2 text-3xl font-normal uppercase tracking-tight md:text-4xl">
              Upload an image
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Select a clear photo to begin your demographic analysis.
            </p>
          </div>

          <div className="grid gap-10 lg:grid-cols-2">
            {/* UPLOAD */}
            <div className="flex min-h-[420px] flex-col items-center justify-center border border-black p-8 text-center">
              {preview ? (
                <>
                  <img
                    src={preview}
                    alt="Uploaded preview"
                    className="mb-6 max-h-72 w-full object-contain"
                  />

                  <label className="cursor-pointer border border-black px-6 py-3 text-xs font-bold uppercase transition hover:bg-black hover:text-white">
                    Choose Another Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </>
              ) : (
                <>
                  <div className="mb-8 flex h-40 w-40 rotate-45 items-center justify-center border border-black">
                    <span className="-rotate-45 text-5xl font-light">+</span>
                  </div>

                  <label className="cursor-pointer text-sm font-semibold uppercase">
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </>
              )}

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!imageBase64 || loading}
                className="mt-8 bg-black px-7 py-3 text-xs font-bold uppercase text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {loading ? "Analyzing..." : "Analyze"}
              </button>

              {error && <p className="mt-5 text-sm text-red-600">{error}</p>}
            </div>

            {/* RESULTS */}
            <div className="min-h-[420px] border border-black p-8">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Analysis Results
              </p>

              {!results ? (
                <div className="flex h-[320px] items-center justify-center text-center text-sm text-gray-400">
                  Your demographic results will appear here after analysis.
                </div>
              ) : (
                <div className="mt-8 space-y-8">
                  <div>
                    <p className="text-xs uppercase text-gray-500">Race</p>

                    <p className="mt-2 text-3xl font-light capitalize">
                      {topRace?.[0] ?? "Unknown"}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {topRace ? `${(topRace[1] * 100).toFixed(2)}%` : ""}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase text-gray-500">Age</p>

                    <p className="mt-2 text-3xl font-light">
                      {topAge?.[0] ?? "Unknown"}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {topAge ? `${(topAge[1] * 100).toFixed(2)}%` : ""}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase text-gray-500">Gender</p>

                    <p className="mt-2 text-3xl font-light capitalize">
                      {topGender?.[0] ?? "Unknown"}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {topGender ? `${(topGender[1] * 100).toFixed(2)}%` : ""}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="flex items-center justify-between px-6 py-6 md:px-10">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-3 text-xs font-semibold uppercase"
        >
          <span className="flex h-9 w-9 rotate-45 items-center justify-center border border-black">
            <span className="-rotate-45">←</span>
          </span>
          Back
        </button>

        <button
          type="button"
          onClick={() => router.push("/results")}
          disabled={!results}
          className="flex items-center gap-3 text-xs font-semibold uppercase disabled:cursor-not-allowed disabled:opacity-30"
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
