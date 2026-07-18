export const healthController = {
    check(_req, res) {
        res.status(200).json({ status: "ok" });
    },
};
