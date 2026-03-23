import { supabase } from "../../lib/supabaseClient";
import { useEffect, useState } from "react";

type ProgressData = {
  current: number;
  goal: number;
};

export default function DailyGoalProgress() {
  const [data, setData] = useState<ProgressData>({
    current: 0,
    goal: 1,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from("goals")
          .select("recorded_value, target_value")
          .eq("type", "daily");

        if (error) {
          console.error(error);
          return;
        }

        if (data && data.length > 0) {
          const goal = data[0];

          setData({
            current: goal.recorded_value,
            goal: goal.target_value,
          });
        } else {
          setData({
            current: 0,
            goal: 1,
          });
        }
      } catch (err) {
        console.error(err);
      }
    }

    fetchData();
  }, []);

  const percentage =
    data.goal > 0 ? Math.min((data.current / data.goal) * 100, 100) : 0;

  return (
    <div
      style={{
        padding: "1rem",
        border: "1px solid #ccc",
        borderRadius: "8px",
        marginTop: "1rem",
      }}
    >
      <h2>Daily Goal Progress</h2>
      <p>
        {data.current} / {data.goal} workouts completed
      </p>

      <div
        style={{
          background: "#eee",
          height: "10px",
          borderRadius: "5px",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            background: "#4caf50",
            height: "100%",
            borderRadius: "5px",
          }}
        />
      </div>

      <p>{percentage.toFixed(0)}% complete</p>
    </div>
  );
}