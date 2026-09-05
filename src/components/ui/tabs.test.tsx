import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

describe("Tabs", () => {
  it("renders the default tab content", () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">برگه الف</TabsTrigger>
          <TabsTrigger value="b">برگه ب</TabsTrigger>
        </TabsList>
        <TabsContent value="a">محتوای الف</TabsContent>
        <TabsContent value="b">محتوای ب</TabsContent>
      </Tabs>,
    );
    expect(screen.getByText("محتوای الف")).toBeInTheDocument();
    expect(screen.queryByText("محتوای ب")).not.toBeInTheDocument();
  });

  it("switches content on trigger click", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">برگه الف</TabsTrigger>
          <TabsTrigger value="b">برگه ب</TabsTrigger>
        </TabsList>
        <TabsContent value="a">محتوای الف</TabsContent>
        <TabsContent value="b">محتوای ب</TabsContent>
      </Tabs>,
    );
    await user.click(screen.getByRole("tab", { name: "برگه ب" }));
    expect(screen.getByText("محتوای ب")).toBeInTheDocument();
    expect(screen.queryByText("محتوای الف")).not.toBeInTheDocument();
  });

  it("notifies onValueChange", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Tabs defaultValue="a" onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="a">الف</TabsTrigger>
          <TabsTrigger value="b">ب</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    await user.click(screen.getByRole("tab", { name: "ب" }));
    expect(onValueChange).toHaveBeenCalledWith("b");
  });
});
