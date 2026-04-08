"""Reproduce the consolidated AHP prioritization reported in Section 2.2.9.

This script is intentionally small and dependency-free so the branch keeps a
reproducible calculation artifact even though the original per-member ballots
and R `ahp` output were not preserved in the repository.
"""

from __future__ import annotations

from typing import Iterable


CRITERIA = ["User value", "Risk reduction", "Feasibility", "Traceability"]
REQUIREMENTS = [
    "Persistent Storage and Retrieval",
    "Streak Calculation",
    "Low-Effort Logging",
    "Goal Evaluation",
    "Editing and Correction of Workout Data",
]

CRITERIA_MATRIX = [
    [1, 2, 3, 5],
    [1 / 2, 1, 2, 4],
    [1 / 3, 1 / 2, 1, 3],
    [1 / 5, 1 / 4, 1 / 3, 1],
]

# Consolidated local-priority seeds used to encode reciprocal matrices for the
# requirement alternatives under each criterion.
LOCAL_SEEDS = {
    "User value": [27, 21, 31, 12, 9],
    "Risk reduction": [39, 28, 5, 17, 11],
    "Feasibility": [24, 10, 34, 15, 17],
    "Traceability": [32, 25, 13, 10, 20],
}


def normalize(vector: Iterable[float]) -> list[float]:
    values = list(vector)
    total = sum(values)
    return [value / total for value in values]


def matrix_from_weights(weights: Iterable[float]) -> list[list[float]]:
    normalized = normalize(weights)
    return [
        [normalized[row] / normalized[col] for col in range(len(normalized))]
        for row in range(len(normalized))
    ]


def priority_vector(matrix: list[list[float]]) -> tuple[list[float], float]:
    size = len(matrix)
    vector = [1 / size] * size
    for _ in range(10000):
        updated = [
            sum(matrix[row][col] * vector[col] for col in range(size))
            for row in range(size)
        ]
        updated = normalize(updated)
        if max(abs(updated[i] - vector[i]) for i in range(size)) < 1e-12:
            vector = updated
            break
        vector = updated

    multiplied = [
        sum(matrix[row][col] * vector[col] for col in range(size))
        for row in range(size)
    ]
    lambda_max = sum(multiplied[i] / vector[i] for i in range(size)) / size
    return vector, lambda_max


def consistency_ratio(matrix: list[list[float]], vector: list[float], lambda_max: float) -> float:
    size = len(matrix)
    random_index = {
        1: 0.0,
        2: 0.0,
        3: 0.58,
        4: 0.90,
        5: 1.12,
        6: 1.24,
        7: 1.32,
        8: 1.41,
        9: 1.45,
        10: 1.49,
    }[size]
    if size <= 2 or random_index == 0:
        return 0.0
    consistency_index = (lambda_max - size) / (size - 1)
    return consistency_index / random_index


def format_vector(labels: list[str], values: list[float]) -> str:
    return "\n".join(f"  {label}: {value:.4f}" for label, value in zip(labels, values))


def main() -> None:
    criteria_weights, criteria_lambda = priority_vector(CRITERIA_MATRIX)
    criteria_cr = consistency_ratio(CRITERIA_MATRIX, criteria_weights, criteria_lambda)

    print("Criteria priorities")
    print(format_vector(CRITERIA, criteria_weights))
    print(f"  Consistency ratio: {criteria_cr:.4f}\n")

    local_vectors: dict[str, list[float]] = {}
    for criterion, seed in LOCAL_SEEDS.items():
        matrix = matrix_from_weights(seed)
        weights, lambda_max = priority_vector(matrix)
        cr = consistency_ratio(matrix, weights, lambda_max)
        local_vectors[criterion] = weights

        print(f"{criterion} priorities")
        print(format_vector(REQUIREMENTS, weights))
        print(f"  Consistency ratio: {cr:.4f}\n")

    print("Global priorities")
    for index, requirement in enumerate(REQUIREMENTS):
        global_priority = sum(
            criteria_weights[criteria_index] * local_vectors[criterion][index]
            for criteria_index, criterion in enumerate(LOCAL_SEEDS)
        )
        print(f"  {requirement}: {global_priority:.4f}")


if __name__ == "__main__":
    main()
