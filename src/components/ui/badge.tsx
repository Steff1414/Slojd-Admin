import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Entity badges
        customer: "border-transparent bg-customer/15 text-customer",
        contact: "border-transparent bg-contact/15 text-contact",
        school: "border-transparent bg-school/15 text-school",
        company: "border-transparent bg-company/15 text-company",
        teacher: "border-transparent bg-teacher/15 text-teacher",
        payer: "border-transparent bg-payer/15 text-payer",
        // Status badges
        success: "border-transparent bg-success/15 text-success",
        warning: "border-transparent bg-warning/15 text-warning",
        info: "border-transparent bg-info/15 text-info",
        // Type group badges
        b2c: "border-transparent bg-contact/15 text-contact",
        b2b: "border-transparent bg-company/15 text-company",
        b2g: "border-transparent bg-school/15 text-school",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
