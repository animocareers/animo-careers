import { useId } from "react";

import { cn } from "@/lib/utils";

interface AnimoLogoProps {
  className?: string;
}

export function AnimoLogo({ className }: AnimoLogoProps) {
  const id = useId().replace(/:/g, "");
  const gradientId = `animo-grad-${id}`;
  const clipId = `animo-clip-${id}`;

  return (
    <svg
      role="img"
      aria-label="animo"
      viewBox="0 -760 3091 1000"
      className={cn("inline-block w-auto select-none", className)}
      preserveAspectRatio="xMinYMid meet"
      style={{ height: "1em", verticalAlign: "-0.24em" }}
    >
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="-760"
          x2="3091"
          y2="240"
        >
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <rect x="-200" y="-400" width="1200" height="903" />
        </clipPath>
      </defs>
      <g transform="scale(1, -1)">
        <path
          d="M244 -11Q181 -11 132.5 20.0Q84 51 56.5 109.0Q29 167 29 246Q29 327 56.5 384.0Q84 441 132.5 472.0Q181 503 244 503Q299 503 343 477Q374 458 391 432V624Q391 668 414.0 691.0Q437 714 480 714Q522 714 545.5 691.0Q569 668 569 624V81Q569 37 546.5 14.0Q524 -9 481 -9Q439 -9 416 14Q397 33 394 65Q378 36 346 17Q301 -11 244 -11ZM301 120Q328 120 349.0 133.5Q370 147 381.5 174.5Q393 202 393 246Q393 313 367.0 342.5Q341 372 301 372Q274 372 253.0 359.0Q232 346 220.0 318.5Q208 291 208 246Q208 180 234.0 150.0Q260 120 301 120Z"
          fill={`url(#${gradientId})`}
          clipPath={`url(#${clipId})`}
        />
      </g>
      <text
        x="640"
        y="0"
        fill={`url(#${gradientId})`}
        fontFamily="Nunito, system-ui, sans-serif"
        fontWeight={900}
        fontSize="1000"
        letterSpacing="20"
        textLength="2451"
        lengthAdjust="spacing"
      >
        nimo
      </text>
    </svg>
  );
}
