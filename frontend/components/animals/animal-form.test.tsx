import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AnimalForm } from "@/components/animals/animal-form";
import { getDictionary } from "@/lib/i18n";

describe("AnimalForm", () => {
  afterEach(cleanup);
  it("submits exactly one age representation", async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    render(<AnimalForm dictionary={getDictionary("en")} submitting={false} error="" onSubmit={submit} />);
    await user.click(screen.getByLabelText("Exact birth date"));
    await user.type(screen.getByLabelText(/Birth date/), "2025-03-10");
    await user.click(screen.getByRole("button", { name: "Create animal" }));
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ birth_date: "2025-03-10", estimated_age_months: null }));
  });

  it("shows validation when the selected age is missing", async () => {
    const user = userEvent.setup();
    render(<AnimalForm dictionary={getDictionary("en")} submitting={false} error="" onSubmit={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Create animal" }));
    expect(await screen.findByText("Provide the selected age information.")).toBeInTheDocument();
  });

  it("shows an API validation failure and disables repeat submission while saving", () => {
    render(<AnimalForm dictionary={getDictionary("en")} submitting error="Farmer profile is required before creating animals" onSubmit={vi.fn()} />);
    expect(screen.getByText(/Farmer profile is required/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Creating animal..." })).toBeDisabled();
  });
});
