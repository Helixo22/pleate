import { SwipeCarousel } from "pleate/effects/swipe-carousel";

const STEPS = [
  { title: "Plan your week", body: "Drag tasks onto days and see the load at a glance.", tint: "linear-gradient(135deg, #0a84ff, #5e5ce6)" },
  { title: "Share a board", body: "Invite people with a link; they can comment without an account.", tint: "linear-gradient(135deg, #30d158, #0a84ff)" },
  { title: "Stay in focus", body: "Mute everything but the task you are on.", tint: "linear-gradient(135deg, #ff9f0a, #ff375f)" },
  { title: "Look back", body: "A weekly recap of what moved and what stalled.", tint: "linear-gradient(135deg, #bf5af2, #ff375f)" },
];

export default function Demo() {
  return (
    <SwipeCarousel label="Feature tour" autoplay={4000}>
      {STEPS.map((step) => (
        <div key={step.title} className="flex aspect-[4/3] flex-col justify-end gap-1 p-6 text-white" style={{ background: step.tint }}>
          <p className="text-title2">{step.title}</p>
          <p className="text-subhead text-white/85">{step.body}</p>
        </div>
      ))}
    </SwipeCarousel>
  );
}
