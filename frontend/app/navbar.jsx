"use client";

import React from "react";
import Link from "next/link";

function Navbar() {
  const navStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2rem",
    backgroundColor: "#222",
    color: "white",
  };

  const linkStyle = {
    color: "white",
    textDecoration: "none",
    marginLeft: "1rem",
    fontSize: "1rem",
  };

  const buttonStyle = {
    backgroundColor: "#0070f3",
    color: "white",
    textDecoration: "none",
    marginLeft: "1rem",
    padding: "0.5rem 1rem",
    borderRadius: "5px",
    fontWeight: "bold",
  };

  return (
    <nav style={navStyle}>
      {/* Left Side: Brand/Home Link */}
      <div>
        <Link href="/" style={{ ...linkStyle, fontSize: "1.5rem", fontWeight: "bold" }}>
          MyApp
        </Link>
      </div>

      {/* Right Side: Auth Links */}
      <div>
        <Link href="/auth" style={linkStyle}>
          Login
        </Link>
        <Link href="/auth" style={buttonStyle}>
          Sign Up
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
