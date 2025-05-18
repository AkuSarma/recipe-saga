
"use client"; // To use new Date() for the year

import React from 'react';

export function Footer() {
  const [currentYear, setCurrentYear] = React.useState<number | null>(null);

  React.useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="w-full border-t border-border/40 py-6 bg-black">
      <div className="container mx-auto text-center text-sm text-gray-300">
        {currentYear !== null ? (
          <p>&copy; {currentYear} MoodMunch. All rights reserved.</p>
        ) : (
          <p>&copy; MoodMunch. All rights reserved.</p> // Fallback if year isn't set yet
        )}
      </div>
    </footer>
  );
}
