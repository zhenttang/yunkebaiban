function randomFromInterval(min: number, max: number): number {
  // min and max included
  return Math.random() * (max - min) + min;
}

export function getEggShapePoints(a: number, b: number, k: number, segmentPoints: number): number[][] {
  // the function is x^2/a^2 * (1 + ky) + y^2/b^2 = 1
  const result: number[][] = [];
  
  for (let i = 0; i < segmentPoints; i++) {
    // x positive, y positive
    // first compute the degree
    const degree =
      (Math.PI / 2 / segmentPoints) * i +
      randomFromInterval(
        -Math.PI / 1.1 / segmentPoints,
        Math.PI / 1.1 / segmentPoints,
      );
    const y = Math.sin(degree) * b;
    const x =
      Math.sqrt(((1 - (y * y) / (b * b)) / (1 + k * y)) * a * a) +
      randomFromInterval(-a / 200.0, a / 200.0);
    result.push([x, y]);
  }
  
  for (let i = segmentPoints; i > 0; i--) {
    // x is negative, y is positive
    const degree =
      (Math.PI / 2 / segmentPoints) * i +
      randomFromInterval(
        -Math.PI / 1.1 / segmentPoints,
        Math.PI / 1.1 / segmentPoints,
      );
    const y = Math.sin(degree) * b;
    const x =
      -Math.sqrt(((1 - (y * y) / (b * b)) / (1 + k * y)) * a * a) +
      randomFromInterval(-a / 200.0, a / 200.0);
    result.push([x, y]);
  }
  
  for (let i = 0; i < segmentPoints; i++) {
    // x is negative, y is negative
    const degree =
      (Math.PI / 2 / segmentPoints) * i +
      randomFromInterval(
        -Math.PI / 1.1 / segmentPoints,
        Math.PI / 1.1 / segmentPoints,
      );
    const y = -Math.sin(degree) * b;
    const x =
      -Math.sqrt(((1 - (y * y) / (b * b)) / (1 + k * y)) * a * a) +
      randomFromInterval(-a / 200.0, a / 200.0);
    result.push([x, y]);
  }
  
  for (let i = segmentPoints; i > 0; i--) {
    // x is positive, y is negative
    const degree =
      (Math.PI / 2 / segmentPoints) * i +
      randomFromInterval(
        -Math.PI / 1.1 / segmentPoints,
        Math.PI / 1.1 / segmentPoints,
      );
    const y = -Math.sin(degree) * b;
    const x =
      Math.sqrt(((1 - (y * y) / (b * b)) / (1 + k * y)) * a * a) +
      randomFromInterval(-a / 200.0, a / 200.0);
    result.push([x, y]);
  }
  
  return result;
}

function findIntersectionPoints(radian: number, a: number, b: number): { x: number; y: number } {
  if (radian < 0) {
    radian = 0;
  }
  if (radian > Math.PI / 2) {
    radian = Math.PI / 2;
  }
  // a is width, b is height
  // Slope of the line
  const m = Math.tan(radian);
  // check if radian is close to 90 degrees
  if (Math.abs(radian - Math.PI / 2) < 0.0001) {
    return { x: 0, y: b };
  }
  // only checks the first quadrant
  const y = m * a;
  if (y < b) {
    // it intersects with the left side
    return { x: a, y: y };
  } else {
    // it intersects with the top side
    const x = b / m;
    return { x: x, y: b };
  }
}

