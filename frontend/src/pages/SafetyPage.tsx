import SafetyHeatmap from "@/components/SafetyHeatmap";
import ReviewWidget from "@/components/ReviewWidget";

export default function SafetyPage() {
  return (
    <div className="min-h-dvh">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <h1 className="text-xl font-semibold mb-2">Tourist Safety Heatmap</h1>
        <p className="text-sm text-neutral-600 mb-4">
          Submit a review to improve the community-driven safety score. The map will refresh automatically.
        </p>
        <ReviewWidget />
      </div>
      <div className="mt-4">
        <SafetyHeatmap />
      </div>
    </div>
  );
}
