"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type AnalysisResponse = {
  race?: Record<string, number>;
  age?: Record<string, number>;
  gender?: Record<string, number>;
};

type Stage = "setup" | "camera" | "captured" | "preparing" | "menu";

export default function SelfiePage() {
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [stage, setStage] = useState<Stage>("setup");
  const [capturedImage, setCapturedImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const beginCamera = async () => {
      setError("");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
          },
          audio: false,
        });

        streamRef.current = stream;

        // Briefly show the official "setting up camera" state.
        setTimeout(() => {
          setStage("camera");
        }, 900);
      } catch (err) {
        console.error(err);
        setError(
          "Unable to access the camera. Please allow camera permission and try again.",
        );
      }
    };

    beginCamera();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (stage === "camera" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;

      videoRef.current.play().catch((err) => {
        console.error("Unable to play camera stream:", err);
      });
    }
  }, [stage]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const startCameraAgain = async () => {
    setError("");
    setCapturedImage("");
    setStage("setup");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;

      setTimeout(() => {
        setStage("camera");
      }, 700);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to access the camera. Please allow camera permission and try again.",
      );
    }
  };

  const captureSelfie = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setError("Unable to capture image.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const image = canvas.toDataURL("image/jpeg", 0.9);

    setCapturedImage(image);
    stopCamera();
    setStage("captured");
  };

  const analyzeSelfie = async () => {
    if (!capturedImage) {
      setError("Please take a selfie first.");
      return;
    }

    setLoading(true);
    setError("");
    setStage("preparing");

    try {
      const base64 = capturedImage.split(",")[1] ?? "";

      const response = await fetch(
        "https://us-central1-frontend-simplified.cloudfunctions.net/skinstricPhaseTwo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: base64,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();

        setError(
          `API error ${response.status}: ${errorText || response.statusText}`,
        );

        setStage("captured");
        return;
      }

      const responseData = await response.json();

      const analysis: AnalysisResponse = responseData.data;

      localStorage.setItem("skinstricAnalysis", JSON.stringify(analysis));

      setStage("menu");
    } catch (err) {
      console.error(err);
      setError("Something went wrong while analyzing your selfie.");
      setStage("captured");
    } finally {
      setLoading(false);
    }
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

      {/* 007 — SETTING UP CAMERA */}
      {stage === "setup" && (
        <section className="flex flex-1 flex-col items-center justify-center px-6">
          <div className="text-center">
            <p className="text-xl font-normal uppercase tracking-tight md:text-2xl">
              Setting up camera...
            </p>

            <div className="relative mx-auto mt-12 flex h-[220px] w-[220px] items-center justify-center">
              <div className="absolute h-[150px] w-[150px] rotate-[35deg] border border-dotted border-gray-300" />
              <div className="absolute h-[180px] w-[180px] rotate-45 border border-dotted border-gray-300" />
              <div className="absolute h-[210px] w-[210px] rotate-[55deg] border border-dotted border-gray-300" />

              <span className="relative z-10 text-5xl">◉</span>
            </div>

            <div className="mt-14">
              <p className="text-[9px] uppercase text-gray-500">
                To get better results make sure to have
              </p>

              <div className="mt-3 flex flex-wrap justify-center gap-5 text-[9px] uppercase">
                <span>◇ Neutral Expression</span>
                <span>◇ Frontal Pose</span>
                <span>◇ Adequate Lighting</span>
              </div>
            </div>

            {error && <p className="mt-8 text-xs text-red-600">{error}</p>}
          </div>
        </section>
      )}

  {/* 009 — LIVE CAMERA */}
{stage === "camera" && (
  <section className="flex flex-1 flex-col px-4 pb-4 md:px-8">
    <div className="relative mx-auto flex h-[78vh] max-h-[760px] min-h-[520px] w-full max-w-[1400px] items-center justify-center overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
      />

      {/* TAKE PICTURE */}
      <button
        type="button"
        onClick={captureSelfie}
        className="absolute right-6 top-1/2 flex -translate-y-1/2 items-center gap-3 text-[10px] font-medium uppercase text-white md:right-10"
      >
        <span>Take Picture</span>

        <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white">
          <span className="h-10 w-10 rounded-full bg-white" />
        </span>
      </button>

      {/* CAMERA GUIDANCE */}
      <div className="absolute inset-x-0 bottom-5 flex flex-col items-center px-4 text-center text-white">
        <p className="text-[8px] uppercase">
          To get better results make sure to have
        </p>

        <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1 text-[8px] uppercase">
          <span>◇ Neutral Expression</span>
          <span>◇ Frontal Pose</span>
          <span>◇ Adequate Lighting</span>
        </div>
      </div>
    </div>

    <canvas ref={canvasRef} className="hidden" />
  </section>
)}

      {/* 010 — GREAT SHOT */}
      {stage === "captured" && (
        <>
          <section className="flex flex-1 flex-col px-5 pt-4 md:px-8">
            <div className="mb-6 text-center">
              <p className="text-2xl font-medium uppercase tracking-tight">
                Great Shot
              </p>

              <p className="mt-2 text-[9px] uppercase text-gray-500">
                Image captured successfully
              </p>
            </div>

            <div className="flex flex-1 items-center justify-center">
              <div className="w-full max-w-3xl">
                <div className="flex min-h-[500px] items-center justify-center overflow-hidden bg-[#D9D9D9]">
                  <img
                    src={capturedImage}
                    alt="Captured selfie"
                    className="max-h-[600px] w-full object-contain"
                  />
                </div>

                {error && (
                  <p className="mt-4 text-center text-xs text-red-600">
                    {error}
                  </p>
                )}
              </div>
            </div>
          </section>

          <footer className="flex items-center justify-between px-5 py-5 md:px-8">
            <button
              type="button"
              onClick={startCameraAgain}
              className="flex items-center gap-3 text-[9px] font-medium uppercase"
            >
              <span className="flex h-7 w-7 rotate-45 items-center justify-center border border-black">
                <span className="-rotate-45">←</span>
              </span>
              Back
            </button>

            <button
              type="button"
              onClick={analyzeSelfie}
              disabled={loading}
              className="flex items-center gap-3 text-[9px] font-medium uppercase disabled:opacity-30"
            >
              {loading ? "Analyzing..." : "Proceed"}

              <span className="flex h-7 w-7 rotate-45 items-center justify-center border border-black">
                <span className="-rotate-45">→</span>
              </span>
            </button>
          </footer>
        </>
      )}

      {/* 011 — PREPARING ANALYSIS */}
      {stage === "preparing" && (
        <section className="flex flex-1 items-center justify-center px-6">
          <div className="relative flex h-[360px] w-[360px] items-center justify-center sm:h-[450px] sm:w-[450px]">
            <div className="absolute h-[190px] w-[190px] rotate-[34deg] border border-dotted border-gray-300 sm:h-[240px] sm:w-[240px]" />

            <div className="absolute h-[230px] w-[230px] rotate-45 border border-dotted border-gray-300 sm:h-[290px] sm:w-[290px]" />

            <div className="absolute h-[270px] w-[270px] rotate-[58deg] border border-dotted border-gray-300 sm:h-[340px] sm:w-[340px]" />

            <p className="relative z-10 text-[10px] font-semibold uppercase">
              Preparing your analysis...
            </p>
          </div>
        </section>
      )}

      {/* 012 — A.I. ANALYSIS MENU */}
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
                  <button
                    type="button"
                    onClick={() => router.push("/results")}
                    className="flex items-center justify-center bg-[#E1E1E1] transition hover:bg-[#D3D3D3]"
                  >
                    <span className="-rotate-45 text-[10px] font-semibold uppercase">
                      Demographics
                    </span>
                  </button>

                  <div className="flex items-center justify-center bg-[#EFEFEF]">
                    <span className="-rotate-45 text-center text-[9px] font-medium uppercase">
                      Cosmetic
                      <br />
                      Concerns
                    </span>
                  </div>

                  <div className="flex items-center justify-center bg-[#EFEFEF]">
                    <span className="-rotate-45 text-center text-[9px] font-medium uppercase">
                      Skin Type
                      <br />
                      Details
                    </span>
                  </div>

                  <div className="flex items-center justify-center bg-[#EFEFEF]">
                    <span className="-rotate-45 text-[9px] font-medium uppercase">
                      Weather
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer className="flex items-center justify-between px-5 py-5 md:px-8">
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
