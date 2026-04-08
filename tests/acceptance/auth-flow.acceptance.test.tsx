import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const {
  mockUseAuth,
  mockSignInWithEmail,
  mockSignUpWithEmail,
  mockRequestPasswordReset,
  mockUpdatePassword,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockSignInWithEmail: vi.fn(),
  mockSignUpWithEmail: vi.fn(),
  mockRequestPasswordReset: vi.fn(),
  mockUpdatePassword: vi.fn(),
}));

vi.mock("../../src/features/auth/api", () => ({
  signInWithEmail: mockSignInWithEmail,
  signUpWithEmail: mockSignUpWithEmail,
  requestPasswordReset: mockRequestPasswordReset,
  updatePassword: mockUpdatePassword,
}));

vi.mock("../../src/features/auth/AuthContext", async () => {
  const actual = await vi.importActual<typeof import("../../src/features/auth/AuthContext")>(
    "../../src/features/auth/AuthContext"
  );

  return {
    ...actual,
    useAuth: mockUseAuth,
  };
});

import { ProtectedRoute } from "../../src/features/auth/ProtectedRoute";
import LoginPage from "../../src/features/auth/LoginPage";
import SignupPage from "../../src/features/auth/SignupPage";
import ForgotPasswordPage from "../../src/features/auth/ForgotPasswordPage";
import ResetPasswordPage from "../../src/features/auth/ResetPasswordPage";

describe("acceptance: auth flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
    });
  });

  it("redirects unauthenticated visitors away from protected routes", () => {
    render(
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route path="/login" element={<div>Login screen</div>} />
          <Route
            path="/private"
            element={
              <ProtectedRoute>
                <div>Private content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Login screen")).toBeInTheDocument();
    expect(screen.queryByText("Private content")).not.toBeInTheDocument();
  });

  it("submits the login form through the email sign-in wrapper", async () => {
    const user = userEvent.setup();
    mockSignInWithEmail.mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText("Email"), "athlete@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "supersecret");
    await user.click(screen.getByRole("button", { name: /^Login$/i }));

    await waitFor(() => {
      expect(mockSignInWithEmail).toHaveBeenCalledWith(
        "athlete@example.com",
        "supersecret"
      );
    });

    expect(await screen.findByText("Dashboard")).toBeInTheDocument();
  });

  it("submits the signup form through the email signup wrapper", async () => {
    const user = userEvent.setup();
    mockSignUpWithEmail.mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={["/signup"]}>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText("Username"), "lifter");
    await user.type(screen.getByPlaceholderText("Email"), "lifter@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "supersecret");
    await user.type(screen.getByPlaceholderText("Confirm password"), "supersecret");
    await user.click(screen.getByRole("button", { name: /^Sign Up$/i }));

    await waitFor(() => {
      expect(mockSignUpWithEmail).toHaveBeenCalledWith(
        "lifter@example.com",
        "supersecret"
      );
    });

    expect(await screen.findByText("Dashboard")).toBeInTheDocument();
  });

  it("requests a password-reset email through the reset wrapper", async () => {
    const user = userEvent.setup();
    mockRequestPasswordReset.mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText("Email"), "athlete@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalledWith("athlete@example.com");
    });

    expect(
      await screen.findByText(/check your inbox/i)
    ).toBeInTheDocument();
  });

  it("submits the reset-password form through the password update wrapper", async () => {
    const user = userEvent.setup();
    mockUpdatePassword.mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText("New password"), "newsecret");
    await user.type(screen.getByPlaceholderText("Confirm new password"), "newsecret");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(mockUpdatePassword).toHaveBeenCalledWith("newsecret");
    });

    expect(
      await screen.findByText(/password updated/i)
    ).toBeInTheDocument();
  });
});
