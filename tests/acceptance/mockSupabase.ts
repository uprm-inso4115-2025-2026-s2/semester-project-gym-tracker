type MockUser = {
  id: string;
  email: string;
};

type GoalFeedbackRow = {
  id: string;
  user_id: string;
  type: string;
  title?: string | null;
  description?: string | null;
  target_value: number | null;
  recorded_value: number | null;
  status?: string | null;
  period_date: string;
};

type WorkoutSessionRow = {
  workout_id: string;
  user_id: string;
  workout_type: string;
  duration_minutes: number | null;
  calories_burned: number | null;
  notes: string | null;
  created_at: string | null;
};

type ExerciseRow = {
  exercise_id: string;
  name: string;
  category: string | null;
};

type WorkoutExerciseRow = {
  record_id: string;
  workout_id: string;
  exercise_id: string;
  sets: number | null;
  reps: number | null;
  weight: number | null;
};

type MockDatabaseState = {
  user: MockUser | null;
  session: { user: MockUser } | null;
  goals_feedback: GoalFeedbackRow[];
  workout_sessions: WorkoutSessionRow[];
  workout_exercises: WorkoutExerciseRow[];
  exercises: ExerciseRow[];
};

type SeedState = Partial<{
  user: MockUser | null;
  goals_feedback: GoalFeedbackRow[];
  workout_sessions: WorkoutSessionRow[];
  workout_exercises: WorkoutExerciseRow[];
  exercises: ExerciseRow[];
}>;

type TableName = keyof Pick<
  MockDatabaseState,
  "goals_feedback" | "workout_sessions" | "workout_exercises" | "exercises"
>;

type Filter = {
  operator: "eq" | "gt";
  field: string;
  value: unknown;
};

const DEFAULT_USER: MockUser = {
  id: "user-1",
  email: "athlete@example.com",
};

let state = createState();
let counters = createCounters(state);

