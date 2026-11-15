// The product's own small icon set: 1.5px strokes, round caps, currentColor.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon16({ children, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const ChevronLeft = (p: IconProps) => (
  <Icon16 {...p}>
    <path d="M9.5 3.5 5 8l4.5 4.5" />
  </Icon16>
);
export const ArrowUpRight = (p: IconProps) => (
  <Icon16 {...p}>
    <path d="M6 4h6v6M12 4 4.5 11.5" />
  </Icon16>
);
export const ArrowUp = (p: IconProps) => (
  <Icon16 {...p}>
    <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
  </Icon16>
);
export const Close = (p: IconProps) => (
  <Icon16 {...p}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </Icon16>
);
export const Check = (p: IconProps) => (
  <Icon16 {...p}>
    <path d="m3.5 8.5 3 3 6-7" />
  </Icon16>
);
/** A warning: a triangle with an exclamation mark. */
export const Alert = (p: IconProps) => (
  <Icon16 {...p}>
    <path d="M8 2.5 14 13H2Z" />
    <path d="M8 6.5v3M8 11.25v.01" />
  </Icon16>
);

function Icon28({ children, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const Shield = (p: IconProps) => (
  <Icon28 {...p}>
    <path d="M14 3.5 23 7v6.5c0 5.2-3.6 9.2-9 11-5.4-1.8-9-5.8-9-11V7Z" />
    <path d="m10 14 3 3 5.5-6" />
  </Icon28>
);
export const Sensor = (p: IconProps) => (
  <Icon28 {...p}>
    <circle cx="14" cy="14" r="2.25" />
    <path d="M8.5 8.5a7.8 7.8 0 0 0 0 11M19.5 8.5a7.8 7.8 0 0 1 0 11M5 5a12.7 12.7 0 0 0 0 18M23 5a12.7 12.7 0 0 1 0 18" />
  </Icon28>
);
export const Droplet = (p: IconProps) => (
  <Icon28 {...p}>
    <path d="M14 3.5c3.8 4.7 7 8.3 7 12.3a7 7 0 0 1-14 0c0-4 3.2-7.6 7-12.3Z" />
    <path d="M10.5 16.5a3.5 3.5 0 0 0 3.5 3.5" />
  </Icon28>
);
