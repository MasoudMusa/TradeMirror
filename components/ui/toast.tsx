"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const toastVariants = {
  default: "border bg-background text-foreground",
  destructive:
    "destructive group border-destructive bg-destructive text-destructive-foreground",
}

export function Toast({ className, variant = "default", id, children, ...props }: any) {
  const { dismiss } = useToast()

  // Auto-dismiss logic
  React.useEffect(() => {
     const timer = setTimeout(() => {
         dismiss(id)
     }, 4000)
     return () => clearTimeout(timer)
  }, [id, dismiss])

  return (
    <div
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all animate-in slide-in-from-top-full md:slide-in-from-bottom-full duration-300",
        toastVariants[variant as keyof typeof toastVariants],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function ToastTitle({ className, ...props }: any) {
  return <div className={cn("text-sm font-semibold", className)} {...props} />
}

export function ToastDescription({ className, ...props }: any) {
  return <div className={cn("text-sm opacity-90", className)} {...props} />
}

export function ToastClose({ className, id, ...props }: any) {
    const { dismiss } = useToast()
  return (
    <button
      onClick={() => dismiss(id)}
      className={cn(
        "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
        className
      )}
      {...props}
    >
      <X className="h-4 w-4" />
    </button>
  )
}

// Dummy exports for compatibility if needed
export const ToastProvider = ({ children }: any) => <>{children}</>
export const ToastViewport = () => <></>
