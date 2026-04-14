import React from 'react';
import { motion } from 'framer-motion';

const BackgroundBlobs = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Blob 1: Blue / Cyan */}
      <motion.div
        className="absolute w-[600px] h-[600px] bg-cyan-500/30 rounded-full blur-[100px] mix-blend-screen"
        style={{ top: '0%', left: '0%', willChange: 'transform' }}
        animate={{
          x: ["-10vw", "40vw", "-10vw"],
          y: ["-10vh", "40vh", "-10vh"],
          scale: [1, 1.4, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Blob 2: Purple / Indigo */}
      <motion.div
        className="absolute w-[700px] h-[700px] bg-indigo-500/30 rounded-full blur-[120px] mix-blend-screen"
        style={{ top: '10%', right: '0%', willChange: 'transform' }}
        animate={{
          x: ["10vw", "-50vw", "10vw"],
          y: ["20vh", "-30vh", "20vh"],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Blob 3: Teal / Blue */}
      <motion.div
        className="absolute w-[800px] h-[800px] bg-teal-500/20 rounded-full blur-[120px] mix-blend-screen"
        style={{ bottom: '-10%', left: '20%', willChange: 'transform' }}
        animate={{
          x: ["-20vw", "30vw", "-20vw"],
          y: ["10vh", "-60vh", "10vh"],
          scale: [1, 1.5, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

export default BackgroundBlobs;
