import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import Link from "next/link"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] duration-(--duration-micro) ease-standard outline-none select-none focus-visible:border-primary focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px_var(--background),0_0_0_4px_var(--primary)] active:not-aria-[haspopup]:translate-y-px active:duration-(--duration-instant) disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-(--shadow-primary) hover:bg-primary/80 hover:shadow-(--shadow-primary-hover) active:shadow-(--shadow-primary-active)",
        cta: "border-[#f8e59a]/45 bg-[linear-gradient(145deg,#f4dc76_0%,#d4af37_52%,#b58c1e_100%)] text-primary-foreground shadow-[0_12px_28px_rgba(212,175,55,0.2),inset_0_1px_0_rgba(255,255,255,0.5)] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_16px_34px_rgba(212,175,55,0.26),inset_0_1px_0_rgba(255,255,255,0.58)] active:translate-y-px active:scale-[0.98] active:brightness-95",
        ctaOutline:
          "border-white/40 bg-white/[0.06] text-foreground shadow-[0_8px_22px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.1)] supports-[backdrop-filter]:backdrop-blur-xl hover:-translate-y-0.5 hover:border-white/52 hover:bg-white/[0.12] hover:shadow-[0_12px_28px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.14)] active:translate-y-px active:scale-[0.98]",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] active:shadow-none aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive shadow-xs hover:bg-destructive/20 active:shadow-none focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        cta: "h-12 gap-2 rounded-[1.125rem] px-5 text-[0.95rem] font-semibold tracking-[-0.01em] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

type ButtonLinkProps = ComponentProps<typeof Link> &
  VariantProps<typeof buttonVariants>

function ButtonLink({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

type ButtonAnchorProps = ComponentProps<"a"> &
  VariantProps<typeof buttonVariants>

function ButtonAnchor({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonAnchorProps) {
  return (
    <a
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, ButtonAnchor, ButtonLink, buttonVariants }
