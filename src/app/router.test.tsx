import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppShell } from "./layouts/app-shell";
import { SessionProvider } from "./providers/session-provider";

describe("AppShell", () => {
  it("renders the primary app brand", () => {
    render(
      <SessionProvider>
        <MemoryRouter initialEntries={["/trips"]}>
          <AppShell />
        </MemoryRouter>
      </SessionProvider>
    );

    expect(screen.getAllByText("Viajemos")[0]).toBeInTheDocument();
  });
});
