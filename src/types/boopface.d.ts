// <boop-face> is a web component (the boopface package). This teaches JSX about it.
import type { DetailedHTMLProps, HTMLAttributes } from "react";
import type { BoopFace } from "boopface";

type BoopFaceAttributes = DetailedHTMLProps<HTMLAttributes<BoopFace>, BoopFace> & {
  size?: string;
  color?: string;
  "auto-sleep"?: string;
  "wake-on"?: "activity" | "interaction" | "manual";
  motion?: "auto" | "reduce" | "full";
  "press-squeeze"?: "true" | "false";
  "antenna-drag"?: "true" | "false";
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "boop-face": BoopFaceAttributes;
    }
  }
}
