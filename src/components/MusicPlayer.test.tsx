import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Song } from "@/lib/types";

import MusicPlayer from "./MusicPlayer";

const songWithAudio: Song = {
  title: "Raining Blood",
  artist: "Slayer",
  audioFile: "/audio/raining-blood.mp3",
};

const songWithoutAudio: Song = {
  title: "Raining Blood",
  artist: "Slayer",
};

beforeEach(() => {
  // jsdom does not implement HTMLMediaElement playback
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
});

describe("MusicPlayer", () => {
  it("renders nothing when song has no audioFile", () => {
    const { container } = render(<MusicPlayer song={songWithoutAudio} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders play button when song has audioFile", () => {
    render(<MusicPlayer song={songWithAudio} />);
    expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument();
  });

  it("renders seek slider", () => {
    render(<MusicPlayer song={songWithAudio} />);
    expect(screen.getByRole("slider", { name: /seek/i })).toBeInTheDocument();
  });

  it("renders initial time display", () => {
    render(<MusicPlayer song={songWithAudio} />);
    expect(screen.getByText(/0:00/)).toBeInTheDocument();
  });

  it("shows pause button when audio starts playing via autoplay", () => {
    render(<MusicPlayer song={songWithAudio} />);
    fireEvent.play(document.querySelector("audio")!);
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
  });

  it("calls play and shows pause button when play is clicked", () => {
    render(<MusicPlayer song={songWithAudio} />);
    fireEvent.click(screen.getByRole("button", { name: /play/i }));
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
  });

  it("calls pause and shows play button when pause is clicked", () => {
    render(<MusicPlayer song={songWithAudio} />);
    fireEvent.click(screen.getByRole("button", { name: /play/i }));
    fireEvent.click(screen.getByRole("button", { name: /pause/i }));
    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument();
  });

  it("disables controls when audio fails to load", () => {
    render(<MusicPlayer song={songWithAudio} />);
    fireEvent.error(document.querySelector("audio")!);
    expect(screen.getByRole("button", { name: /play/i })).toBeDisabled();
    expect(screen.getByRole("slider", { name: /seek/i })).toBeDisabled();
  });

  it("updates currentTime when seek slider changes", () => {
    render(<MusicPlayer song={songWithAudio} />);
    const audio = document.querySelector("audio")!;
    // Simulate the browser reporting duration so the slider max > 0
    Object.defineProperty(audio, "duration", {
      value: 300,
      configurable: true,
    });
    fireEvent(audio, new Event("loadedmetadata"));
    const slider = screen.getByRole("slider", { name: /seek/i });
    fireEvent.change(slider, { target: { value: "30" } });
    expect(slider).toHaveValue("30");
  });
});
