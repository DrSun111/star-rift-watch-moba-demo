export interface BrushZone {
  id: string;
  x: number;
  z: number;
  width: number;
  depth: number;
}

export const BRUSH_ZONES: BrushZone[] = [
  { id: "north-river-left", x: -14, z: -24, width: 16, depth: 5.8 },
  { id: "north-river-right", x: 14, z: -24, width: 16, depth: 5.8 },
  { id: "south-river-left", x: -14, z: 24, width: 16, depth: 5.8 },
  { id: "south-river-right", x: 14, z: 24, width: 16, depth: 5.8 },
  { id: "top-mid-left", x: -28, z: -8.3, width: 12, depth: 4.2 },
  { id: "top-mid-right", x: 28, z: -8.3, width: 12, depth: 4.2 },
  { id: "bottom-mid-left", x: -28, z: 8.3, width: 12, depth: 4.2 },
  { id: "bottom-mid-right", x: 28, z: 8.3, width: 12, depth: 4.2 },
  { id: "ally-jungle-north", x: -42, z: -24, width: 11, depth: 5 },
  { id: "enemy-jungle-south", x: 42, z: 24, width: 11, depth: 5 }
];

export function pointInBrush(x: number, z: number, zone: BrushZone): boolean {
  return Math.abs(x - zone.x) <= zone.width / 2 && Math.abs(z - zone.z) <= zone.depth / 2;
}
