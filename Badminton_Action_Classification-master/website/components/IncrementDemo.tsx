"use client";

import { useState } from "react";

export function IncrementDemo() {
  const [count, setCount] = useState(0);

  return (
    <section className="mx-auto my-10 w-full max-w-5xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
            Demo
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">
            Basic increment button
          </h2>
          <p className="mt-2 text-gray-600">
            This simple React example uses a white card and updates the count with a single click.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl font-bold text-gray-900">
            {count}
          </div>
          <button
            type="button"
            onClick={() => setCount((value) => value + 1)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-900 transition hover:bg-gray-50"
          >
            Increment
          </button>
        </div>
      </div>
    </section>
  );
}
