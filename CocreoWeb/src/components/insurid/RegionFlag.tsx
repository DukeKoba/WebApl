import { type Region, REGION_LABELS } from "@/lib/insurid/mock-articles";

interface RegionFlagProps {
  region: Region;
  showLabel?: boolean;
}

export default function RegionFlag({ region, showLabel = true }: RegionFlagProps) {
  const label = REGION_LABELS[region];
  const parts = label.split(" ");
  const flag = parts[0];
  const name = parts.slice(1).join(" ");
  return (
    <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
      <span>{flag}</span>
      {showLabel && <span>{name}</span>}
    </span>
  );
}
