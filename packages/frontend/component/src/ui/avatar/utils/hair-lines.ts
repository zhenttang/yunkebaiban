function randomFromInterval(min: number, max: number): number {
  // min and max included
  return Math.random() * (max - min) + min;
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

function binomialCoefficient(n: number, k: number): number {
  return factorial(n) / (factorial(k) * factorial(n - k));
}

interface Point {
  x: number;
  y: number;
}

function calculateBezierPoint(t: number, controlPoints: Point[]): number[] {
  let x = 0, y = 0;
  const n = controlPoints.length - 1;

  for (let i = 0; i <= n; i++) {
    const binCoeff = binomialCoefficient(n, i);
    const a = Math.pow(1 - t, n - i);
    const b = Math.pow(t, i);
    x += binCoeff * a * b * controlPoints[i].x;
    y += binCoeff * a * b * controlPoints[i].y;
  }

  return [x, y];
}

function computeBezierCurve(controlPoints: Point[], numberOfPoints: number): number[][] {
  const curve: number[][] = [];
  for (let i = 0; i <= numberOfPoints; i++) {
    const t = i / numberOfPoints;
    const point = calculateBezierPoint(t, controlPoints);
    curve.push(point);
  }
  return curve;
}

export function generateHairLines0(faceCountour: number[][], numHairLines: number = 100): number[][][] {
  const faceCountourCopy = faceCountour.slice(0, faceCountour.length - 2);
  const results: number[][][] = [];
  
  for (let i = 0; i < numHairLines; i++) {
    const numHairPoints = 20 + Math.floor(randomFromInterval(-5, 5));
    // we generate some hair lines
    let hair_line: Point[] = [];
    let index_offset = Math.floor(randomFromInterval(30, 140));
    
    for (let j = 0; j < numHairPoints; j++) {
      hair_line.push({
        x: faceCountourCopy[(faceCountourCopy.length - (j + index_offset)) % faceCountourCopy.length][0], 
        y: faceCountourCopy[(faceCountourCopy.length - (j + index_offset)) % faceCountourCopy.length][1]
      });
    }
    
    const d0 = computeBezierCurve(hair_line, numHairPoints);
    hair_line = [];
    index_offset = Math.floor(randomFromInterval(30, 140));
    
    for (let j = 0; j < numHairPoints; j++) {
      hair_line.push({
        x: faceCountourCopy[(faceCountourCopy.length - (-j + index_offset)) % faceCountourCopy.length][0], 
        y: faceCountourCopy[(faceCountourCopy.length - (-j + index_offset)) % faceCountourCopy.length][1]
      });
    }
    
    const d1 = computeBezierCurve(hair_line, numHairPoints);
    const d: number[][] = [];
    
    for (let j = 0; j < numHairPoints; j++) {
      const weight = (j * (1 / numHairPoints)) ** 2;
      d.push([
        d0[j][0] * weight + d1[j][0] * (1 - weight), 
        d0[j][1] * weight + d1[j][1] * (1 - weight)
      ]);
    }

    results.push(d);
  }
  return results;
}

export function generateHairLines1(faceCountour: number[][], numHairLines: number = 100): number[][][] {
  const faceCountourCopy = faceCountour.slice(0, faceCountour.length - 2);
  const results: number[][][] = [];
  
  for (let i = 0; i < numHairLines; i++) {
    const numHairPoints = 20 + Math.floor(randomFromInterval(-5, 5));
    // we generate some hair lines
    const hair_line: Point[] = [];
    let index_start = Math.floor(randomFromInterval(20, 160));
    
    hair_line.push({
      x: faceCountourCopy[(faceCountourCopy.length - index_start) % faceCountourCopy.length][0], 
      y: faceCountourCopy[(faceCountourCopy.length - index_start) % faceCountourCopy.length][1]
    });

    for (let j = 1; j < numHairPoints + 1; j++) {
      index_start = Math.floor(randomFromInterval(20, 160));
      hair_line.push({
        x: faceCountourCopy[(faceCountourCopy.length - index_start) % faceCountourCopy.length][0], 
        y: faceCountourCopy[(faceCountourCopy.length - index_start) % faceCountourCopy.length][1]
      });
    }
    
    const d = computeBezierCurve(hair_line, numHairPoints);
    results.push(d);
  }
  return results;
}

export function generateHairLines2(faceCountour: number[][], numHairLines: number = 100): number[][][] {
  const faceCountourCopy = faceCountour.slice(0, faceCountour.length - 2);
  const results: number[][][] = [];
  const pickedIndices: number[] = [];
  
  for (let i = 0; i < numHairLines; i++) {
    pickedIndices.push(Math.floor(randomFromInterval(10, 180)));
  }
  pickedIndices.sort();
  
  for (let i = 0; i < numHairLines; i++) {
    const numHairPoints = 20 + Math.floor(randomFromInterval(-5, 5));
    // we generate some hair lines
    const hair_line: Point[] = [];
    const index_offset = pickedIndices[i];
    const lower = randomFromInterval(0.8, 1.4);
    const reverse = Math.random() > 0.5 ? 1 : -1;
    
    for (let j = 0; j < numHairPoints; j++) {
      const powerscale = randomFromInterval(0.1, 3);
      const portion = (1 - (j / numHairPoints) ** powerscale) * (1 - lower) + lower;
      hair_line.push({
        x: faceCountourCopy[(faceCountourCopy.length - (reverse * j + index_offset)) % faceCountourCopy.length][0] * portion, 
        y: faceCountourCopy[(faceCountourCopy.length - (reverse * j + index_offset)) % faceCountourCopy.length][1] * portion
      });
    }
    
    let d = computeBezierCurve(hair_line, numHairPoints);
    if (Math.random() > 0.7) d = d.reverse();
    
    if (results.length === 0) {
      results.push(d);
      continue;
    }
    
    const lastHairPoint = results[results.length - 1][results[results.length - 1].length - 1];
    const lastPointsDistance = Math.sqrt((d[0][0] - lastHairPoint[0]) ** 2 + (d[0][1] - lastHairPoint[1]) ** 2);
    
    if (Math.random() > 0.5 && lastPointsDistance < 100) {
      results[results.length - 1] = results[results.length - 1].concat(d);
    } else {
      results.push(d);
    }
  }
  return results;
}

export function generateHairLines3(faceCountour: number[][], numHairLines: number = 100): number[][][] {
  const faceCountourCopy = faceCountour.slice(0, faceCountour.length - 2);
  const results: number[][][] = [];
  const pickedIndices: number[] = [];
  
  for (let i = 0; i < numHairLines; i++) {
    pickedIndices.push(Math.floor(randomFromInterval(10, 180)));
  }
  pickedIndices.sort();
  
  const splitPoint = Math.floor(randomFromInterval(0, 200));
  
  for (let i = 0; i < numHairLines; i++) {
    const numHairPoints = 30 + Math.floor(randomFromInterval(-8, 8));
    // we generate some hair lines
    const hair_line: Point[] = [];
    const index_offset = pickedIndices[i];
    let lower = randomFromInterval(1, 2.3);
    if (Math.random() > 0.9) lower = randomFromInterval(0, 1);
    const reverse = index_offset > splitPoint ? 1 : -1;
    
    for (let j = 0; j < numHairPoints; j++) {
      const powerscale = randomFromInterval(0.1, 3);
      const portion = (1 - (j / numHairPoints) ** powerscale) * (1 - lower) + lower;
      hair_line.push({
        x: faceCountourCopy[(faceCountourCopy.length - (reverse * j * 2 + index_offset)) % faceCountourCopy.length][0] * portion, 
        y: faceCountourCopy[(faceCountourCopy.length - (reverse * j * 2 + index_offset)) % faceCountourCopy.length][1]
      });
    }
    
    const d = computeBezierCurve(hair_line, numHairPoints);
    results.push(d);
  }
  return results;
}