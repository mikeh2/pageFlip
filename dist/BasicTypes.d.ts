/**
 * Type representing a point on a plane
 */
export interface Point {
    x: number;
    y: number;
}
/**
 * Type representing a coordinates of the rectangle on the plane
 */
export interface RectPoints {
    /** Coordinates of the top left corner */
    topLeft: Point;
    /** Coordinates of the top right corner */
    topRight: Point;
    /** Coordinates of the bottom left corner */
    bottomLeft: Point;
    /** Coordinates of the bottom right corner */
    bottomRight: Point;
}
/**
 * Type representing a rectangle
 */
export interface Rect {
    left: number;
    top: number;
    width: number;
    height: number;
}
/**
 * Type representing a book area
 */
export interface PageRect {
    left: number;
    top: number;
    width: number;
    height: number;
    /** Page width. If portrait mode is equal to the width of the book. In landscape mode - half of the total width. */
    pageWidth: number;
}
/**
 * Type representing a line segment contains two points: start and end
 */
export type Segment = [Point, Point];
/**
 * Flipping direction
 */
export declare enum FlipDirection {
    FORWARD = 0,
    BACK = 1
}
/**
 * Active corner when flipping
 */
export declare enum FlipCorner {
    TOP = "top",
    BOTTOM = "bottom"
}
/**
 * State of the book
 */
export declare enum FlippingState {
    /** The user folding the page */
    USER_FOLD = "user_fold",
    /** Mouse over active corners */
    FOLD_CORNER = "fold_corner",
    /** During flipping animation */
    FLIPPING = "flipping",
    /** Base state */
    READ = "read"
}
