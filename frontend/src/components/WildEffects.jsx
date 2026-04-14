import React from 'react';
import { motion } from 'framer-motion';

const WildEffects = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      
      {/* Dynamic Laser Lines (Horizontal) */}
      {[...Array(7)].map((_, i) => {
        const topPos = Math.random() * 100;
        const duration = 2 + Math.random() * 4;
        const delay = Math.random() * 5;
        
        return (
          <motion.div
            key={`h-${i}`}
            className="absolute h-[2px] w-[50%] bg-gradient-to-r from-transparent via-secondary to-transparent blur-[1px]"
            style={{ top: `${topPos}%` }}
            animate={{
              x: ['-100vw', '200vw'],
              opacity: [0, 1, 1, 0]
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              delay: delay,
              ease: "linear"
            }}
          />
        );
      })}

      {/* Dynamic Laser Lines (Vertical) */}
      {[...Array(7)].map((_, i) => {
        const leftPos = Math.random() * 100;
        const duration = 3 + Math.random() * 5;
        const delay = Math.random() * 5;
        
        return (
          <motion.div
            key={`v-${i}`}
            className="absolute w-[2px] h-[50%] bg-gradient-to-b from-transparent via-primary to-transparent blur-[1px]"
            style={{ left: `${leftPos}%` }}
            animate={{
              y: ['-100vh', '200vh'],
              opacity: [0, 1, 1, 0]
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              delay: delay,
              ease: "linear"
            }}
          />
        );
      })}

      {/* Wild Chaotic Cyber Shapes */}
      {[...Array(12)].map((_, i) => {
        const size = 30 + Math.random() * 150;
        const startX = Math.random() * 100;
        const startY = Math.random() * 100;
        const duration = 8 + Math.random() * 12;
        
        return (
          <motion.div
            key={`w-${i}`}
            className="absolute border-[1px] border-secondary/20 mix-blend-screen"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${startX}%`,
              top: `${startY}%`,
            }}
            animate={{
              rotate: [0, 180, 720, -180, 0],
              scale: [0, 1.5, 0.5, 2, 0],
              opacity: [0, 0.8, 0, 0.5, 0],
              borderRadius: ["0%", "50%", "10%", "50%", "0%"],
              x: [0, (Math.random() - 0.5) * 500, (Math.random() - 0.5) * 500, 0],
              y: [0, (Math.random() - 0.5) * 500, (Math.random() - 0.5) * 500, 0]
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        );
      })}

    </div>
  );
};

export default WildEffects;
