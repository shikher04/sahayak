import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-saffron" />
        <span className="text-sm">Loading...</span>
      </div>
    </div>
  );
}
