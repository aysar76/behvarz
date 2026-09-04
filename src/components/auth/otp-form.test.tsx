import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OtpForm } from "@/components/auth/otp-form";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }),
}));

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("OtpForm", () => {
  beforeEach(() => {
    replace.mockReset();
    vi.restoreAllMocks();
  });

  it("rejects an invalid phone client-side", async () => {
    const user = userEvent.setup();
    render(<OtpForm />);
    await user.type(screen.getByLabelText("شماره موبایل"), "123");
    await user.click(screen.getByRole("button", { name: "دریافت کد تأیید" }));
    expect(
      await screen.findByText(/شماره موبایل معتبر نیست/),
    ).toBeInTheDocument();
  });

  it("requests an OTP and reveals the code step with the dev code", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ ok: true, data: { devCode: "123456" } }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<OtpForm />);
    await user.type(screen.getByLabelText("شماره موبایل"), "09123456789");
    await user.click(screen.getByRole("button", { name: "دریافت کد تأیید" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "09123456789" }),
    });
    expect(await screen.findByLabelText("کد تأیید ۶ رقمی")).toBeInTheDocument();
    expect(screen.getByText(/123456/)).toBeInTheDocument();
  });

  it("verifies the code and redirects to onboarding for a new user", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ ok: true, data: { devCode: "123456" } }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          ok: true,
          data: { user: { onboardingCompleted: false } },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<OtpForm />);
    await user.type(screen.getByLabelText("شماره موبایل"), "09123456789");
    await user.click(screen.getByRole("button", { name: "دریافت کد تأیید" }));
    await waitFor(() =>
      expect(screen.getByLabelText("کد تأیید ۶ رقمی")).toBeInTheDocument(),
    );
    await user.type(screen.getByLabelText("کد تأیید ۶ رقمی"), "123456");
    await user.click(screen.getByRole("button", { name: "ورود" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/onboarding"));
    expect(fetchMock).toHaveBeenLastCalledWith("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "09123456789", code: "123456" }),
    });
  });
});
