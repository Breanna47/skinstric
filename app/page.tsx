"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validText = (value: string) => /^[A-Za-zÀ-ÿ' -]+$/.test(value.trim());

  const isFormValid =
    name.trim().length > 1 &&
    location.trim().length > 1 &&
    validText(name) &&
    validText(location);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!isFormValid) {
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

  return (
    <main className="flex min-h-screen flex-col bg-white text-black">
      {/* HEADER */}
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-bold uppercase tracking-tight">
            Skinstric
          </h1>

          <span className="hidden text-xs uppercase text-gray-500 sm:block">
            [ Intro ]
          </span>
        </div>

        <button
          type="button"
          className="bg-black px-4 py-2 text-xs font-semibold uppercase text-white"
        >
          Enter Code
        </button>
      </header>

      {/* FORM */}
      <section className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-lg text-center">
          <p className="mb-5 text-xs font-semibold uppercase">
            To Start Analysis
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <label
                htmlFor="name"
                className="mb-2 block text-xs uppercase text-gray-400"
              >
                Click to type
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                placeholder="Introduce yourself"
                autoComplete="name"
                className="w-full border-b border-black bg-transparent px-2 py-3 text-center text-3xl font-normal outline-none placeholder:text-gray-500"
              />
            </div>

            <div className="mb-8">
              <label
                htmlFor="location"
                className="mb-2 block text-xs uppercase text-gray-400"
              >
                Your location
              </label>

              <input
                id="location"
                type="text"
                value={location}
                onChange={(event) => {
                  setLocation(event.target.value);
                  setError("");
                }}
                placeholder="Where are you from?"
                autoComplete="address-level2"
                className="w-full border-b border-black bg-transparent px-2 py-3 text-center text-3xl font-normal outline-none placeholder:text-gray-500"
              />
            </div>

            {error && <p className="mb-6 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="border border-black px-7 py-3 text-xs font-bold uppercase transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-300 disabled:hover:bg-transparent"
            >
              {loading ? "Submitting..." : "Proceed"}
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER CONTROLS */}
      <footer className="flex items-center justify-between px-6 py-6 md:px-10">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="flex items-center gap-3 text-xs font-semibold uppercase"
        >
          <span className="flex h-9 w-9 rotate-45 items-center justify-center border border-black">
            <span className="-rotate-45">←</span>
          </span>
          Back
        </button>

        <button
          type="button"
          disabled={!isFormValid || loading}
          onClick={() => {
            const form = document.querySelector("form");
            form?.requestSubmit();
          }}
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
