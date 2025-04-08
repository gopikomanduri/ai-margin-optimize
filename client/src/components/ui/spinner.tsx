import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const spinnerVariants = cva(
  "inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent",
  {
    variants: {
      size: {
        sm: "h-4 w-4 border-2",
        md: "h-6 w-6 border-2",
        lg: "h-8 w-8 border-2",
        xl: "h-12 w-12 border-4",
      },
      variant: {
        default: "text-foreground",
        primary: "text-primary",
        secondary: "text-secondary",
        success: "text-green-500",
        danger: "text-destructive",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
);

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string;
}

const Spinner = ({
  className,
  variant,
  size,
  label,
  ...props
}: SpinnerProps) => {
  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(spinnerVariants({ variant, size }), className)}
        role="status"
        aria-label={label || "Loading"}
        {...props}
      />
      {label && (
        <span className="ml-2 text-sm text-muted-foreground">{label}</span>
      )}
    </div>
  );
};

export { Spinner };