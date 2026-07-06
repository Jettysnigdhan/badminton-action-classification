"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Premium custom gooey cursor with spring physics, lerp, and SVG filters.
// Built for high performance using native requestAnimationFrame without heavy external libraries.
export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  
  const dotRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);
  
  const mouse = useRef({ x: -100, y: -100 });
  const dot = useRef({ x: -100, y: -100, scale: 1 });
  const blob = useRef({ x: -100, y: -100, vx: 0, vy: 0, angle: 0, scale: 1 });
  const state = useRef({ isHovering: false, isClicking: false, isVisible: false, isDashboard: false });
  const rafId = useRef<number>(0);
  const pathname = usePathname();
  
  useEffect(() => {
    state.current.isDashboard = !!(pathname?.includes('/dashboard') || pathname?.includes('/app'));
  }, [pathname]);
  
  useEffect(() => {
    // Only enable on devices with a fine pointer (e.g. mouse, not touch)
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);
    
    document.documentElement.classList.add("has-custom-cursor");
    
    // Read CSS variables for physics customization
    const rootStyle = getComputedStyle(document.documentElement);
    const getNumVar = (name: string, fallback: number) => {
      const val = rootStyle.getPropertyValue(name).trim();
      return val ? parseFloat(val) : fallback;
    };
    
    // Update physics variables based on CSS
    let stiffness = getNumVar('--cursor-stiffness', 0.15);
    let damping = getNumVar('--cursor-damping', 0.75);
    let hoverScale = getNumVar('--cursor-hover-scale', 1.5);
    let blobHoverScale = getNumVar('--cursor-blob-hover-scale', 1.3);
    let clickScale = getNumVar('--cursor-click-scale', 0.6);
    
    // Re-read variables on window resize to allow responsive customization
    const onResize = () => {
      const rs = getComputedStyle(document.documentElement);
      const v = (name: string, f: number) => parseFloat(rs.getPropertyValue(name).trim()) || f;
      stiffness = v('--cursor-stiffness', 0.15);
      damping = v('--cursor-damping', 0.75);
      hoverScale = v('--cursor-hover-scale', 1.5);
      blobHoverScale = v('--cursor-blob-hover-scale', 1.3);
      clickScale = v('--cursor-click-scale', 0.6);
    };
    window.addEventListener('resize', onResize);
    
    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      if (!state.current.isVisible) {
        state.current.isVisible = true;
        setVisible(true);
        // Snap to position on first move to prevent flying in from origin
        dot.current.x = e.clientX;
        dot.current.y = e.clientY;
        blob.current.x = e.clientX;
        blob.current.y = e.clientY;
      }
      
      const target = e.target as HTMLElement;
      const interactive = target.closest?.('a, button, input, textarea, select, label, [role="button"], [role="switch"], [data-cursor="interactive"]');
      state.current.isHovering = !!interactive;
    };
    
    const onMouseDown = () => { state.current.isClicking = true; };
    const onMouseUp = () => { state.current.isClicking = false; };
    const onMouseLeave = () => { 
      state.current.isVisible = false; 
      setVisible(false);
    };
    const onMouseEnter = () => { 
      state.current.isVisible = true; 
      setVisible(true);
    };
    
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);
    
    const render = () => {
      const m = mouse.current;
      const d = dot.current;
      const b = blob.current;
      const s = state.current;
      
      // Fast lerp for dot
      d.x += (m.x - d.x) * 0.4;
      d.y += (m.y - d.y) * 0.4;
      
      // Spring physics for trailing blob
      const dx = d.x - b.x;
      const dy = d.y - b.y;
      
      b.vx += dx * stiffness;
      b.vy += dy * stiffness;
      b.vx *= damping;
      b.vy *= damping;
      
      b.x += b.vx;
      b.y += b.vy;
      
      // Velocity-based stretching for liquid effect
      const speed = Math.hypot(b.vx, b.vy);
      const stretch = 1 + speed * 0.04;
      const squash = 1 - Math.min(speed * 0.015, 0.4);
      
      // Orient blob towards movement direction
      if (speed > 0.1) {
        b.angle = Math.atan2(b.vy, b.vx);
      }
      
      // Optional idle breathing animation
      const time = performance.now() * 0.002;
      const idleScale = speed < 0.2 && !s.isHovering && !s.isClicking 
        ? 1 + Math.sin(time) * 0.05 
        : 1;
        
      // Smaller base scale on dashboard
      const baseScale = s.isDashboard ? 0.6 : 1;
        
      // Dynamic scaling transitions
      const targetDotScale = (s.isClicking ? clickScale : (s.isHovering ? hoverScale : 1)) * idleScale * baseScale;
      const targetBlobScale = (s.isClicking ? clickScale + 0.1 : (s.isHovering ? blobHoverScale : 1)) * baseScale;
      
      d.scale += (targetDotScale - d.scale) * 0.2;
      b.scale += (targetBlobScale - b.scale) * 0.2;
      
      // Update DOM via refs for high performance 60fps rendering
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${d.x}px, ${d.y}px, 0) scale(${d.scale})`;
      }
      if (blobRef.current) {
        blobRef.current.style.transform = `translate3d(${b.x}px, ${b.y}px, 0) rotate(${b.angle}rad) scaleX(${stretch * b.scale}) scaleY(${squash * b.scale})`;
      }
      
      rafId.current = requestAnimationFrame(render);
    };
    
    rafId.current = requestAnimationFrame(render);
    
    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener('resize', onResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      cancelAnimationFrame(rafId.current);
    };
  }, []);
  
  if (!enabled) return null;
  
  // Custom CSS block integrated within the component for portability and easy customization
  return (
    <>
      <style>{`
        :root {
          --cursor-color: white;
          --cursor-dot-size: 8px;
          --cursor-blob-size: 20px;
          --cursor-stiffness: 0.15;
          --cursor-damping: 0.75;
          --cursor-hover-scale: 1.5;
          --cursor-blob-hover-scale: 1.3;
          --cursor-click-scale: 0.6;
        }
        
        .has-custom-cursor,
        .has-custom-cursor * {
          cursor: none !important;
        }

        .cursor-goo-filter {
          position: absolute;
          width: 0;
          height: 0;
          pointer-events: none;
        }

        .cursor-wrapper {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9999;
          filter: url('#cursor-goo');
          will-change: opacity;
        }

        .cursor-dot {
          position: absolute;
          left: 0;
          top: 0;
          width: var(--cursor-dot-size);
          height: var(--cursor-dot-size);
          background-color: var(--cursor-color);
          border-radius: 50%;
          margin-left: calc(var(--cursor-dot-size) / -2);
          margin-top: calc(var(--cursor-dot-size) / -2);
          transform-origin: center;
          will-change: transform;
        }

        .cursor-blob {
          position: absolute;
          left: 0;
          top: 0;
          width: var(--cursor-blob-size);
          height: var(--cursor-blob-size);
          background-color: var(--cursor-color);
          border-radius: 50%;
          margin-left: calc(var(--cursor-blob-size) / -2);
          margin-top: calc(var(--cursor-blob-size) / -2);
          transform-origin: center;
          will-change: transform;
        }
      `}</style>

      {/* SVG Gooey Filter definition */}
      <svg className="cursor-goo-filter" aria-hidden="true">
        <defs>
          <filter id="cursor-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix 
              in="blur" 
              mode="matrix" 
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" 
              result="goo" 
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
          </filter>
        </defs>
      </svg>

      <div
        aria-hidden="true"
        className="cursor-wrapper mix-blend-difference"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      >
        <div ref={blobRef} className="cursor-blob" />
        <div ref={dotRef} className="cursor-dot" />
      </div>
    </>
  );
}
