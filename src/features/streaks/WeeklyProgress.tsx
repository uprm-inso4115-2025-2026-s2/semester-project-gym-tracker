import { motion } from "framer-motion";

interface WeeklyProgressProps {
  completedDays: number;
}

export default function WeeklyProgress({ completedDays }: WeeklyProgressProps) {
  const totalDays = 7;

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h2 style={{ marginBottom: "20px" }}>Weekly Progress</h2>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px",
        }}
      >
        {Array.from({ length: totalDays }).map((_, index) => {
          const completed = index < completedDays;

          return (
            <motion.div
              key={index}
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
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                backgroundColor: completed ? "#22c55e" : "#9ca3af",
              }}
            />
          );
        })}
      </div>

      <p
        style={{
          marginTop: "18px",
          fontWeight: "bold",
          fontSize: "16px",
        }}
      >
        {completedDays} / {totalDays} days completed
      </p>
    </div>
  );
}