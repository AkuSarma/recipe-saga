
"use client"; // To use new Date() for the year

import React from 'react';
import Link from 'next/link';


export function Footer() {
  const [currentYear, setCurrentYear] = React.useState<number | null>(null);

  React.useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="w-full border-t border-border/40 py-6 bg-black">
      <div className="container mx-auto text-center text-sm text-gray-300">
        {currentYear !== null ? (
          <p>&copy; {currentYear}  <Link href="https://github.com/AkuSarma" target="_blank" rel="noopener noreferrer">
          MoodMunch
        </Link>. All rights reserved.</p>
        ) : (
          <p>&copy; <Link href="https://github.com/AkuSarma" target="_blank" rel="noopener noreferrer">
          MoodMunch
        </Link>. All rights reserved.</p>
        )}
      </div>
    </footer>
  );
}
