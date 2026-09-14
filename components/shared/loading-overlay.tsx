import { Loader2Icon } from "lucide-react";

interface LoadingOverlayProps {
  label: string;
}

/** Full-screen, low-opacity overlay shown while a blocking async action (form submit, sign out) is in flight. */
export function LoadingOverlay({ label }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-background/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
        <Loader2Icon className="size-8 animate-spin text-primary" />
        <p>{label}</p>
      </div>
    </div>
  );
}
