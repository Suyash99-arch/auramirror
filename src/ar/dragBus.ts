// Shared state for "pinch and drag an accessory onto the mirror".
// useHandControl writes it, the floating ghost component reads it.
export const dragBus: {
  id: string | null; // accessory being dragged, null when nothing is held
  x: number;         // fingertip position in screen pixels
  y: number;
} = {
  id: null,
  x: 0,
  y: 0,
};