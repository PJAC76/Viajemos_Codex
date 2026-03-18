import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppShell } from "./layouts/app-shell";
import { SessionProvider } from "./providers/session-provider";

describe("AppShell", () => {
  it("renders the primary app brand", () => {
    render(
      <SessionProvider>
        <MemoryRouter initialEntries={["/trips"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppShell />
        </MemoryRouter>
      </SessionProvider>
    );

    expect(screen.getAllByText("Viajemos")[0]).toBeInTheDocument();
  });

  it("shows the main navigation destinations", () => {
    render(
      <SessionProvider>
        <MemoryRouter initialEntries={["/trips"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppShell />
        </MemoryRouter>
      </SessionProvider>
    );

    expect(screen.getAllByText("Mis viajes")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Explorar")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Perfil")[0]).toBeInTheDocument();
  });
});
