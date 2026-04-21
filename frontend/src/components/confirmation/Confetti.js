import { motion } from "framer-motion";

const COLORS = ["#6366f1", "#a855f7", "#ec4899", "#22c55e", "#eab308", "#3b82f6"];

export default function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.8;
        const dur = 2 + Math.random() * 2;
        const size = 6 + Math.random() * 8;
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const rotation = Math.random() * 360;
        return (
          <motion.div
            key={i}
            initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
            animate={{ y: "100vh", x: (Math.random() - 0.5) * 200, opacity: 0, rotate: rotation + 360 }}
            transition={{ duration: dur, delay, ease: "easeIn" }}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: -10,
              width: size,
              height: size * 0.6,
              backgroundColor: color,
              borderRadius: 2,
            }}
          />
        );
      })}
    </div>
  );
}
