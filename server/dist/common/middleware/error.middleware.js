export function errorMiddleware(err, req, res, _next) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    res.status(500).json({
        message,
        requestId: req.requestContext?.requestId,
    });
}
