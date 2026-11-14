// Lets components set the design system's CSS custom properties inline (style={{ "--x": "12px" }}).
import "react";

declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}
