import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render";
import Combobox, { filterOptions } from "@/components/ui/Combobox";

const OPTIONS = [
  { value: "12345", label: "Thandiwe Mokoena", description: "Premium · client 12345", keywords: "premium" },
  { value: "67890", label: "Sipho Dlamini", description: "Standard · client 67890", keywords: "standard" },
  { value: "13579", label: "Pieter van der Merwe", description: "Standard · client 13579", keywords: "standard" },
];

describe("filterOptions", () => {
  it("matches name, id or account, ignoring case, accents and word order", () => {
    expect(filterOptions(OPTIONS, "merwe").map((o) => o.value)).toEqual(["13579"]);
    expect(filterOptions(OPTIONS, "67890").map((o) => o.value)).toEqual(["67890"]);
    expect(filterOptions(OPTIONS, "STANDARD").map((o) => o.value)).toEqual(["67890", "13579"]);
    expect(filterOptions(OPTIONS, "merwe pieter").map((o) => o.value)).toEqual(["13579"]);
    expect(filterOptions([{ value: "1", label: "Zoë" }], "zoe")).toHaveLength(1);
    expect(filterOptions(OPTIONS, "")).toHaveLength(3);
    expect(filterOptions(OPTIONS, "nobody")).toHaveLength(0);
  });
});

function setup(value = "12345") {
  const onChange = vi.fn();
  renderWithProviders(<Combobox label="Viewing as" options={OPTIONS} value={value} onChange={onChange} />);
  return { onChange, button: screen.getByRole("button", { name: /viewing as: thandiwe mokoena/i }) };
}

describe("Combobox", () => {
  it("opens with a search box that has focus, and narrows as you type", async () => {
    const { button } = setup();
    await userEvent.click(button);
    const search = screen.getByRole("combobox", { name: /search viewing as/i });
    expect(search).toHaveFocus();
    expect(screen.getAllByRole("option")).toHaveLength(3);
    await userEvent.type(search, "sip");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option")).toHaveTextContent("Sipho Dlamini");
  });
  it("arrow keys move the highlight, Enter chooses, focus goes back to the button", async () => {
    const { button, onChange } = setup();
    button.focus();
    await userEvent.keyboard("{ArrowDown}");
    const search = screen.getByRole("combobox");
    expect(search).toHaveAttribute("aria-activedescendant", expect.stringContaining("opt-0"));
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenCalledWith("67890");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });
  it("Escape closes without choosing", async () => {
    const { button, onChange } = setup();
    await userEvent.click(button);
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
  it("marks the current choice and says when nothing matches", async () => {
    const { button } = setup();
    await userEvent.click(button);
    expect(screen.getByRole("option", { name: /thandiwe/i })).toHaveAttribute("aria-selected", "true");
    await userEvent.type(screen.getByRole("combobox"), "zzz");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText("Nothing matches")).toBeInTheDocument();
  });
  it("a click on an option chooses it", async () => {
    const { button, onChange } = setup();
    await userEvent.click(button);
    await userEvent.click(screen.getByRole("option", { name: /pieter/i }));
    expect(onChange).toHaveBeenCalledWith("13579");
  });
});
