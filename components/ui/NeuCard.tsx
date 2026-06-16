import * as React from "react"
import { cn } from "@/lib/utils"

const NeuCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "neu-card rounded-[8px] border-[3px] border-[#1C1917] bg-white text-[#1C1917] shadow-[4px_4px_0_#1C1917]",
      className
    )}
    {...props}
  />
))
NeuCard.displayName = "NeuCard"

const NeuCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 border-b-[3px] border-[#1C1917] bg-gray-50 rounded-t-[5px]", className)}
    {...props}
  />
))
NeuCardHeader.displayName = "NeuCardHeader"

const NeuCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-black leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
NeuCardTitle.displayName = "NeuCardTitle"

const NeuCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-6", className)} {...props} />
))
NeuCardContent.displayName = "NeuCardContent"

export { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent }
