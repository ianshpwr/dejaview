function DashboardPage() {
  return (<div>Dashboard</div>);
}

export default DashboardPage;
// "use client";
// import React from "react";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// export default function DashboardPage() {
//   const [journalEntries, setJournalEntries] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const router = useRouter();

//   // Get user using /verify backend route
//   const getUserFromToken = async () => {
//     if (typeof window === "undefined") return null;

//     const token = localStorage.getItem("token");
//     if (!token) return null;

//     try {
//       const res = await fetch(
//         "https://dejaview-l2o0.onrender.com/auth/verify",
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       if (!res.ok) return null;

//       const data = await res.json();
//       return data.user; // { id, name, email }
//     } catch {
//       return null;
//     }
//   };

//   const fetchEntries = async () => {
//     try {
//       const user = await getUserFromToken();

//       if (!user) {
//         router.push("/");
//         return;
//       }

//       const res = await fetch(
//         `https://dejaview-l2o0.onrender.com/journal/entries/${user.id}`
//       );

//       const data = await res.json();

//       if (!res.ok) throw new Error(data.message || "Failed to load entries");

//       setJournalEntries(data.entries || []);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (typeof window === "undefined") return;

//     const token = localStorage.getItem("token");
//     if (!token) {
//       router.push("/");
//       return;
//     }

//     fetchEntries();
//   }, []);

//   return (
//     <div className="min-h-screen bg-background-light dark:bg-background-dark text-[#111118] dark:text-white/90">
      
//       {/* Header */}
//       <header className="sticky top-0 border-b border-gray-200 dark:border-gray-700 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4">
//         <div className="max-w-7xl mx-auto flex justify-between items-center">
//           <h2 className="text-xl font-bold">DejaView</h2>
//           <button className="px-4 py-2 bg-primary text-white rounded-lg font-bold">
//             + New Memory
//           </button>
//         </div>
//       </header>

//       {/* Main Content */}
//       <main className="max-w-3xl mx-auto p-6">
//         <h1 className="text-4xl font-black mb-6">All Entries</h1>

//         {loading && <p>Loading...</p>}
//         {error && <p className="text-red-500">{error}</p>}

//         <div className="flex flex-col gap-6">
//           {journalEntries.map((entry) => (
//             <div
//               key={entry.id}
//               className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 border dark:border-gray-800"
//             >
//               <p className="text-sm text-gray-500 dark:text-gray-400">
//                 {new Date(entry.createdAt).toLocaleDateString()}
//               </p>

//               <p className="text-lg font-bold mt-1">{entry.title}</p>

//               <p className="text-gray-600 dark:text-gray-300 mt-2">
//                 {entry.content}
//               </p>

//               <span className="inline-block mt-3 px-3 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
//                 {entry.mood || "Memory"}
//               </span>
//             </div>
//           ))}

//           {!loading && journalEntries.length === 0 && (
//             <p className="text-center text-gray-500">No entries found.</p>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }
