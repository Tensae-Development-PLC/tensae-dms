class NoopVirusScanner {
    async scan() {
        return "unknown";
    }
}
export const virusScanner = new NoopVirusScanner();
