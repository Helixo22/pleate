import { Volume1, Volume2 } from "lucide-react";
import { ElasticSlider } from "pleate/effects/elastic-slider";

export default function Demo() {
  return (
    <div className="grid w-full max-w-sm gap-10">
      <ElasticSlider label="Volume" defaultValue={60} startIcon={<Volume1 />} endIcon={<Volume2 />} />
      <ElasticSlider label="Brightness" defaultValue={4} min={0} max={10} step={1} showValue />
    </div>
  );
}
