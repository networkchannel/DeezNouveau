import { motion } from "framer-motion";

/**
 * Reveal wrapper — fades in, slides up and gently scales when entering the viewport.
 * Spring physics give a natural "launch then settle" feel.
 * Respects prefers-reduced-motion (framer-motion handles it automatically).
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
      initial={{ opacity: 0, y, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once, margin }}
      transition={{
        opacity: { duration: duration * 0.55, delay, ease: [0.22, 0.8, 0.2, 1] },
        y:       { type: "spring", stiffness: 90,  damping: 18, mass: 0.9, delay },
        scale:   { type: "spring", stiffness: 120, damping: 20, delay },
      }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * StaggerGroup — wraps children in a parent that orchestrates staggered
 * entry animations via variants. Children must be `StaggerItem`.
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

/**
 * StaggerItem — reveals with spring physics.
 * Works standalone (own whileInView + delay) OR inside a StaggerGroup
 * (delegates to the parent via variants).
 */
export function StaggerItem({
  children,
  y = 24,
  duration = 0.55,
  delay = 0,
  standalone = true,
  className = "",
}) {
  const spring = {
    opacity: { duration: duration * 0.55, ease: [0.22, 0.8, 0.2, 1], delay },
    y:       { type: "spring", stiffness: 95,  damping: 17, mass: 0.85, delay },
    scale:   { type: "spring", stiffness: 130, damping: 20, delay },
  };

  if (standalone) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0, y, scale: 0.985 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={spring}
      >
        {children}
      </motion.div>
    );
  }

  // Used inside a <StaggerGroup> — let the parent orchestrate via variants.
  return (
    <motion.div
      className={className}
      variants={{
        hidden:  { opacity: 0, y, scale: 0.985 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            opacity: { duration: duration * 0.55, ease: [0.22, 0.8, 0.2, 1] },
            y:       { type: "spring", stiffness: 95,  damping: 17, mass: 0.85 },
            scale:   { type: "spring", stiffness: 130, damping: 20 },
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
