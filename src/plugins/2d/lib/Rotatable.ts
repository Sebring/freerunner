
export interface Rotatable<R> {
  base: R
  rotated: R
  isDirty: boolean
  // origin: Point
  // rotate(degrees: number): R
}