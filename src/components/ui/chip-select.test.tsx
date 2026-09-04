import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChipSelect } from "@/components/ui/chip-select";

describe("ChipSelect", () => {
  it("renders all options as buttons", () => {
    render(
      <ChipSelect
        options={["بهداشت خانواده", "ایمن‌سازی"]}
        selected={[]}
        onToggle={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "بهداشت خانواده" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "ایمن‌سازی" }),
    ).toBeInTheDocument();
  });

  it("calls onToggle when an option is clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<ChipSelect options={["الف"]} selected={[]} onToggle={onToggle} />);
    await user.click(screen.getByRole("button", { name: "الف" }));
    expect(onToggle).toHaveBeenCalledWith("الف");
  });

  it("marks selected options", () => {
    render(
      <ChipSelect options={["الف"]} selected={["الف"]} onToggle={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "الف" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("disables unselected options at the max limit", () => {
    render(
      <ChipSelect
        options={["الف", "ب"]}
        selected={["الف"]}
        max={1}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "ب" })).toBeDisabled();
  });
});
