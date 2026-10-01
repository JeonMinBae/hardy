import { layerOf, type Axis, type CubeSize, type Move, type Vec3 } from "./cube";

const cross = ([a, b, c]: Vec3, [x, y, z]: Vec3): Vec3 => [b * z - c * y, c * x - a * z, a * y - b * x];

/**
 * normal: 누른 스티커의 바깥 법선, tangent: 끈 방향(둘 다 축 정렬 단위벡터), cubie: 누른 조각 중심.
 * normal × tangent 축 둘레 +90° 를 돌리면 스티커가 tangent 쪽으로 움직인다
 */
export function dragMove(normal: Vec3, tangent: Vec3, cubie: Vec3, size: CubeSize): Move | null {
  const axisVector = cross(normal, tangent);
  const axis = axisVector.findIndex((v) => v !== 0);
  if (axis === -1) return null;
  return { axis: axis as Axis, layer: layerOf(cubie[axis], size), turns: axisVector[axis] > 0 ? 1 : -1 };
}
