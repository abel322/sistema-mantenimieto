import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onClose?: () => void
  children?: React.ReactNode
}

export function Dialog({ open, isOpen, onOpenChange, onClose, children }: DialogProps) {
  const isShown = open ?? isOpen ?? false
  if (!isShown) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 overflow-y-auto">
      {children}
    </div>
  )
}

export function DialogContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl bg-white dark:bg-slate-900 my-auto border border-slate-100 dark:border-slate-800 shadow-xl animate-in fade-in zoom-in-95 duration-150 relative",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function DialogHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "pb-3 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10 flex items-center justify-between",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function DialogTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-bold text-slate-900 dark:text-slate-100", className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export function DialogFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row gap-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
