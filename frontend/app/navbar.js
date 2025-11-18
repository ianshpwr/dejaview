"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 w-full border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex h-16 lg:h-20 items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center gap-3 lg:gap-4 text-lg lg:text-2xl font-bold text-gray-900"
            >
              {/* SVG logo */}
              <svg
                className="h-8 w-8 lg:h-12 lg:w-12 text-primary"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  clipRule="evenodd"
                  fillRule="evenodd"
                  fill="currentColor"
                  d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z"
                />
              </svg>

              <span>DejaView</span>
            </Link>
          </div>

          {/* Right: navigation + CTA */}
          <div className="flex items-center gap-3 lg:gap-6">
            <nav className="hidden sm:flex items-center gap-4 lg:gap-8">
              <Link
                href="/entries"
                className="text-sm lg:text-lg font-medium text-gray-700 hover:text-gray-900"
              >
                All Entries
              </Link>
              <Link
                href="/analytics"
                className="text-sm lg:text-lg font-medium text-gray-700 hover:text-gray-900"
              >
                Analytics
              </Link>
              <Link
                href="/settings"
                className="text-sm lg:text-lg font-medium text-gray-700 hover:text-gray-900"
              >
                Settings
              </Link>
            </nav>

<Link
  href="/profile"
  className="inline-flex items-center justify-center rounded-full bg-gray-100 p-2 lg:p-3 hover:bg-gray-200 transition shadow-sm"
>
  {/* Modern profile icon */}
  <svg
    className="h-6 w-6 lg:h-7 lg:w-7 text-gray-700"
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.33 0-10 1.667-10 5v3h20v-3c0-3.333-6.67-5-10-5z"/>
  </svg>
</Link>

          </div>
        </div>
      </div>
    </header>
  );
}
