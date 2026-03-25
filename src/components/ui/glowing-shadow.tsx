"use client"

import { type ReactNode } from "react"

interface GlowingShadowButtonProps {
  children: ReactNode
}

export function GlowingShadow({ children }: GlowingShadowButtonProps) {
  return (
    <>
      <style jsx>{`
        @property --hue {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --rotate {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --bg-y {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --bg-x {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --glow-translate-y {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --bg-size {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --glow-opacity {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --glow-blur {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --glow-scale {
          syntax: "<number>";
          inherits: true;
          initial-value: 2;
        }
        @property --glow-radius {
          syntax: "<number>";
          inherits: true;
          initial-value: 2;
        }
        @property --white-shadow {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }

        .glow-container {
          --card-color: rgb(var(--surface));
          --text-color: rgb(var(--foreground));
          --card-radius: 1.5rem;
          --border-width: 2px;
          --bg-size: 1;
          --hue: 0;
          --hue-speed: 1;
          --rotate: 0;
          --animation-speed: 4s;
          --interaction-speed: 0.55s;
          --glow-scale: 1.5;
          --scale-factor: 1;
          --glow-blur: 6;
          --glow-opacity: 1;
          --glow-radius: 100;
          --glow-rotate-unit: 1deg;

          width: 100%;
          height: 100%;
          color: var(--text-color);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
          border-radius: var(--card-radius);
          cursor: pointer;
        }

        .glow-container:before,
        .glow-container:after {
          content: "";
          display: block;
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: var(--card-radius);
        }

        .glow-content {
          position: relative;
          width: calc(100% - var(--border-width));
          height: calc(100% - var(--border-width));
          background: var(--card-color);
          border-radius: calc(var(--card-radius) - var(--border-width));
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
          isolation: isolate; 
          
          /* Moved shadow here so the mask doesn't clip it */
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03);
        }

        :global(.dark) .glow-content {
          isolation: auto;
          /* Moved dark mode shadow here */
          box-shadow: 0 0 20px black;
        }

        .glow-content:before {
          content: "";
          display: block;
          position: absolute;
          inset: calc(var(--border-width) * -1);
          border-radius: var(--card-radius);
          z-index: -1;
          background: #f0f0f0 radial-gradient(
            30% 30% at calc(var(--bg-x) * 1%) calc(var(--bg-y) * 1%),
            hsl(calc(var(--hue) * var(--hue-speed) * 1deg) 100% 90%) calc(0% * var(--bg-size)),
            hsl(calc(var(--hue) * var(--hue-speed) * 1deg) 100% 80%) calc(20% * var(--bg-size)),
            hsl(calc(var(--hue) * var(--hue-speed) * 1deg) 100% 60%) calc(40% * var(--bg-size)),
            transparent 100%
          );
          mix-blend-mode: color-burn;
          animation: hue-animation var(--animation-speed) linear infinite,
                     rotate-bg var(--animation-speed) linear infinite;
          transition: --bg-size var(--interaction-speed) ease;

          /* THE FIX: This hollows out the center so the gradient only exists on the border */
          padding: var(--border-width);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
        }

        .glow {
          --glow-translate-y: 0;
          display: block;
          position: absolute;
          width: 30%;
          height: 30%;
          animation: rotate var(--animation-speed) linear infinite;
          transform: rotateZ(calc(var(--rotate) * var(--glow-rotate-unit)));
          transform-origin: center;
          border-radius: 50%;
        }

        .glow:after {
          content: "";
          display: block;
          z-index: -2;
          filter: blur(calc(var(--glow-blur) * 10px));
          width: 130%;
          height: 130%;
          left: -15%;
          top: -15%;
          background: hsl(calc(var(--hue) * var(--hue-speed) * 1deg) 100% 60%);
          position: relative;
          border-radius: 50%;
          animation: hue-animation var(--animation-speed) linear infinite;
          transform: scaleY(calc(var(--glow-scale) * var(--scale-factor) / 1.1))
                     scaleX(calc(var(--glow-scale) * var(--scale-factor) * 1.2))
                     translateY(calc(var(--glow-translate-y) * 1%));
          opacity: 0.4;
          mix-blend-mode: multiply;
        }

        :global(.dark) .glow:after {
          opacity: var(--glow-opacity);
          mix-blend-mode: normal;
        }
        
        :global(.dark) .glow-content:before {
          background: hsl(0deg 0% 16%) radial-gradient(
            30% 30% at calc(var(--bg-x) * 1%) calc(var(--bg-y) * 1%),
            hsl(calc(var(--hue) * var(--hue-speed) * 1deg) 100% 90%) calc(0% * var(--bg-size)),
            hsl(calc(var(--hue) * var(--hue-speed) * 1deg) 100% 80%) calc(20% * var(--bg-size)),
            hsl(calc(var(--hue) * var(--hue-speed) * 1deg) 100% 60%) calc(40% * var(--bg-size)),
            transparent 100%
          );
          mix-blend-mode: color-burn;
        }

        /* ----- THE NEW HOVER LOGIC ----- */
        /* Light Mode Default: White card stays white, dark text gets tinted! */
        .glow-container:hover .glow-content {
          mix-blend-mode: lighten; 
          /* We don't force text to white here, so the dark text absorbs the color */
          box-shadow: 0 0 calc(var(--white-shadow) * 1vw) calc(var(--white-shadow) * 0.15vw) rgba(0, 0, 0, 0.05);
          animation: shadow-pulse calc(var(--animation-speed) * 2) linear infinite;
        }

        /* Dark Mode Override: Exactly as it was, kept absolutely perfect */
        :global(.dark) .glow-container:hover .glow-content {
          mix-blend-mode: darken;
          --text-color: white;
          box-shadow: 0 0 calc(var(--white-shadow) * 1vw) calc(var(--white-shadow) * 0.15vw) rgb(255 255 255 / 20%);
        }
        /* ------------------------------- */

        .glow-container:hover .glow-content:before {
          --bg-size: 15;
          animation-play-state: paused;
          transition: --bg-size var(--interaction-speed) ease;
        }

        .glow-container:hover .glow {
          --glow-blur: 1.5;
          --glow-opacity: 0.6;
          --glow-scale: 2.5;
          --glow-radius: 0;
          --rotate: 900;
          --glow-rotate-unit: 0;
          --scale-factor: 1.25;
          animation-play-state: paused;
        }

        .glow-container:hover .glow:after {
          --glow-translate-y: 0;
          animation-play-state: paused;
          transition: --glow-translate-y 0s ease, --glow-blur 0.05s ease,
                      --glow-opacity 0.05s ease, --glow-scale 0.05s ease,
                      --glow-radius 0.05s ease;
        }

        @keyframes shadow-pulse {
          0%, 24%, 46%, 73%, 96% {
            --white-shadow: 0.5;
          }
          12%, 28%, 41%, 63%, 75%, 82%, 98% {
            --white-shadow: 2.5;
          }
          6%, 32%, 57% {
            --white-shadow: 1.3;
          }
          18%, 52%, 88% {
            --white-shadow: 3.5;
          }
        }

        @keyframes rotate-bg {
          0% {
            --bg-x: 0;
            --bg-y: 0;
          }
          25% {
            --bg-x: 100;
            --bg-y: 0;
          }
          50% {
            --bg-x: 100;
            --bg-y: 100;
          }
          75% {
            --bg-x: 0;
            --bg-y: 100;
          }
          100% {
            --bg-x: 0;
            --bg-y: 0;
          }
        }

        @keyframes rotate {
          from {
            --rotate: -70;
            --glow-translate-y: -65;
          }
          25% {
            --glow-translate-y: -65;
          }
          50% {
            --glow-translate-y: -65;
          }
          60%, 75% {
            --glow-translate-y: -65;
          }
          85% {
            --glow-translate-y: -65;
          }
          to {
            --rotate: calc(360 - 70);
            --glow-translate-y: -65;
          }
        }

        @keyframes hue-animation {
          0% {
            --hue: 0;
          }
          100% {
            --hue: 360;
          }
        }
      `}</style>

      <div className="glow-container" role="button">
        <span className="glow"></span>
        <div className="glow-content">{children}</div>
      </div>
    </>
  )
}