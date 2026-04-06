"use client";

import { useEffect, useState } from "react";

type Mitra = {
  id: string;
  name: string;
};

export default function MitraSelect({
  value,
  onChange,
  mitraList,
}: {
  value: string | null;
  onChange: (id: string) => void;
  mitraList: Mitra[];
}) {
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState<Mitra[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const result = mitraList.filter((m) =>
      m.name.toLowerCase().includes(query.toLowerCase()),
    );
    setFiltered(result);
    setActiveIndex(0);
  }, [query, mitraList]);

  const highlight = (text: string) => {
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-yellow-200">
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    }
    if (e.key === "ArrowUp") {
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    }
    if (e.key === "Enter") {
      const selected = filtered[activeIndex];
      if (selected) {
        onChange(selected.id);
        setQuery(selected.name);
      }
    }
  };

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Cari mitra..."
        className="w-full border rounded p-3"
      />

      {filtered.length > 0 && (
        <div className="absolute z-10 bg-white border w-full mt-1 rounded shadow">
          {filtered.map((m, i) => (
            <div
              key={m.id}
              onClick={() => {
                onChange(m.id);
                setQuery(m.name);
              }}
              className={`p-3 cursor-pointer ${
                i === activeIndex ? "bg-gray-200" : ""
              }`}
            >
              {highlight(m.name)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
