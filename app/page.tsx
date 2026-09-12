"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Step = "landing" | "name" | "location";

export default function Home() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("landing");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validText = (value: string) => /^[A-Za-zÀ-ÿ' -]+$/.test(value.trim());

  const isNameValid = name.trim().length > 1 && validText(name);

  const isLocationValid = location.trim().length > 1 && validText(location);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!isNameValid || !isLocationValid) {
      setError("Please enter a valid name and location using letters only.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://us-central1-frontend-simplified.cloudfunctions.net/skinstricPhaseOne",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            location: location.trim(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Unable to submit your information.");
      }

      const data = await response.json();

      console.log("Phase One response:", data);

      localStorage.setItem(
        "skinstricUser",
        JSON.stringify({
          name: name.trim(),
          location: location.trim(),
        }),
      );

      router.push("/analysis");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setError("");

    if (step === "location") {
      setStep("name");
      return;
    }

    if (step === "name") {
      setStep("landing");
      return;
    }

    window.history.back();
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#FCFCFC] text-black">
      {/* HEADER */}
      <header className="relative z-20 flex items-center justify-between px-5 py-5 md:px-8">
        <div className="flex items-center gap-3">
          <h1 className="text-[11px] font-semibold uppercase tracking-tight">
            Skinstric
          </h1>

          <span className="text-[10px] uppercase text-gray-500">[ Intro ]</span>
        </div>

        {step === "landing" && (
          <button
            type="button"
            className="bg-black px-4 py-2 text-[9px] font-semibold uppercase text-white"
          >
            Enter Code
          </button>
        )}
      </header>

      {step === "landing" && (
        <>
          {/* LEFT LARGE DIAMOND */}
          <div className="pointer-events-none absolute left-[-180px] top-1/2 hidden h-[480px] w-[480px] -translate-y-1/2 rotate-45 border border-dotted border-gray-300 lg:block" />

          {/* RIGHT LARGE DIAMOND */}
          <div className="pointer-events-none absolute right-[-180px] top-1/2 hidden h-[480px] w-[480px] -translate-y-1/2 rotate-45 border border-dotted border-gray-300 lg:block" />

          {/* LANDING */}
          <section className="relative flex flex-1 items-center justify-center px-6">
            <button
              type="button"
              className="absolute left-5 top-1/2 hidden -translate-y-1/2 items-center gap-3 text-[9px] uppercase lg:flex"
            >
              <span className="flex h-7 w-7 rotate-45 items-center justify-center border border-black">
                <span className="-rotate-45">◇</span>
              </span>
              Discover A.I.
            </button>

            <div className="text-center">
              <h2 className="text-[54px] font-light leading-[0.95] tracking-[-0.05em] sm:text-[68px] md:text-[78px] lg:text-[88px]">
                Sophisticated
                <br />
                skincare
              </h2>

              <button
                type="button"
                onClick={() => setStep("name")}
                className="mt-12 inline-flex items-center gap-3 text-[10px] uppercase lg:absolute lg:right-5 lg:top-1/2 lg:mt-0 lg:-translate-y-1/2"
              >
                Take Test
                <span className="flex h-7 w-7 rotate-45 items-center justify-center border border-black">
                  <span className="-rotate-45">◇</span>
                </span>
              </button>
            </div>
          </section>

          <p className="max-w-[230px] px-5 pb-5 text-[8px] uppercase leading-3 md:px-8">
            Skinstric developed an A.I. that creates a highly-personalised
            routine tailored to what your skin needs.
          </p>
        </>
      )}

      {step === "name" && (
        <>
          <section className="relative flex flex-1 flex-col px-5 pt-2 md:px-8">
            <p className="text-[10px] font-semibold uppercase">
              To Start Analysis
            </p>

            <div className="flex flex-1 items-center justify-center">
              <div className="relative flex h-[360px] w-[360px] items-center justify-center sm:h-[430px] sm:w-[430px]">
                <div className="absolute h-[220px] w-[220px] rotate-45 border border-dotted border-gray-300 sm:h-[260px] sm:w-[260px]" />
                <div className="absolute h-[270px] w-[270px] rotate-45 border border-dotted border-gray-300 sm:h-[320px] sm:w-[320px]" />
                <div className="absolute h-[320px] w-[320px] rotate-45 border border-dotted border-gray-300 sm:h-[380px] sm:w-[380px]" />

                <div className="relative z-10 w-full max-w-[320px] text-center">
                  <p className="mb-2 text-[9px] uppercase text-gray-400">
                    Click to type
                  </p>

                  <input
                    type="text"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setError("");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && isNameValid) {
                        setStep("location");
                      }
                    }}
                    placeholder="Introduce Yourself"
                    autoFocus
                    autoComplete="name"
                    className="w-full border-b border-black bg-transparent px-2 py-1 text-center text-3xl font-light outline-none placeholder:text-black"
                  />
                </div>
              </div>
            </div>
          </section>

          <footer className="flex items-center justify-between px-5 py-5 md:px-8">
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-3 text-[9px] font-medium uppercase"
            >
              <span className="flex h-7 w-7 rotate-45 items-center justify-center border border-black">
                <span className="-rotate-45">←</span>
              </span>
              Back
            </button>

            <button
              type="button"
              disabled={!isNameValid}
              onClick={() => setStep("location")}
              className="flex items-center gap-3 text-[9px] font-medium uppercase disabled:cursor-not-allowed disabled:opacity-30"
            >
              Proceed
              <span className="flex h-7 w-7 rotate-45 items-center justify-center border border-black">
                <span className="-rotate-45">→</span>
              </span>
            </button>
          </footer>
        </>
      )}

      {step === "location" && (
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <section className="relative flex flex-1 flex-col px-5 pt-2 md:px-8">
            <p className="text-[10px] font-semibold uppercase">
              To Start Analysis
            </p>

            <div className="flex flex-1 items-center justify-center">
              <div className="relative flex h-[360px] w-[360px] items-center justify-center sm:h-[430px] sm:w-[430px]">
                <div className="absolute h-[220px] w-[220px] rotate-45 border border-dotted border-gray-300 sm:h-[260px] sm:w-[260px]" />
                <div className="absolute h-[270px] w-[270px] rotate-45 border border-dotted border-gray-300 sm:h-[320px] sm:w-[320px]" />
                <div className="absolute h-[320px] w-[320px] rotate-45 border border-dotted border-gray-300 sm:h-[380px] sm:w-[380px]" />

                <div className="relative z-10 w-full max-w-[320px] text-center">
                  <p className="mb-2 text-[9px] uppercase text-gray-400">
                    Where are you from?
                  </p>

                  <input
                    type="text"
                    value={location}
                    onChange={(event) => {
                      setLocation(event.target.value);
                      setError("");
                    }}
                    placeholder="Where are you from?"
                    autoFocus
                    autoComplete="address-level2"
                    className="w-full border-b border-black bg-transparent px-2 py-1 text-center text-3xl font-light outline-none placeholder:text-black"
                  />

                  {error && (
                    <p className="mt-5 text-xs text-red-600">{error}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <footer className="flex items-center justify-between px-5 py-5 md:px-8">
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-3 text-[9px] font-medium uppercase"
            >
              <span className="flex h-7 w-7 rotate-45 items-center justify-center border border-black">
                <span className="-rotate-45">←</span>
              </span>
              Back
            </button>

            <button
              type="submit"
              disabled={!isLocationValid || loading}
              className="flex items-center gap-3 text-[9px] font-medium uppercase disabled:cursor-not-allowed disabled:opacity-30"
            >
              {loading ? "Submitting..." : "Proceed"}
              <span className="flex h-7 w-7 rotate-45 items-center justify-center border border-black">
                <span className="-rotate-45">→</span>
              </span>
            </button>
          </footer>
        </form>
      )}
    </main>
  );
}
