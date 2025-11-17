import React from 'react';

export default function DejaViewLanding() {
  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light group/design-root overflow-hidden font-display">
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 items-center justify-center p-4 sm:p-6 md:p-8">
          <div className="layout-content-container flex flex-col max-w-2xl flex-1 items-center">
            <div className="@container w-full">
              <div className="flex flex-col items-center gap-8 px-4 py-10 text-center">
                <div
                  className="w-full max-w-md bg-center bg-no-repeat aspect-square bg-cover rounded-xl"
                  data-alt="Abstract, dreamy swirls in soft shades of lavender, teal, and off-white, suggesting memories and thoughts."
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAY4sIK66C6GWjpEE3W74zw1GnRPjQ7Nz0z11KBy0fz_j7e4QYXfPKWmP6s_8UrX1L02Gr018R3ScxlRY4qEh76wS4-w1s2YHzyV-pCg8AxYOvkVsCzTJ7OszmgKFraZKkcY0KGVuXmHiz5gFUX1H_thdYAJTf7XkO2SQle9KTeJJDZqJhbHEbibzMgEGMJ8-4JlyKnfJBLKnVjnTSA5dmOl_NLk18LvKV-dU5gbmBiBiYqr7hh8i4SbIzoWGZhUBQJ0fCgqkTw0Jg")',
                  }}
                ></div>
                <div className="flex flex-col gap-6 items-center">
                  <div className="flex flex-col gap-2">
                    <h1 className="text-[#333333] text-5xl font-black leading-tight tracking-tighter sm:text-6xl">
                      DejaView
                    </h1>
                    <h2 className="text-[#333333] text-base font-normal leading-normal sm:text-lg">
                      Your memories, rediscovered.
                    </h2>
                  </div>
                  <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-8 bg-primary text-white text-base font-bold leading-normal tracking-wide transition-colors hover:bg-opacity-90">
                    <span className="truncate">Get Started</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}