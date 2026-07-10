import { useState } from "react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
} from "@floating-ui/react";
import type { Placement } from "@floating-ui/react";
import { motion, AnimatePresence } from "framer-motion";

export function Tooltip({
  children,
  content,
  placement = "top",
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  placement?: Placement;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ fallbackAxisSideDirection: "start" }),
      shift({ padding: 8 }),
    ],
  });

  const hover = useHover(context, { move: false, delay: { open: 150, close: 0 } });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()} style={{ display: "inline-block" }}>
        {children}
      </div>
      <FloatingPortal>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={refs.setFloating}
              style={{
                ...floatingStyles,
                zIndex: 1000,
              }}
              {...getFloatingProps()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <div style={{
                background: "var(--color-surface-raised)",
                color: "var(--color-text)",
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--text-xs)",
                fontWeight: "var(--font-weight-medium)",
                border: "1px solid var(--color-border-strong)",
                boxShadow: "var(--shadow-md)",
                maxWidth: "280px",
                lineHeight: 1.4,
              }}>
                {content}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </>
  );
}
