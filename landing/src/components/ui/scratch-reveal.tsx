"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";

interface ScratchRevealProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  minScratchPercentage?: number; // % to auto-reveal
  onRevealComplete?: () => void;
  className?: string;
  brushSize?: number;
}

export const ScratchReveal = ({
  children,
  width = 300,
  height = 150,
  minScratchPercentage = 50,
  onRevealComplete,
  className,
  brushSize = 20,
}: ScratchRevealProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize Canvas Overlay
    ctx.fillStyle = "#e4e4e7"; // zinc-200 or custom gold?
    // Let's use a nice gold/silver gradient if possible, but simple color first
    ctx.fillRect(0, 0, width, height);

    // Add "Scratch Me" text
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#71717a"; // zinc-500
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Grattez pour découvrir", width / 2, height / 2);
  }, [width, height]);

  const checkRevealProgress = () => {
    if (isRevealed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    let transparentPixels = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] === 0) {
        transparentPixels++;
      }
    }

    const percentage = (transparentPixels / (pixels.length / 4)) * 100;
    if (percentage > minScratchPercentage) {
      setIsRevealed(true);
      onRevealComplete?.();
    }
  };

  const scratch = (x: number, y: number) => {
    if (isRevealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, 2 * Math.PI);
    ctx.fill();

    checkRevealProgress();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || isRevealed) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    scratch(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (isRevealed) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    scratch(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  return (
    <div
      className={cn("relative select-none", className)}
      style={{ width, height }}
    >
      {/* Hidden Content */}
      <div className='absolute inset-0 flex items-center justify-center z-0 overflow-hidden'>
        {children}
      </div>

      {/* Canvas Overlay */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={cn(
          "absolute inset-0 z-10 touch-none transition-opacity duration-700 cursor-crosshair",
          isRevealed ? "opacity-0 pointer-events-none" : "opacity-100",
        )}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      />
    </div>
  );
};
