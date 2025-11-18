"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 w-full border-b border-gray-300 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Left: Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3">
              <svg
                className="h-8 w-8 text-black"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  clipRule="evenodd"
                  d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z"
                  fill="currentColor"
                  fillRule="evenodd"
                />
              </svg>
              <span className="text-xl font-bold text-black">DejaView</span>
            </Link>
          </div>

          {/* Right: Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-8">
            <Link href="/entries" className="text-sm font-medium text-black hover:text-gray-700">
              All Entries
            </Link>
            <Link href="/analytics" className="text-sm font-medium text-black hover:text-gray-700">
              Analytics
            </Link>
            <Link href="/settings" className="text-sm font-medium text-black hover:text-gray-700">
              Settings
            </Link>
            <Link
              href="/new"
              className="inline-flex items-center rounded-lg border border-black bg-white px-4 py-2 text-sm font-semibold text-black shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black/20"
            >
              + New Memory
            </Link>
          </div>

          {/* Hamburger for Mobile */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-black hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black/20"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="sm:hidden px-2 pt-2 pb-3 space-y-1 border-t border-gray-300 bg-white">
          <Link
            href="/entries"
            className="block px-3 py-2 text-base font-medium text-black hover:bg-gray-100 rounded-md"
          >
            All Entries
          </Link>
          <Link
            href="/analytics"
            className="block px-3 py-2 text-base font-medium text-black hover:bg-gray-100 rounded-md"
          >
            Analytics
          </Link>
          <Link
            href="/settings"
            className="block px-3 py-2 text-base font-medium text-black hover:bg-gray-100 rounded-md"
          >
            Settings
          </Link>
          <Link
            href="/new"
            className="block px-3 py-2 text-base font-medium border border-black rounded-md text-black hover:bg-gray-100"
          >
            + New Memory
          </Link>
        </div>
      )}
    </header>
  );
}
