import { render, screen } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MockWeatherProvider, useMockWeather } from "./MockWeatherContext";

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

function Probe() {
  const mock = useMockWeather();
  return <div data-testid="mock">{JSON.stringify(mock)}</div>;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams());
});

describe("MockWeatherContext", () => {
  it("provides overrides parsed from the query string", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("_status=Snow&_temperatureCelsius=5"),
    );
    render(
      <MockWeatherProvider>
        <Probe />
      </MockWeatherProvider>,
    );
    expect(JSON.parse(screen.getByTestId("mock").textContent ?? "")).toEqual({
      status: "Snow",
      temperatureCelsius: 5,
    });
  });

  it("returns an empty object when used outside a provider", () => {
    render(<Probe />);
    expect(screen.getByTestId("mock").textContent).toBe("{}");
  });
});
