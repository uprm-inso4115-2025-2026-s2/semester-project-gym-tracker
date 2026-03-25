import WeeklyProgress from "./features/streaks/WeeklyProgress";
function App() {
  return (
    <div>
      <WeeklyProgress completedDays={5} />
    </div>
  );
}

export default App;
