export interface VirusScanner {
  scan(content: Buffer, metadata: { filename: string; mimeType: string }): Promise<"clean" | "infected" | "unknown">;
}

class NoopVirusScanner implements VirusScanner {
  async scan(): Promise<"unknown"> {
    return "unknown";
  }
}

export const virusScanner: VirusScanner = new NoopVirusScanner();
