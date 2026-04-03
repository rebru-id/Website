import { cva, type VariantProps } from "class-variance-authority";

// ─────────────────────────────────────────────────────────────────────────────
// Button CVA — structure & state management
// Styling (colors) ditangani CSS variables di globals.css
// ─────────────────────────────────────────────────────────────────────────────

export const buttonVariants = cva(
  // Base shell — shared across all variants
  "btn",
  {
    variants: {
      variant: {
        primary: "btn-primary",
        ghost: "btn-ghost",
        "ghost-dark": "btn-ghost-dark",
        green: "btn-green",
      },
      size: {
        md: "btn-md",
        sm: "btn-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
