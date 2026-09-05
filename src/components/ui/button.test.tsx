import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>ذخیره</Button>);
    expect(screen.getByRole("button", { name: "ذخیره" })).toBeInTheDocument();
  });

  it("is disabled when loading", () => {
    render(<Button loading>ارسال</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("applies fullWidth class", () => {
    const { container } = render(<Button fullWidth>بله</Button>);
    expect(container.firstElementChild).toHaveClass("w-full");
  });

  it("calls onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>کلیک</Button>);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("respects disabled prop", () => {
    render(<Button disabled>غیرفعال</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
