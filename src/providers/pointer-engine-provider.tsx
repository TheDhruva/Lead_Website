"use client";

import { type ReactNode, useEffect } from "react";

import { useCanPointerReact } from "@/hooks/use-can-pointer-react";
import { pointerEngine } from "@/lib/pointer-engine";

interface PointerEngineProviderProps {
  children: ReactNode;
}

/** Enables the shared pointer bus only on fine-pointer + motion-OK devices. */
export function PointerEngineProvider({
  children,
}: PointerEngineProviderProps) {
  const canReact = useCanPointerReact();

  useEffect(() => {
    pointerEngine.setEnabled(canReact);
    return () => pointerEngine.setEnabled(false);
  }, [canReact]);

  return children;
}
