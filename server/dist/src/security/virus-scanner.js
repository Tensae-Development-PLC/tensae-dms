/**
 * No real AV engine is wired in V1. Treat uploads as unscanned/"clean" for availability.
 * Do not advertise antivirus in product/marketing copy.
 */
class NoopVirusScanner {
    async scan() {
        return "clean";
    }
}
export const virusScanner = new NoopVirusScanner();
