"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center p-4 bg-gray-900 text-white">
      <div>
        <Link href="/" className="text-xl font-bold">
          MyApp
        </Link>
      </div>
      <div>
        <Link href="/auth" className="mr-4 hover:underline">
          Login
        </Link>
        <Link
          href="/auth"
          className="bg-blue-600 px-4 py-2 rounded text-white font-bold hover:bg-blue-700"
        >
          Sign Up
        </Link>
      </div>
    </nav>
  );
}
