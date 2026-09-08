"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, CornerDownLeft } from "lucide-react";
import type { CommandItem } from "./types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export function CommandPalette({
  isOpen,
  onClose,
  commands,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const lowerQuery = query.toLowerCase();
    return commands.filter((cmd) => {
      const matchTitle = cmd.title.toLowerCase().includes(lowerQuery);
      const matchSubtitle = cmd.subtitle?.toLowerCase().includes(lowerQuery);
      const matchCategory = cmd.category.toLowerCase().includes(lowerQuery);
      const matchKeywords = cmd.keywords?.some((k) =>
        k.toLowerCase().includes(lowerQuery)
      );
      return matchTitle || matchSubtitle || matchCategory || matchKeywords;
    });
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1)
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].perform();
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  const grouped = filteredCommands.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-100">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10"
        onKeyDown={handleKeyDown}
      >
        {/* Search header */}
        <div className="flex items-center px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800 gap-3">
          <Search className="w-5 h-5 text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search actions..."
            className="w-full bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 text-[15px] focus:outline-none"
          />
          <kbd className="px-2 py-0.5 text-xs font-semibold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-80 overflow-y-auto p-2"
        >
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-400">
              No matching commands found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="mb-2 last:mb-0">
                <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  {category}
                </div>
                {items.map((item) => {
                  const isCurrent = flatIndex === selectedIndex;
                  const itemIndex = flatIndex;
                  flatIndex++;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        item.perform();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-colors ${
                        isCurrent
                          ? "bg-blue-600 text-white"
                          : "text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/70"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {Icon && (
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isCurrent
                                ? "text-white"
                                : "text-neutral-500 dark:text-neutral-400"
                            }`}
                          />
                        )}
                        <div className="truncate">
                          <span className="text-sm font-medium">{item.title}</span>
                          {item.subtitle && (
                            <span
                              className={`ml-2 text-xs truncate ${
                                isCurrent
                                  ? "text-blue-100"
                                  : "text-neutral-400 dark:text-neutral-500"
                              }`}
                            >
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                      </div>
                      {item.shortcut && (
                        <kbd
                          className={`text-xs px-2 py-0.5 rounded-md font-mono font-medium shrink-0 ${
                            isCurrent
                              ? "bg-blue-700 text-blue-100"
                              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700"
                          }`}
                        >
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950/60 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-800 rounded mr-1 text-[10px]">
                ↑↓
              </kbd>
              to navigate
            </span>
            <span className="flex items-center">
              <CornerDownLeft className="w-3 h-3 mr-1 inline" />
              to select
            </span>
          </div>
          <span className="text-[11px]">Mailflare Actions</span>
        </div>
      </div>
    </div>
  );
}
