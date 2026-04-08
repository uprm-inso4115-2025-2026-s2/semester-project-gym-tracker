import React from "react";
import { motion } from "framer-motion";
import "./WeeklyProgress.css";

interface WeeklyProgressProps {
  completedDays: number;
}

export default function WeeklyProgress({ completedDays }: WeeklyProgressProps) {
  const totalDays = 7;

  return (
    <div className="weekly-progress">
      <h2 className="weekly-progress-title">Weekly Progress</h2>

      <div className="weekly-progress-dots">
        {Array.from({ length: totalDays }).map((_, index) => {
          const completed = index < completedDays;

          return (
            <motion.div
              key={index}
              className={`weekly-progress-dot${completed ? " completed" : ""}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: completed ? 1.2 : 1,
                opacity: 1,
              }}
              transition={{
                delay: index * 0.12,
                type: "spring",
                stiffness: 200,
              }}
              whileHover={{ scale: 1.4 }}
            />
          );
        })}
      </div>

      <p className="weekly-progress-summary">
        {completedDays} / {totalDays} days completed
      </p>
    </div>
  );
}
