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

type PhaseTwoResponse = {
  success?: boolean;
  message?: string;
  data?: AnalysisResponse;
};

type Stage = "choose" | "galleryPreview" | "preparing" | "menu";

export default function AnalysisPage() {
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("choose");
  const [preview, setPreview] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [cameraPermissionOpen, setCameraPermissionOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("skinstricUser");

    if (!savedUser) {
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

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;

      setPreview(result);
      setImageBase64(result.split(",")[1] ?? "");
      setStage("galleryPreview");
    };

    reader.onerror = () => {
      setError("Unable to read this image.");
    };

    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!imageBase64) {
      setError("Please select an image first.");
      return;
    }

    setError("");
    setStage("preparing");

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

        setStage("galleryPreview");
        return;
      }

      const responseData: PhaseTwoResponse = await response.json();

      console.log("Phase Two response:", responseData);

      if (!responseData.data) {
        throw new Error("The analysis response did not contain result data.");
      }

      localStorage.setItem(
        "skinstricAnalysis",
        JSON.stringify(responseData.data),
      );

      setStage("menu");
    } catch (err) {
      console.error(err);
      setError("Something went wrong while analyzing the image.");
      setStage("galleryPreview");
    }
  };

  const handleBack = () => {
    setError("");

    if (stage === "galleryPreview") {
      setPreview("");
      setImageBase64("");
      setStage("choose");
      return;
    }

    if (stage === "menu") {
      setStage("choose");
      return;
    }

    router.push("/");
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#FCFCFC] text-black">
      {/* HEADER */}
      <header className="relative z-30 flex items-center px-5 py-5 md:px-8">
        <div className="flex items-center gap-3">
          <h1 className="text-[11px] font-semibold uppercase tracking-tight">
            Skinstric
          </h1>

          <span className="text-[10px] uppercase text-gray-500">
            {stage === "menu" ? "[ Analysis ]" : "[ Intro ]"}
          </span>
        </div>
      </header>

      {/* CHOOSE CAMERA OR GALLERY */}
      {stage === "choose" && (
        <>
          <section className="relative flex flex-1 flex-col px-5 pt-2 md:px-8">
            <p className="text-[10px] font-semibold uppercase">
              To Start Analysis
            </p>

            <div className="flex flex-1 items-center justify-center">
              <div className="grid w-full max-w-4xl gap-16 md:grid-cols-2">
                {/* CAMERA */}
                <button
                  type="button"
                  onClick={() => setCameraPermissionOpen(true)}
                  className="group relative mx-auto flex h-[300px] w-[300px] items-center justify-center sm:h-[340px] sm:w-[340px]"
                >
                  <div className="absolute h-[220px] w-[220px] rotate-45 border border-dotted border-gray-300 transition group-hover:scale-105 sm:h-[250px] sm:w-[250px]" />

                  <div className="relative z-10 flex items-center gap-8">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-black">
                      <span className="text-4xl">◉</span>
                    </div>

                    <p className="max-w-[120px] text-left text-[10px] font-medium uppercase leading-4">
                      Allow A.I.
                      <br />
                      to scan your face
                    </p>
                  </div>
                </button>

                {/* GALLERY */}
                <label className="group relative mx-auto flex h-[300px] w-[300px] cursor-pointer items-center justify-center sm:h-[340px] sm:w-[340px]">
                  <div className="absolute h-[220px] w-[220px] rotate-45 border border-dotted border-gray-300 transition group-hover:scale-105 sm:h-[250px] sm:w-[250px]" />

                  <div className="relative z-10 flex items-center gap-8">
                    <p className="max-w-[120px] text-right text-[10px] font-medium uppercase leading-4">
                      Allow A.I.
                      <br />
                      access gallery
                    </p>

                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-black">
                      <span className="text-4xl">◒</span>
                    </div>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {error && (
              <p className="pb-4 text-center text-xs text-red-600">{error}</p>
            )}
          </section>

          <footer className="px-5 py-5 md:px-8">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center gap-3 text-[9px] font-medium uppercase"
            >
              <span className="flex h-7 w-7 rotate-45 items-center justify-center border border-black">
                <span className="-rotate-45">←</span>
              </span>
              Back
            </button>
          </footer>
        </>
      )}

      {/* CAMERA CONFIRMATION — FIGMA 006 */}
      {cameraPermissionOpen && stage === "choose" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 px-6">
          <div className="w-full max-w-sm bg-[#1C1C1C] text-white shadow-2xl">
            <p className="px-5 py-5 text-[11px] font-medium uppercase">
              Allow A.I. to access your camera
            </p>

            <div className="flex justify-end gap-7 border-t border-white/30 px-5 py-3">
              <button
                type="button"
                onClick={() => setCameraPermissionOpen(false)}
                className="text-[9px] uppercase text-gray-300"
              >
                Deny
              </button>

              <button
                type="button"
                onClick={() => {
                  setCameraPermissionOpen(false);
                  router.push("/selfie");
                }}
                className="text-[9px] font-medium uppercase text-white"
              >
                Allow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GALLERY PREVIEW */}
      {stage === "galleryPreview" && (
        <>
          <section className="flex flex-1 flex-col px-5 pt-2 md:px-8">
            <p className="text-[10px] font-semibold uppercase">
              To Start Analysis
            </p>

            <div className="flex flex-1 items-center justify-center">
              <div className="w-full max-w-3xl text-center">
                <div className="mx-auto flex min-h-[430px] items-center justify-center overflow-hidden bg-[#D9D9D9]">
                  <img
                    src={preview}
                    alt="Selected image preview"
                    className="max-h-[520px] w-full object-contain"
                  />
                </div>

                <p className="mt-5 text-[9px] uppercase text-gray-500">
                  Selected image
                </p>

                {error && <p className="mt-4 text-xs text-red-600">{error}</p>}
              </div>
            </div>
          </section>

          <footer className="flex items-center justify-between px-5 py-5 md:px-8">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-3 text-[9px] font-medium uppercase"
            >
              <span className="flex h-7 w-7 rotate-45 items-center justify-center border border-black">
                <span className="-rotate-45">←</span>
              </span>
              Back
            </button>

            <button
              type="button"
              onClick={analyzeImage}
              className="flex items-center gap-3 text-[9px] font-medium uppercase"
            >
              Proceed
              <span className="flex h-7 w-7 rotate-45 items-center justify-center border border-black">
                <span className="-rotate-45">→</span>
              </span>
            </button>
          </footer>
        </>
      )}

      {/* PREPARING ANALYSIS — FIGMA 011 */}
      {stage === "preparing" && (
        <section className="flex flex-1 items-center justify-center px-6">
          <div className="relative flex h-[360px] w-[360px] items-center justify-center sm:h-[450px] sm:w-[450px]">
            <div className="absolute h-[190px] w-[190px] rotate-[34deg] border border-dotted border-gray-300 sm:h-[240px] sm:w-[240px]" />

            <div className="absolute h-[230px] w-[230px] rotate-[45deg] border border-dotted border-gray-300 sm:h-[290px] sm:w-[290px]" />

            <div className="absolute h-[270px] w-[270px] rotate-[58deg] border border-dotted border-gray-300 sm:h-[340px] sm:w-[340px]" />

            <p className="relative z-10 text-[10px] font-semibold uppercase">
              Preparing your analysis...
            </p>
          </div>
        </section>
      )}

      {/* A.I. ANALYSIS MENU — FIGMA 012 */}
      {stage === "menu" && (
        <>
          <section className="flex flex-1 flex-col px-5 pt-2 md:px-8">
            <div>
              <p className="text-[11px] font-semibold uppercase">
                A.I. Analysis
              </p>

              <p className="mt-3 max-w-[280px] text-[9px] uppercase leading-4">
                A.I. has estimated the following.
                <br />
                Fix estimated information if needed.
              </p>
            </div>

            <div className="flex flex-1 items-center justify-center">
              <div className="relative flex h-[390px] w-[390px] items-center justify-center sm:h-[460px] sm:w-[460px]">
                <div className="absolute h-[320px] w-[320px] rotate-45 border border-dotted border-gray-300 sm:h-[370px] sm:w-[370px]" />

                <div className="grid h-[240px] w-[240px] rotate-45 grid-cols-2 grid-rows-2 gap-[2px] sm:h-[280px] sm:w-[280px]">
                  {/* DEMOGRAPHICS */}
                  <button
                    type="button"
                    onClick={() => router.push("/results")}
                    className="flex items-center justify-center bg-[#E1E1E1] transition hover:bg-[#D3D3D3]"
                  >
                    <span className="-rotate-45 text-[10px] font-semibold uppercase">
                      Demographics
                    </span>
                  </button>

                  {/* COSMETIC */}
                  <button
                    type="button"
                    className="flex cursor-default items-center justify-center bg-[#EFEFEF]"
                  >
                    <span className="-rotate-45 text-center text-[9px] font-medium uppercase">
                      Cosmetic
                      <br />
                      Concerns
                    </span>
                  </button>

                  {/* SKIN TYPE */}
                  <button
                    type="button"
                    className="flex cursor-default items-center justify-center bg-[#EFEFEF]"
                  >
                    <span className="-rotate-45 text-center text-[9px] font-medium uppercase">
                      Skin Type
                      <br />
                      Details
                    </span>
                  </button>

                  {/* WEATHER */}
                  <button
                    type="button"
                    className="flex cursor-default items-center justify-center bg-[#EFEFEF]"
                  >
                    <span className="-rotate-45 text-[9px] font-medium uppercase">
                      Weather
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <footer className="flex items-center justify-between px-5 py-5 md:px-8">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-3 text-[9px] font-medium uppercase"
            >
              <span className="flex h-7 w-7 rotate-45 items-center justify-center border border-black">
                <span className="-rotate-45">←</span>
              </span>
              Back
            </button>

            <button
              type="button"
              onClick={() => router.push("/results")}
              className="flex items-center gap-3 text-[9px] font-medium uppercase"
            >
              Get Summary
              <span className="flex h-7 w-7 rotate-45 items-center justify-center border border-black">
                <span className="-rotate-45">→</span>
              </span>
            </button>
          </footer>
        </>
      )}
    </main>
  );
}
