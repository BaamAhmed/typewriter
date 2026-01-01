"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getRandomPrompt } from "./prompts";

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

const LINE_HEIGHT = 24;

export default function Typewriter() {
  const [lines, setLines] = useState<string[]>([""]);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [showKeys, setShowKeys] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [hasCheckedDevice, setHasCheckedDevice] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if device is desktop and initialize dark mode from system preference
  useEffect(() => {
    const checkDevice = () => {
      const isMobileOrTablet =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth < 768;
      setIsDesktop(!isMobileOrTablet);
      setHasCheckedDevice(true);
    };

    // Initialize dark mode from system preference
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setDarkMode(prefersDark);

    // Initialize with a random prompt to help overcome blank page anxiety
    const prompt = getRandomPrompt();
    const promptLines = prompt.split("\n");
    // Add a gentle hint at the end
    promptLines.push("");
    promptLines.push("—");
    promptLines.push("");
    promptLines.push(
      "(We know blank pages can be intimidating. Press Cmd+Backspace or Ctrl+Backspace to clear everything and start fresh.)"
    );
    promptLines.push("");
    setLines(promptLines);

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [darkMode]);

  // Scroll to cursor when typing
  const scrollToCursor = useCallback(() => {
    if (cursorRef.current && containerRef.current) {
      const container = containerRef.current;
      const cursor = cursorRef.current;
      const containerRect = container.getBoundingClientRect();
      const cursorRect = cursor.getBoundingClientRect();

      const cursorRelativeTop = cursorRect.top - containerRect.top;
      const visibleHeight = containerRect.height - 160;
      const targetPosition = visibleHeight * 0.6;

      if (cursorRelativeTop > visibleHeight || cursorRelativeTop < 100) {
        container.scrollTo({
          top: container.scrollTop + cursorRelativeTop - targetPosition,
          behavior: "smooth",
        });
      }
    }
  }, []);

  // Initialize audio
  useEffect(() => {
    if (!isDesktop) return;
    const initAudio = async () => {
      try {
        audioContextRef.current = new AudioContext();
        const response = await fetch("/typewriter-key.wav");
        const arrayBuffer = await response.arrayBuffer();
        audioBufferRef.current = await audioContextRef.current.decodeAudioData(
          arrayBuffer
        );
      } catch (error) {
        console.error("Failed to load audio:", error);
      }
    };
    initAudio();

    return () => {
      audioContextRef.current?.close();
    };
  }, [isDesktop]);

  const playSound = useCallback(() => {
    if (!soundEnabled) return;
    if (audioContextRef.current && audioBufferRef.current) {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.playbackRate.value = 0.95 + Math.random() * 0.1;
      source.connect(audioContextRef.current.destination);
      source.start();
    }
  }, [soundEnabled]);

  const downloadText = useCallback(() => {
    const text = lines.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "typewriter.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [lines]);

  const handleKeyPress = useCallback(
    (key: string, originalKey: string) => {
      playSound();
      scrollToCursor();

      setLines((prevLines) => {
        const newLines = [...prevLines];
        const currentLineIndex = newLines.length - 1;
        const currentLine = newLines[currentLineIndex];

        if (key === "ENTER") {
          newLines.push("");
        } else if (key === "BACKSPACE") {
          if (currentLine.length > 0) {
            newLines[currentLineIndex] = currentLine.slice(0, -1);
          } else if (newLines.length > 1) {
            newLines.pop();
          }
        } else if (key === "SPACE") {
          newLines[currentLineIndex] = currentLine + " ";
        } else if (originalKey.length === 1) {
          newLines[currentLineIndex] = currentLine + originalKey;
        }

        return newLines;
      });

      setTimeout(scrollToCursor, 10);
    },
    [playSound, scrollToCursor]
  );

  // Keyboard event handlers
  useEffect(() => {
    if (!isDesktop) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle settings with Escape
      if (e.key === "Escape") {
        setShowSettings((prev) => !prev);
        return;
      }

      // Don't process typing when settings is open
      if (showSettings) return;

      // Clear all text with Cmd+Backspace or Ctrl+Backspace
      if (e.key === "Backspace" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setLines([""]);
        if (containerRef.current) {
          containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }

      // Resume audio context if suspended
      if (audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume();
      }

      const key = e.key.toUpperCase();

      // Prevent default for handled keys
      if (
        e.key.length === 1 ||
        e.key === "Enter" ||
        e.key === "Backspace" ||
        e.key === " "
      ) {
        e.preventDefault();
      }

      let mappedKey = key;
      if (e.key === "Enter") mappedKey = "ENTER";
      else if (e.key === "Backspace") mappedKey = "BACKSPACE";
      else if (e.key === " ") mappedKey = "SPACE";

      if (!pressedKeys.has(mappedKey)) {
        setPressedKeys((prev) => new Set(prev).add(mappedKey));

        const allKeys = [
          ...KEYBOARD_ROWS.flat(),
          "SPACE",
          "ENTER",
          "BACKSPACE",
        ];
        if (allKeys.includes(mappedKey) || e.key.length === 1) {
          handleKeyPress(mappedKey, e.key);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      let mappedKey = e.key.toUpperCase();
      if (e.key === "Enter") mappedKey = "ENTER";
      else if (e.key === "Backspace") mappedKey = "BACKSPACE";
      else if (e.key === " ") mappedKey = "SPACE";

      setPressedKeys((prev) => {
        const next = new Set(prev);
        next.delete(mappedKey);
        return next;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [pressedKeys, handleKeyPress, showSettings, isDesktop]);

  // Don't render until we've checked the device
  if (!hasCheckedDevice) {
    return null;
  }

  // Show mobile/tablet message
  if (!isDesktop) {
    return (
      <main className="h-screen w-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2 text-ink">typewriter</h1>
          <p className="text-sm text-ink/60">
            This experience is designed for desktop computers with a physical
            keyboard.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-screen overflow-hidden relative">
      {/* Header text - top left */}
      <div className="absolute top-6 left-6 z-10 opacity-30">
        <h1 className="text-lg font-bold text-ink">typewriter</h1>
        <p className="text-xs text-ink mt-1">
          Press ESC for settings & download
        </p>
        <p className="text-xs text-ink">Press Cmd/Ctrl + Backspace to clear</p>
      </div>

      {/* Paper container - scrollable */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-y-auto flex justify-center pt-8 px-4 pb-40"
      >
        <div
          className="paper w-full max-w-[850px] p-10 rounded-3xl"
          style={{
            minHeight: `calc(100vh + ${Math.max(
              0,
              lines.length * LINE_HEIGHT
            )}px)`,
          }}
        >
          {/* Typed content */}
          <div className="font-mono text-sm leading-6">
            {lines.map((line, lineIndex) => (
              <div
                key={lineIndex}
                className="paper-line whitespace-pre-wrap wrap-break-word"
              >
                {line}
                {lineIndex === lines.length - 1 && (
                  <span ref={cursorRef} className="caret">
                    _
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Keyboard - absolutely positioned at bottom, on top of paper */}
      {showKeys && (
        <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center gap-1 pb-6 pt-4">
          {KEYBOARD_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1">
              {rowIndex === 2 && (
                <div
                  className={`key wide ${
                    pressedKeys.has("BACKSPACE") ? "pressed" : ""
                  }`}
                >
                  ←
                </div>
              )}
              {row.map((key) => (
                <div
                  key={key}
                  className={`key ${pressedKeys.has(key) ? "pressed" : ""}`}
                >
                  {key}
                </div>
              ))}
              {rowIndex === 2 && (
                <div
                  className={`key wide ${
                    pressedKeys.has("ENTER") ? "pressed" : ""
                  }`}
                >
                  ↵
                </div>
              )}
            </div>
          ))}
          {/* Space bar */}
          <div className="flex gap-1">
            <div
              className={`key space ${
                pressedKeys.has("SPACE") ? "pressed" : ""
              }`}
            />
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20">
          <div className="bg-paper rounded-2xl p-8 shadow-xl max-w-sm w-full mx-4">
            <h2 className="text-lg font-bold mb-6 text-ink">Settings</h2>

            <div className="space-y-4">
              {/* Show/Hide Keys */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-ink">Show keyboard</span>
                <button
                  onClick={() => setShowKeys(!showKeys)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    showKeys ? "bg-ink" : "bg-ink/20"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-paper shadow transition-transform ${
                      showKeys ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>

              {/* Sound On/Off */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-ink">Sound effects</span>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    soundEnabled ? "bg-ink" : "bg-ink/20"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-paper shadow transition-transform ${
                      soundEnabled ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>

              {/* Dark Mode */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-ink">Dark mode</span>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    darkMode ? "bg-ink" : "bg-ink/20"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-paper shadow transition-transform ${
                      darkMode ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>
            </div>

            {/* Download - with extra top margin */}
            <button
              onClick={downloadText}
              className="w-full py-2 px-4 bg-ink text-paper rounded-lg text-sm font-medium hover:opacity-80 transition-opacity mt-8"
            >
              Download as .txt
            </button>

            <p className="text-xs text-ink/50 mt-6 text-center">
              Press ESC to close
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
