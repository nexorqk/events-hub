import { motion, useReducedMotion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

type PageTransitionProps = {
  children: ReactNode;
  className?: string;
};

const motionEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: motionEase,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: 0.18,
      ease: motionEase,
    },
  },
};

export function PageTransition({ children, className }: PageTransitionProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
