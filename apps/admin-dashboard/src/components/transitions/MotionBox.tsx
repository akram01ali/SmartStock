import { Box, BoxProps } from '@chakra-ui/react';
import { motion, MotionProps } from 'framer-motion';
import { forwardRef } from 'react';

// Combine Chakra UI Box props with Framer Motion props
type MotionBoxProps = BoxProps & MotionProps;

// Create a motion-enabled Box component
const MotionBox = motion(Box);

// Default animation variants for consistent transitions
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: 'easeOut' }
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3, ease: 'easeOut' }
};

export const slideInFromLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3, ease: 'easeOut' }
};

export const slideInFromRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.3, ease: 'easeOut' }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.3, ease: 'easeOut' }
};

export const hoverLift = {
  whileHover: { 
    y: -8, 
    transition: { duration: 0.2, ease: 'easeOut' } 
  },
  whileTap: { 
    scale: 0.98,
    transition: { duration: 0.1, ease: 'easeOut' }
  }
};

// Enhanced MotionBox with default smooth transitions
const SmoothMotionBox = forwardRef<HTMLDivElement, MotionBoxProps>((props, ref) => {
  const { children, ...rest } = props;
  
  return (
    <MotionBox
      ref={ref}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeInUp}
      {...rest}
    >
      {children}
    </MotionBox>
  );
});

SmoothMotionBox.displayName = 'SmoothMotionBox';

export { MotionBox };
export default SmoothMotionBox; 