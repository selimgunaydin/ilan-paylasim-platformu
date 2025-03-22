import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed z-[100] flex max-h-screen w-full flex-col-reverse p-4 bottom-0 right-0 top-auto sm:bottom-8 sm:right-8 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-lg border p-4 shadow-xl transition-all duration-300 ease-in-out " +
  "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] " +
  "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none " +
  "data-[state=open]:animate-in data-[state=closed]:animate-out " +
  "data-[swipe=end]:animate-out data-[state=closed]:opacity-0 " +
  "data-[state=closed]:translate-x-full data-[state=open]:translate-y-0 " +
  "data-[state=open]:slide-in-from-bottom-full sm:data-[state=open]:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-white/80 backdrop-blur-md text-gray-900 dark:bg-gray-900/80 dark:text-gray-100",
        destructive: "border-destructive/50 bg-red-500/95 text-white backdrop-blur-md",
        success: "border-green-500/50 bg-green-500/95 text-white backdrop-blur-md",
        warning: "border-yellow-500/50 bg-yellow-500/95 text-white backdrop-blur-md",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(
        toastVariants({ variant }),
        "hover:shadow-2xl transform-gpu",
        className
      )}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium transition-all duration-200 " +
      "bg-transparent border border-gray-200 hover:bg-gray-100 " +
      "focus:outline-none focus:ring-2 focus:ring-offset-2 " +
      "disabled:opacity-50 disabled:pointer-events-none " +
      "dark:border-gray-700 dark:hover:bg-gray-800 " +
      "group-[.destructive]:border-red-200/30 group-[.destructive]:hover:bg-red-600/20 " +
      "group-[.destructive]:text-white group-[.destructive]:focus:ring-red-500",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-full p-1.5 transition-all duration-200 " +
      "text-gray-500 hover:text-gray-900 bg-gray-100/50 " +
      "focus:outline-none focus:ring-2 focus:ring-offset-2 " +
      "opacity-0 group-hover:opacity-100 " +
      "dark:text-gray-400 dark:hover:text-gray-100 dark:bg-gray-800/50 " +
      "group-[.destructive]:text-red-200 group-[.destructive]:hover:text-white " +
      "group-[.destructive]:focus:ring-red-500",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-base font-semibold tracking-tight", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90 leading-relaxed", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};