/**
 * Ensure JSON responses can include Prisma BigInt fields (e.g. Document.sizeBytes).
 * Without this, Express throws "Do not know how to serialize a BigInt" after DB writes succeed.
 */
export function installBigIntJson() {
    const proto = BigInt.prototype;
    if (typeof proto.toJSON !== "function") {
        proto.toJSON = function toJSON() {
            return this.toString();
        };
    }
}
