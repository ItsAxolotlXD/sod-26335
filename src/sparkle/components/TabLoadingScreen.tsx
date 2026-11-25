import React from "react";
import { motion } from "motion/react";
import { StartMenuRouteIcon } from "./StartAppIcons";

interface TabLoadingScreenProps {
  route?: string;
  className?: string;
}

const largeIconClass = "w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 shrink-0 drop-shadow-md";

export const TabLoadingScreen: React.FC<TabLoadingScreenProps> = ({
  route = "/",
  className = "",
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading..."
      className={`w-full flex-1 flex flex-col items-center justify-center min-h-[55vh] sm:min-h-[65vh] py-16 select-none my-auto ${className}`}
    >
      <motion.div
        key={`tab-icon-${route}`}
        initial={{ scale: 0.55, opacity: 0 }}
        animate={{
          scale: [0.55, 1.07, 0.98, 1.01, 1],
          opacity: [0, 1, 1, 1, 1],
        }}
        transition={{
          duration: 0.5,
          times: [0, 0.44, 0.7, 0.88, 1],
          ease: [0.25, 1, 0.4, 1],
        }}
        className="relative flex items-center justify-center origin-center pointer-events-none select-none bg-transparent"
      >
        <StartMenuRouteIcon route={route} className={largeIconClass} />
      </motion.div>
    </div>
  );
};
