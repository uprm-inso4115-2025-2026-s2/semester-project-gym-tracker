import React from "react";
import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/lib/supabaseClient", async () => {
  const { supabase } = await import("./mockSupabase");
  return { supabase };
});

import App from "../../src/App";
import { getSupabaseMockState, resetSupabaseMock } from "./mockSupabase";

const defaultSeed = {
  exercises: [
    { exercise_id: "exercise-1", name: "Bench Press", category: "Strength" },
    { exercise_id: "exercise-2", name: "Squat", category: "Strength" },
  ],
};

async function renderApp() {
  window.history.pushState({}, "", "/");
  render(<App />);
  await screen.findByRole("heading", { name: "Gym Tracker" });
}

async function logWorkout(
  user: ReturnType<typeof userEvent.setup>,
  workout: { duration: string; notes?: string }
) {
  await user.click(screen.getByRole("button", { name: /\+ Log Workout/i }));

  const dialog = await screen.findByRole("dialog", { name: /log workout/i });

  await user.clear(within(dialog).getByPlaceholderText("e.g. 45"));
  await user.type(within(dialog).getByPlaceholderText("e.g. 45"), workout.duration);

  if (workout.notes) {
    await user.type(within(dialog).getByPlaceholderText("How did it go?"), workout.notes);
  }

  await user.click(within(dialog).getByRole("button", { name: /^Log Workout$/i }));
  await waitFor(() => {
    expect(screen.queryByRole("dialog", { name: /log workout/i })).not.toBeInTheDocument();
  });
}

describe("acceptance: logged workout flows", () => {
  beforeEach(() => {
    resetSupabaseMock(defaultSeed);
  });

  it("updates daily goal feedback after the user records a workout", async () => {
    const user = userEvent.setup();

    await renderApp();

    expect(screen.getByText("0 / 1 workouts today")).toBeInTheDocument();

    await logWorkout(user, {
      duration: "45",
      notes: "Upper-body session",
    });

    await waitFor(() => {
      expect(screen.getByText("1 / 1 workouts today")).toBeInTheDocument();
      expect(screen.getByText("100% complete")).toBeInTheDocument();
    });

    expect(getSupabaseMockState().workout_sessions).toHaveLength(1);
  });

  it("shows a newly logged workout in the routed history view", async () => {
    const user = userEvent.setup();

    await renderApp();
    await logWorkout(user, {
      duration: "52",
      notes: "Leg day with squats",
    });

    await user.click(screen.getByRole("link", { name: /History/i }));

    await screen.findByRole("heading", { name: /Workout History/i });
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Gym")).toBeInTheDocument();

    const moreInfoButton = screen.getByText("More info").closest("button");
    expect(moreInfoButton).not.toBeNull();

    await user.click(moreInfoButton!);

    await waitFor(() => {
      expect(screen.getByText("Leg day with squats")).toBeInTheDocument();
      expect(screen.getAllByText("52 min")).toHaveLength(2);
    });
  });
});
