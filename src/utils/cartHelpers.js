const calculateCartTotals = (items = []) => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

    return {
        totalItems,
        subtotal,
    };
};

const getEffectivePrice = (product) => {
    if (
        typeof product.discountPrice === "number" &&
        product.discountPrice > 0 &&
        product.discountPrice < product.price
    ) {
        return product.discountPrice;
    }

    return product.price;
};

module.exports = {
    calculateCartTotals,
    getEffectivePrice,
};