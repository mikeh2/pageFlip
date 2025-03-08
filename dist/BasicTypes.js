/**
 * Flipping direction
 */
export var FlipDirection;
(function (FlipDirection) {
    FlipDirection[FlipDirection["FORWARD"] = 0] = "FORWARD";
    FlipDirection[FlipDirection["BACK"] = 1] = "BACK";
})(FlipDirection || (FlipDirection = {}));
/**
 * Active corner when flipping
 */
export var FlipCorner;
(function (FlipCorner) {
    FlipCorner["TOP"] = "top";
    FlipCorner["BOTTOM"] = "bottom";
})(FlipCorner || (FlipCorner = {}));
/**
 * State of the book
 */
export var FlippingState;
(function (FlippingState) {
    /** The user folding the page */
    FlippingState["USER_FOLD"] = "user_fold";
    /** Mouse over active corners */
    FlippingState["FOLD_CORNER"] = "fold_corner";
    /** During flipping animation */
    FlippingState["FLIPPING"] = "flipping";
    /** Base state */
    FlippingState["READ"] = "read";
})(FlippingState || (FlippingState = {}));
//# sourceMappingURL=BasicTypes.js.map