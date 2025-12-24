import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const FieldSet = React.forwardRef<
  HTMLFieldSetElement,
  React.FieldsetHTMLAttributes<HTMLFieldSetElement>
>(({ className, ...props }, ref) => (
  <fieldset
    ref={ref}
    className={cn("grid gap-6", className)}
    {...props}
  />
))
FieldSet.displayName = "FieldSet"

const fieldLegendVariants = cva("text-sm font-medium leading-none")

const FieldLegend = React.forwardRef<
  HTMLLegendElement,
  React.HTMLAttributes<HTMLLegendElement> &
    VariantProps<typeof fieldLegendVariants> & {
      variant?: "legend" | "label"
    }
>(({ className, variant = "legend", ...props }, ref) => (
  <legend
    ref={ref}
    className={cn(
      fieldLegendVariants(),
      variant === "label" && "text-sm font-medium leading-none",
      className
    )}
    {...props}
  />
))
FieldLegend.displayName = "FieldLegend"

const FieldGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-6", className)} {...props} />
))
FieldGroup.displayName = "FieldGroup"

const fieldVariants = cva("flex gap-2", {
  variants: {
    orientation: {
      vertical: "flex-col",
      horizontal: "flex-row items-center gap-4",
      responsive: "flex-col @container/field-group:flex-row @container/field-group:items-center @container/field-group:gap-4",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
})

const Field = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof fieldVariants> & {
      "data-invalid"?: boolean
    }
>(({ className, orientation, "data-invalid": dataInvalid, ...props }, ref) => (
  <div
    ref={ref}
    role="group"
    data-invalid={dataInvalid}
    className={cn(
      fieldVariants({ orientation }),
      dataInvalid && "data-[invalid]:text-destructive",
      className
    )}
    {...props}
  />
))
Field.displayName = "Field"

const FieldContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1.5", className)}
    {...props}
  />
))
FieldContent.displayName = "FieldContent"

const FieldLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => (
  <Label ref={ref} className={className} {...props} />
))
FieldLabel.displayName = "FieldLabel"

const FieldTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm font-medium leading-none", className)}
    {...props}
  />
))
FieldTitle.displayName = "FieldTitle"

const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground text-balance", className)}
    {...props}
  />
))
FieldDescription.displayName = "FieldDescription"

const FieldSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border",
      className
    )}
    {...props}
  >
    {children && (
      <span className="relative z-10 bg-background px-2 text-muted-foreground">
        {children}
      </span>
    )}
  </div>
))
FieldSeparator.displayName = "FieldSeparator"

const FieldError = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    errors?: Array<{ message?: string } | undefined>
  }
>(({ className, errors, children, ...props }, ref) => {
  if (!errors && !children) return null

  const errorMessages = errors?.filter(Boolean).map((e) => e?.message) || []
  const hasMultipleErrors = errorMessages.length > 1

  return (
    <div
      ref={ref}
      role="alert"
      className={cn("flex items-start gap-1 text-sm text-red-600", className)}
      {...props}
    >
      <img
        src="/assets/danger.svg"
        alt="Error"
        className="h-4 w-4 shrink-0 mt-0.5"
      />
      <div className="flex-1">
        {children || (
          hasMultipleErrors ? (
            <ul className="space-y-1">
              {errorMessages.map((message, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="shrink-0">•</span>
                  <span>{message}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>{errorMessages[0]}</p>
          )
        )}
      </div>
    </div>
  )
})
FieldError.displayName = "FieldError"

const FieldSuccess = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  if (!children) return null

  return (
    <div
      ref={ref}
      role="status"
      className={cn("flex items-center gap-1 text-sm text-green-600", className)}
      {...props}
    >
      <img
        src="/assets/success.svg"
        alt="Success"
        className="h-4 w-4 shrink-0"
      />
      <p>{children}</p>
    </div>
  )
})
FieldSuccess.displayName = "FieldSuccess"

const FieldWarning = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  if (!children) return null

  return (
    <div
      ref={ref}
      role="alert"
      className={cn("flex items-start gap-1 text-sm text-orange-600", className)}
      {...props}
    >
      <img
        src="/assets/warning.svg"
        alt="Warning"
        className="h-4 w-4 shrink-0 mt-0.5"
      />
      <p>{children}</p>
    </div>
  )
})
FieldWarning.displayName = "FieldWarning"

const FieldInformation = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  if (!children) return null

  return (
    <div
      ref={ref}
      role="status"
      className={cn("flex items-start gap-1 text-sm text-blue-600", className)}
      {...props}
    >
      <img
        src="/assets/information.svg"
        alt="Information"
        className="h-4 w-4 shrink-0 mt-0.5"
      />
      <p>{children}</p>
    </div>
  )
})
FieldInformation.displayName = "FieldInformation"

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldInformation,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldSuccess,
  FieldTitle,
  FieldWarning,
}
