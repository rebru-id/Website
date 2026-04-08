import { cn } from "@/utils";
import { buttonVariants, type ButtonVariants } from "@/lib/cva";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// Button — polymorphic: renders <button> or <Link> based on href prop
// ─────────────────────────────────────────────────────────────────────────────

interface ButtonProps extends ButtonVariants {
  href?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  external?: boolean;
}

export default function Button({
  href,
  children,
  className,
  onClick,
  type = "button",
  disabled,
  external,
  variant,
  size,
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