function clone<T>(value: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function createState(seed: SeedState = {}): MockDatabaseState {
  const user = seed.user === undefined ? DEFAULT_USER : seed.user;

  return {
    user,
    session: user ? { user } : null,
    goals_feedback: clone(seed.goals_feedback ?? []),
    workout_sessions: clone(seed.workout_sessions ?? []),
    workout_exercises: clone(seed.workout_exercises ?? []),
    exercises: clone(seed.exercises ?? []),
  };
}

function createCounters(currentState: MockDatabaseState) {
  return {
    goal: currentState.goals_feedback.length + 1,
    workout: currentState.workout_sessions.length + 1,
    exercise: currentState.exercises.length + 1,
    workoutExercise: currentState.workout_exercises.length + 1,
  };
}

function nextId(kind: keyof typeof counters) {
  const value = counters[kind];
  counters[kind] += 1;
  return `${kind}-${value}`;
}

function sortRows(rows: Record<string, unknown>[], field: string, ascending: boolean) {
  return [...rows].sort((a, b) => {
    const left = a[field];
    const right = b[field];

    if (left == null && right == null) return 0;
    if (left == null) return 1;
    if (right == null) return -1;
    if (left === right) return 0;

    return ascending
      ? left > right ? 1 : -1
      : left < right ? 1 : -1;
  });
}

function applyFilters(rows: Record<string, unknown>[], filters: Filter[]) {
  return rows.filter((row) =>
    filters.every((filter) => {
      const value = row[filter.field];

      if (filter.operator === "eq") {
        return value === filter.value;
      }

      if (filter.operator === "gt") {
        if (value == null) return false;
        return value > filter.value;
      }

      return true;
    })
  );
}

class QueryBuilder implements PromiseLike<{ data: unknown; error: Error | null }> {
  private action: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private filters: Filter[] = [];
  private orderBy: { field: string; ascending: boolean } | null = null;
  private payload: unknown = null;
  private resultMode: "many" | "maybeSingle" | "single" = "many";
  private selectedColumns: string | undefined;
  private onConflict: string | undefined;

  constructor(private readonly table: TableName) {}

  select(columns?: string) {
    if (this.action === "select") {
      this.selectedColumns = columns;
    } else {
      this.selectedColumns = columns;
    }
    return this;
  }

  insert(payload: unknown) {
    this.action = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: unknown) {
    this.action = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  upsert(payload: unknown, options?: { onConflict?: string }) {
    this.action = "upsert";
    this.payload = payload;
    this.onConflict = options?.onConflict;
    return this;
  }

  eq(field: string, value: unknown) {
    this.filters.push({ operator: "eq", field, value });
    return this;
  }

  gt(field: string, value: unknown) {
    this.filters.push({ operator: "gt", field, value });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderBy = { field, ascending: options?.ascending ?? true };
    return this;
  }

  maybeSingle() {
    this.resultMode = "maybeSingle";
    return this;
  }

  single() {
    this.resultMode = "single";
    return this;
  }

  private readTable() {
    return state[this.table] as Record<string, unknown>[];
  }

  private writeTable(rows: Record<string, unknown>[]) {
    state = {
      ...state,
      [this.table]: rows,
    };
  }

  private finalizeSelection(rows: Record<string, unknown>[]) {
    const orderedRows = this.orderBy
      ? sortRows(rows, this.orderBy.field, this.orderBy.ascending)
      : [...rows];

    if (
      this.table === "workout_exercises" &&
      this.selectedColumns?.includes("exercises(name)")
    ) {
      return orderedRows.map((row) => {
        const exercise = state.exercises.find(
          (candidate) => candidate.exercise_id === row.exercise_id
        );

        return {
          ...row,
          exercises: exercise ? { name: exercise.name } : null,
        };
      });
    }

    return orderedRows;
  }

  private executeSelect() {
    const rows = applyFilters(this.readTable(), this.filters);
    return this.finalizeSelection(rows);
  }

  private executeInsert() {
    const payloadRows = Array.isArray(this.payload) ? this.payload : [this.payload];

    const insertedRows = payloadRows.map((row) => {
      const value = clone(row) as Record<string, unknown>;

      if (this.table === "workout_sessions") {
        return {
          workout_id: (value.workout_id as string | undefined) ?? nextId("workout"),
          user_id: value.user_id as string,
          workout_type: value.workout_type as string,
          duration_minutes: (value.duration_minutes as number | null | undefined) ?? null,
          calories_burned: (value.calories_burned as number | null | undefined) ?? null,
          notes: (value.notes as string | null | undefined) ?? null,
          created_at: (value.created_at as string | null | undefined) ?? new Date().toISOString(),
        };
      }

      if (this.table === "goals_feedback") {
        return {
          id: (value.id as string | undefined) ?? nextId("goal"),
          user_id: value.user_id as string,
          type: value.type as string,
          title: (value.title as string | null | undefined) ?? null,
          description: (value.description as string | null | undefined) ?? null,
          target_value: (value.target_value as number | null | undefined) ?? null,
          recorded_value: (value.recorded_value as number | null | undefined) ?? null,
          status: (value.status as string | null | undefined) ?? null,
          period_date: value.period_date as string,
        };
      }

      if (this.table === "workout_exercises") {
        return {
          record_id: (value.record_id as string | undefined) ?? nextId("workoutExercise"),
          workout_id: value.workout_id as string,
          exercise_id: value.exercise_id as string,
          sets: (value.sets as number | null | undefined) ?? null,
          reps: (value.reps as number | null | undefined) ?? null,
          weight: (value.weight as number | null | undefined) ?? null,
        };
      }

      return {
        exercise_id: (value.exercise_id as string | undefined) ?? nextId("exercise"),
        name: value.name as string,
        category: (value.category as string | null | undefined) ?? null,
      };
    });

    this.writeTable([...this.readTable(), ...insertedRows]);
    return insertedRows;
  }

  private executeUpdate() {
    const existingRows = this.readTable();
    const updatedRows: Record<string, unknown>[] = [];

    const nextRows = existingRows.map((row) => {
      if (!applyFilters([row], this.filters).length) {
        return row;
      }

      const updated = {
        ...row,
        ...(this.payload as Record<string, unknown>),
      };

      updatedRows.push(updated);
      return updated;
    });

    this.writeTable(nextRows);
    return updatedRows;
  }

  private executeDelete() {
    const existingRows = this.readTable();
    const rowsToDelete = applyFilters(existingRows, this.filters);
    const nextRows = existingRows.filter(
      (row) => !rowsToDelete.some((candidate) => candidate === row)
    );

    this.writeTable(nextRows);
    return rowsToDelete;
  }

  private executeUpsert() {
    if (this.table !== "exercises") {
      throw new Error("Mock upsert is only implemented for exercises.");
    }

    const payloadRows = Array.isArray(this.payload) ? this.payload : [this.payload];
    const upsertedRows: ExerciseRow[] = [];
    const nextRows = [...state.exercises];

    for (const row of payloadRows) {
      const value = clone(row) as Partial<ExerciseRow>;
      const conflictField = this.onConflict ?? "exercise_id";
      const existingIndex = nextRows.findIndex(
        (candidate) => candidate[conflictField as keyof ExerciseRow] === value[conflictField as keyof ExerciseRow]
      );

      if (existingIndex >= 0) {
        const updated = {
          ...nextRows[existingIndex],
          ...value,
        } as ExerciseRow;
        nextRows[existingIndex] = updated;
        upsertedRows.push(updated);
      } else {
        const inserted = {
          exercise_id: value.exercise_id ?? nextId("exercise"),
          name: value.name ?? "Unnamed exercise",
          category: value.category ?? null,
        };
        nextRows.push(inserted);
        upsertedRows.push(inserted);
      }
    }

    state = {
      ...state,
      exercises: nextRows,
    };

    return upsertedRows;
  }

  private async execute() {
    let data: unknown;

    switch (this.action) {
      case "insert":
        data = this.executeInsert();
        break;
      case "update":
        data = this.executeUpdate();
        break;
      case "delete":
        data = this.executeDelete();
        break;
      case "upsert":
        data = this.executeUpsert();
        break;
      case "select":
      default:
        data = this.executeSelect();
        break;
    }

    if (this.resultMode === "single") {
      const row = Array.isArray(data) ? data[0] ?? null : data;
      if (!row) {
        return {
          data: null,
          error: new Error(`Expected one row from ${this.table}, but none matched.`),
        };
      }
      return { data: row, error: null };
    }

    if (this.resultMode === "maybeSingle") {
      return {
        data: Array.isArray(data) ? data[0] ?? null : data,
        error: null,
      };
    }

    return { data, error: null };
  }

  then<TResult1 = { data: unknown; error: Error | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown; error: Error | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export function resetSupabaseMock(seed: SeedState = {}) {
  state = createState(seed);
  counters = createCounters(state);
}

export function getSupabaseMockState() {
  return clone(state);
}

export const supabase = {
  auth: {
    async getSession() {
      return {
        data: { session: state.session },
        error: null,
      };
    },

    async getUser() {
      return {
        data: { user: state.user },
        error: null,
      };
    },

    onAuthStateChange() {
      return {
        data: {
          subscription: {
            unsubscribe() {
              return undefined;
            },
          },
        },
      };
    },
  },

  from(table: TableName) {
    return new QueryBuilder(table);
  },
};
