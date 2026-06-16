import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const neuButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[4px] text-sm font-black transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "btn-neon bg-[#10B981] text-white hover:bg-[#059669]",
        primary: "btn-neon bg-[#4F46E5] text-white hover:bg-[#4338CA]",
        outline: "neu-btn-white border-2 border-[#1C1917] bg-white text-[#1C1917] hover:bg-gray-50",
        destructive: "btn-neon bg-red-600 text-white hover:bg-red-700 shadow-[3px_3px_0_#991B1B]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof neuButtonVariants> {
  asChild?: boolean
}

const NeuButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(neuButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
NeuButton.displayName = "NeuButton"

export { NeuButton, neuButtonVariants }
