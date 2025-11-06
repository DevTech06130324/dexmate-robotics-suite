import React from 'react';
import { motion } from 'framer-motion';

const PageLoader: React.FC = () => (
  <div className="loading-screen" role="status" aria-live="polite">
    <motion.div
      className="loading-spinner"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
    />
    <span className="visually-hidden">Loading</span>
  </div>
);

export default PageLoader;
