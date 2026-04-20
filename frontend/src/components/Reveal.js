import { motion } from "framer-motion";

// Détection tactile — on allège les animations sur mobile pour éviter les crashes
const isTouchDevice =
  typeof window !== "undefined" &&
  (window.matchMedia?.("(hover: none) and (pointer: coarse)").matches ||
    ("ontouchstart" in window && navigator.maxTouchPoints > 0));

/**
 * Reveal wrapper — fades in and slides up when entering the viewport.
 * Respects prefers-reduced-motion (auto via framer-motion / CSS override).
 * Sur mobile tactile : animation simplifiée (fade seul, pas de translateY) pour
 * éviter les crashes liés à trop d'animations simultanées au scroll.
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
  // Sur mobile on simplifie : fade uniquement, durée réduite, délai nul
  const mobileProps = isTouchDevice
    ? {
        initial: { opacity: 0 },
        whileInView: { opacity: 1 },
        viewport: { once: true, margin: "-40px" },
        transition: { duration: 0.4, delay: 0 },
      }
    : {
        initial: { opacity: 0, y, scale: 0.985 },
        whileInView: { opacity: 1, y: 0, scale: 1 },
        viewport: { once, margin },
        transition: {
          // Spring momentum — natural "launch then settle" feel
          opacity: { duration: duration * 0.55, delay, ease: [0.22, 0.8, 0.2, 1] },
          y:       { type: "spring", stiffness: 90,  damping: 18, mass: 0.9, delay },
          scale:   { type: "spring", stiffness: 120, damping: 20, delay },
        },
      };

  return (
    <MotionTag className={className} {...mobileProps}>
      {children}
    </MotionTag>
  );
}

/**
 * Stagger children — use as parent, pass Reveal items as children for staggered reveal.
 */
export function StaggerGroup({ children, stagger = 0.08, className = "", margin = "-80px" }) {
  // Sur mobile : pas de stagger (tout apparaît ensemble), moins de calculs
  const staggerDelay = isTouchDevice ? 0.04 : stagger;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: isTouchDevice ? "-40px" : margin }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, y = 24, duration = 0.55, className = "" }) {
  // Sur mobile : fade uniquement, pas de translateY
  const variants = isTouchDevice
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.35 } },
      }
    : {
        hidden: { opacity: 0, y, scale: 0.985 },
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
      };

  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  );
}
