const errorHandler = (err, req, res, next) => {
    console.error(err);

    if (err.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: "Invalid resource id",
        });
    }

    if (err.name === "ValidationError") {
        const errors = Object.values(err.errors).map((item) => item.message);

        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors,
        });
    }

    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            message: "Duplicate field value entered",
            duplicateField: Object.keys(err.keyValue)[0],
        });
    }

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal server error",
    });
};

module.exports = errorHandler;