export function generateRectangularFaceContourPoints(a: number, b: number, segmentPoints: number): number[][] {
  // a is width, b is height, segment_points is the number of points
  const result: number[][] = [];
  
  for (let i = 0; i < segmentPoints; i++) {
    const degree =
      (Math.PI / 2 / segmentPoints) * i +
      randomFromInterval(
        -Math.PI / 11 / segmentPoints,
        Math.PI / 11 / segmentPoints,
      );
    const intersection = findIntersectionPoints(degree, a, b);
    result.push([intersection.x, intersection.y]);
  }
  
  for (let i = segmentPoints; i > 0; i--) {
    // x is negative, y is positive
    const degree =
      (Math.PI / 2 / segmentPoints) * i +
      randomFromInterval(
        -Math.PI / 11 / segmentPoints,
        Math.PI / 11 / segmentPoints,
      );
    const intersection = findIntersectionPoints(degree, a, b);
    result.push([-intersection.x, intersection.y]);
  }
  
  for (let i = 0; i < segmentPoints; i++) {
    // x is negative, y is negative
    const degree =
      (Math.PI / 2 / segmentPoints) * i +
      randomFromInterval(
        -Math.PI / 11 / segmentPoints,
        Math.PI / 11 / segmentPoints,
      );
    const intersection = findIntersectionPoints(degree, a, b);
    result.push([-intersection.x, -intersection.y]);
  }
  
  for (let i = segmentPoints; i > 0; i--) {
    // x is positive, y is negative
    const degree =
      (Math.PI / 2 / segmentPoints) * i +
      randomFromInterval(
        -Math.PI / 11 / segmentPoints,
        Math.PI / 11 / segmentPoints,
      );
    const intersection = findIntersectionPoints(degree, a, b);
    result.push([intersection.x, -intersection.y]);
  }
  
  return result;
}

export interface FaceContourResult {
  face: number[][];
  width: number;
  height: number;
  center: [number, number];
}

export function generateFaceCountourPoints(numPoints: number = 100): FaceContourResult {
  const faceSizeX0 = randomFromInterval(50, 100);
  const faceSizeY0 = randomFromInterval(70, 100);

  const faceSizeY1 = randomFromInterval(50, 80);
  const faceSizeX1 = randomFromInterval(70, 100);
  const faceK0 =
    randomFromInterval(0.001, 0.005) * (Math.random() > 0.5 ? 1 : -1);
  const faceK1 =
    randomFromInterval(0.001, 0.005) * (Math.random() > 0.5 ? 1 : -1);
  const face0TranslateX = randomFromInterval(-5, 5);
  const face0TranslateY = randomFromInterval(-15, 15);

  const face1TranslateY = randomFromInterval(-5, 5);
  const face1TranslateX = randomFromInterval(-5, 25);
  const eggOrRect0 = Math.random() > 0.1;
  const eggOrRect1 = Math.random() > 0.3;

  const results0 = eggOrRect0
    ? getEggShapePoints(faceSizeX0, faceSizeY0, faceK0, numPoints)
    : generateRectangularFaceContourPoints(faceSizeX0, faceSizeY0, numPoints);
  const results1 = eggOrRect1
    ? getEggShapePoints(faceSizeX1, faceSizeY1, faceK1, numPoints)
    : generateRectangularFaceContourPoints(faceSizeX1, faceSizeY1, numPoints);
    
  for (let i = 0; i < results0.length; i++) {
    results0[i][0] += face0TranslateX;
    results0[i][1] += face0TranslateY;
    results1[i][0] += face1TranslateX;
    results1[i][1] += face1TranslateY;
  }
  
  const results: number[][] = [];
  let center: [number, number] = [0, 0];
  
  for (let i = 0; i < results0.length; i++) {
    results.push([
      results0[i][0] * 0.7 +
        results1[(i + Math.floor(results0.length / 4)) % results0.length][1] * 0.3,
      results0[i][1] * 0.7 -
        results1[(i + Math.floor(results0.length / 4)) % results0.length][0] * 0.3,
    ]);
    center[0] += results[i][0];
    center[1] += results[i][1];
  }
  
  center[0] /= results.length;
  center[1] /= results.length;
  
  // center the face
  for (let i = 0; i < results.length; i++) {
    results[i][0] -= center[0];
    results[i][1] -= center[1];
  }

  const width = results[0][0] - results[Math.floor(results.length / 2)][0];
  const height =
    results[Math.floor(results.length / 4)][1] - results[Math.floor((results.length * 3) / 4)][1];
  
  // add the first point to the end to close the shape
  results.push(results[0]);
  results.push(results[1]);
  
  return { face: results, width: width, height: height, center: [0, 0] };
}