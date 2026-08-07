export interface VirusScanner {
  scan(content: Buffer, metadata: { filename: string; mimeType: string }): Promise<"clean" | "infected" | "unknown">;
}

/**
 * No real AV engine is wired in V1. Treat uploads as unscanned/"clean" for availability.
 * Do not advertise antivirus in product/marketing copy.
 */
class NoopVirusScanner implements VirusScanner {
  async scan(): Promise<"clean"> {
    return "clean";
  }
}

export const virusScanner: VirusScanner = new NoopVirusScanner();
