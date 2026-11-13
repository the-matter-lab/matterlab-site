import type { ResearchArea } from '../content';

/** The lab's signature "dark disc on a coloured tile" research-area icon. */
export default function AreaIcon({ area, size = 64, tile = true }: { area: ResearchArea; size?: number; tile?: boolean }) {
  const disc = (
    <span className="area-disc" style={{ width: size, height: size }}>
      <img src={area.icon} alt="" style={{ width: size * 0.62, height: size * 0.62 }} />
    </span>
  );
  if (!tile) return disc;
  return (
    <span className="area-tile" style={{ background: area.color }}>
      {disc}
    </span>
  );
}
