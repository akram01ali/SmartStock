import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import Card from './Card';
import { hoverLift, fadeInUp } from '../transitions/MotionBox';

// Create a motion-enabled Card component
const MotionCard = motion(Card);

// Enhanced Card with smooth transitions
const SmoothCard = forwardRef<HTMLDivElement, any>((props, ref) => {
  const { children, ...rest } = props;
  
  return (
    <MotionCard
      ref={ref}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeInUp}
      {...hoverLift}
      {...rest}
    >
      {children}
    </MotionCard>
  );
});

SmoothCard.displayName = 'SmoothCard';

export { MotionCard };
export default SmoothCard; 