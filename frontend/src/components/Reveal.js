import { motion } from "framer-motion";

/**
 * Reveal wrapper — fades in and slides up when entering the viewport.
 * Respects prefers-reduced-motion (auto via framer-motion / CSS override).
 *
 * Usage:
 *   <Reveal><YourSection /></Reveal>
 *   <Reveal delay={0.1} y={30}>...</Reveal>
 */
export default function Reveal({
  children,
  delay = 0,
  y = 28,
  duration = 0.7,
  once = true,
  margin = "-80px",
  className = "",
  as = "div",
}) {
  const MotionTag = motion[as] || motion.div;
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin }}
      transition={{
        duration,
        delay,
        ease: [0.2, 0.8, 0.2, 1],
      }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Stagger children — use as parent, pass Reveal items as children for staggered reveal.
 *
 *   <StaggerGroup>
 *     <StaggerItem>Card 1</StaggerItem>
 *     <StaggerItem>Card 2</StaggerItem>
 *   </StaggerGroup>
 */
export function StaggerGroup({ children, stagger = 0.08, className = "", margin = "-80px" }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, y = 24, duration = 0.55, className = "" }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration, ease: [0.2, 0.8, 0.2, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
