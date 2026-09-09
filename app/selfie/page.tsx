"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type AnalysisResponse = {
  race?: Record<string, number>;
  age?: Record<string, number>;
  gender?: Record<string, number>;
};

export default function SelfiePage() {
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;

      videoRef.current.play().catch((error) => {
        console.error("Unable to play camera stream:", error);
      });
    }
  }, [cameraActive]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const startCamera = async () => {
    setError("");
    setCapturedImage("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to access the camera. Please allow camera permission and try again.",
      );
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
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
  };

  const retakeSelfie = () => {
    setCapturedImage("");
    setError("");
    startCamera();
  };

  const analyzeSelfie = async () => {
    if (!capturedImage) {
      setError("Please take a selfie first.");
      return;
    }

    setLoading(true);
    setError("");

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

        return;
      }

      const responseData = await response.json();

      const analysis: AnalysisResponse = responseData.data;

      localStorage.setItem("skinstricAnalysis", JSON.stringify(analysis));

      router.push("/results");
    } catch (err) {
      console.error(err);
      setError("Something went wrong while analyzing your selfie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-white text-black">
      {/* HEADER */}
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-bold uppercase tracking-tight">
            Skinstric
          </h1>

          <span className="hidden text-xs uppercase text-gray-500 sm:block">
            [ Selfie ]
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
      <section className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-5xl">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase">Selfie Analysis</p>

            <h2 className="mt-2 text-3xl font-normal uppercase tracking-tight md:text-4xl">
              Take a selfie
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Position your face clearly in the frame before capturing.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            {/* CAMERA */}
            <div className="flex min-h-[480px] items-center justify-center border border-black bg-gray-50 p-4">
              {!cameraActive && !capturedImage && (
                <div className="text-center">
                  <div className="mx-auto mb-8 flex h-44 w-44 items-center justify-center border border-black">
                    <span className="text-5xl font-light">◉</span>
                  </div>

                  <button
                    type="button"
                    onClick={startCamera}
                    className="bg-black px-7 py-3 text-xs font-bold uppercase text-white transition hover:bg-gray-800"
                  >
                    Start Camera
                  </button>
                </div>
              )}

              {cameraActive && (
                <div className="w-full text-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="mx-auto max-h-[420px] w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={captureSelfie}
                    className="mt-5 bg-black px-7 py-3 text-xs font-bold uppercase text-white transition hover:bg-gray-800"
                  >
                    Take Photo
                  </button>
                </div>
              )}

              {capturedImage && (
                <div className="w-full text-center">
                  <img
                    src={capturedImage}
                    alt="Captured selfie"
                    className="mx-auto max-h-[420px] w-full object-contain"
                  />

                  <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={retakeSelfie}
                      className="border border-black px-6 py-3 text-xs font-bold uppercase transition hover:bg-black hover:text-white"
                    >
                      Retake
                    </button>

                    <button
                      type="button"
                      onClick={analyzeSelfie}
                      disabled={loading}
                      className="bg-black px-6 py-3 text-xs font-bold uppercase text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      {loading ? "Analyzing..." : "Use Selfie"}
                    </button>
                  </div>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* INSTRUCTIONS */}
            <aside className="border-t border-black bg-gray-100 p-7">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Camera Guidelines
              </p>

              <div className="mt-6 space-y-5 text-sm leading-6">
                <p>Keep your face centered in the camera frame.</p>
                <p>Use clear, even lighting.</p>
                <p>Remove anything covering your face.</p>
                <p>Look directly toward the camera.</p>
              </div>

              {error && <p className="mt-8 text-sm text-red-600">{error}</p>}
            </aside>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="flex items-center justify-between px-6 py-6 md:px-10">
        <button
          type="button"
          onClick={() => router.push("/results")}
          className="flex items-center gap-3 text-xs font-semibold uppercase"
        >
          <span className="flex h-9 w-9 rotate-45 items-center justify-center border border-black">
            <span className="-rotate-45">←</span>
          </span>
          Back
        </button>

        <button
          type="button"
          onClick={analyzeSelfie}
          disabled={!capturedImage || loading}
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
