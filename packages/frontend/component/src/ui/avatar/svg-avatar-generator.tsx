import { forwardRef, useCallback, useMemo, useState, useEffect } from 'react';
import { generateFaceCountourPoints } from './utils/face-shape';
import { generateBothEyes } from './utils/eye-shape';
import { 
  generateHairLines0, 
  generateHairLines1, 
  generateHairLines2, 
  generateHairLines3 
} from './utils/hair-lines';
import {
  generateMouthShape0,
  generateMouthShape1,
  generateMouthShape2
} from './utils/mouth-shape';

function randomFromInterval(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Hair colors array
const HAIR_COLORS = [
  'rgb(0, 0, 0)', // Black
  'rgb(44, 34, 43)', // Dark Brown
  'rgb(80, 68, 68)', // Medium Brown
  'rgb(167, 133, 106)', // Light Brown
  'rgb(220, 208, 186)', // Blond
  'rgb(233, 236, 239)', // Platinum Blond
  'rgb(165, 42, 42)', // Red
  'rgb(145, 85, 61)', // Auburn
  'rgb(128, 128, 128)', // Grey
  'rgb(185, 55, 55)', // Fire
];

// Background colors array
const BACKGROUND_COLORS = [
  'rgb(245, 245, 220)', // Soft Beige
  'rgb(176, 224, 230)', // Pale Blue
  'rgb(211, 211, 211)', // Light Grey
  'rgb(152, 251, 152)', // Pastel Green
  'rgb(255, 253, 208)', // Cream
  'rgb(230, 230, 250)', // Muted Lavender
  'rgb(188, 143, 143)', // Dusty Rose
  'rgb(135, 206, 235)', // Sky Blue
  'rgb(245, 255, 250)', // Mint Cream
  'rgb(245, 222, 179)', // Wheat
];

interface SVGAvatarData {
  faceScale: number;
  computedFacePoints: number[][];
  eyeRightUpper: number[][];
  eyeRightLower: number[][];
  eyeRightCountour: number[][];
  eyeLeftUpper: number[][];
  eyeLeftLower: number[][];
  eyeLeftCountour: number[][];
  faceHeight: number;
  faceWidth: number;
  center: [number, number];
  distanceBetweenEyes: number;
  leftEyeOffsetX: number;
  leftEyeOffsetY: number;
  rightEyeOffsetX: number;
  rightEyeOffsetY: number;
  eyeHeightOffset: number;
  rightPupilShiftX: number;
  rightPupilShiftY: number;
  leftPupilShiftX: number;
  leftPupilShiftY: number;
  rightNoseCenterX: number;
  rightNoseCenterY: number;
  leftNoseCenterX: number;
  leftNoseCenterY: number;
  hairs: number[][][];
  haventSleptForDays: boolean;
  hairColor: string;
  dyeColorOffset: string;
  backgroundColor: string;
  mouthPoints: number[][];
}

export interface SVGAvatarGeneratorProps {
  size?: number;
  className?: string;
  seed?: string | number;
  onGenerate?: () => void;
}

function pointsToString(points: number[][]): string {
  return points.map(point => `${point[0]},${point[1]}`).join(' ');
}

export const SVGAvatarGenerator = forwardRef<SVGElement, SVGAvatarGeneratorProps>(
  ({ size = 200, className, seed, onGenerate }, ref) => {
    const generateAvatarData = useCallback((): SVGAvatarData => {
      // Set seed if provided
      if (seed !== undefined) {
        // Simple seeded random implementation would go here
        // For now using Math.random
      }

      const faceScale = 1.5 + Math.random() * 0.6;
      const haventSleptForDays = Math.random() > 0.8;
      
      const faceResults = generateFaceCountourPoints();
      const computedFacePoints = faceResults.face;
      const faceHeight = faceResults.height;
      const faceWidth = faceResults.width;
      const center = faceResults.center;
      
      const eyes = generateBothEyes(faceWidth / 2);
      const left = eyes.left;
      const right = eyes.right;
      
      const eyeRightUpper = right.upper;
      const eyeRightLower = right.lower;
      const eyeRightCountour = right.upper
        .slice(10, 90)
        .concat(right.lower.slice(10, 90).reverse());
      const eyeLeftUpper = left.upper;
      const eyeLeftLower = left.lower;
      const eyeLeftCountour = left.upper
        .slice(10, 90)
        .concat(left.lower.slice(10, 90).reverse());
        
      const distanceBetweenEyes = randomFromInterval(faceWidth / 4.5, faceWidth / 4);
      const eyeHeightOffset = randomFromInterval(faceHeight / 8, faceHeight / 6);
      const leftEyeOffsetX = randomFromInterval(-faceWidth / 20, faceWidth / 10);
      const leftEyeOffsetY = randomFromInterval(-faceHeight / 50, faceHeight / 50);
      const rightEyeOffsetX = randomFromInterval(-faceWidth / 20, faceWidth / 10);
      const rightEyeOffsetY = randomFromInterval(-faceHeight / 50, faceHeight / 50);
      
      // Generate pupil positions
      const leftInd0 = Math.floor(randomFromInterval(10, left.upper.length - 10));
      const rightInd0 = Math.floor(randomFromInterval(10, right.upper.length - 10));
      const leftInd1 = Math.floor(randomFromInterval(10, left.upper.length - 10));
      const rightInd1 = Math.floor(randomFromInterval(10, right.upper.length - 10));
      const leftLerp = randomFromInterval(0.2, 0.8);
      const rightLerp = randomFromInterval(0.2, 0.8);

      const leftPupilShiftY = left.upper[leftInd0][1] * leftLerp + left.lower[leftInd1][1] * (1 - leftLerp);
      const rightPupilShiftY = right.upper[rightInd0][1] * rightLerp + right.lower[rightInd1][1] * (1 - rightLerp);
      const leftPupilShiftX = left.upper[leftInd0][0] * leftLerp + left.lower[leftInd1][0] * (1 - leftLerp);
      const rightPupilShiftX = right.upper[rightInd0][0] * rightLerp + right.lower[rightInd1][0] * (1 - rightLerp);

      // Generate hair
      const numHairMethods = 4;
      const numHairLines = Array.from({ length: numHairMethods }, () => Math.floor(randomFromInterval(0, 50)));
      let hairs: number[][][] = [];
      
      if (Math.random() > 0.3) {
        hairs = generateHairLines0(computedFacePoints, numHairLines[0] * 1 + 10);
      }
      if (Math.random() > 0.3) {
        hairs = hairs.concat(generateHairLines1(computedFacePoints, numHairLines[1] / 1.5 + 10));
      }
      if (Math.random() > 0.5) {
        hairs = hairs.concat(generateHairLines2(computedFacePoints, numHairLines[2] * 3 + 10));
      }
      if (Math.random() > 0.5) {
        hairs = hairs.concat(generateHairLines3(computedFacePoints, numHairLines[3] * 3 + 10));
      }

      // Generate nose
      const rightNoseCenterX = randomFromInterval(faceWidth / 18, faceWidth / 12);
      const rightNoseCenterY = randomFromInterval(0, faceHeight / 5);
      const leftNoseCenterX = randomFromInterval(-faceWidth / 18, -faceWidth / 12);
      const leftNoseCenterY = rightNoseCenterY + randomFromInterval(-faceHeight / 30, faceHeight / 20);

      // Generate hair color
      const hairColor = Math.random() > 0.1 
        ? HAIR_COLORS[Math.floor(Math.random() * 10)]
        : 'url(#rainbowGradient)';
      const dyeColorOffset = randomFromInterval(0, 100) + '%';

      // Generate background color
      const backgroundColor = BACKGROUND_COLORS[Math.floor(Math.random() * BACKGROUND_COLORS.length)];

      // Generate mouth
      const choice = Math.floor(Math.random() * 3);
      let mouthPoints: number[][];
      if (choice === 0) {
        mouthPoints = generateMouthShape0(computedFacePoints, faceHeight, faceWidth);
      } else if (choice === 1) {
        mouthPoints = generateMouthShape1(computedFacePoints, faceHeight, faceWidth);
      } else {
        mouthPoints = generateMouthShape2(computedFacePoints, faceHeight, faceWidth);
      }

      return {
        faceScale,
        computedFacePoints,
        eyeRightUpper,
        eyeRightLower,
        eyeRightCountour,
        eyeLeftUpper,
        eyeLeftLower,
        eyeLeftCountour,
        faceHeight,
        faceWidth,
        center,
        distanceBetweenEyes,
        leftEyeOffsetX,
        leftEyeOffsetY,
        rightEyeOffsetX,
        rightEyeOffsetY,
        eyeHeightOffset,
        rightPupilShiftX,
        rightPupilShiftY,
        leftPupilShiftX,
        leftPupilShiftY,
        rightNoseCenterX,
        rightNoseCenterY,
        leftNoseCenterX,
        leftNoseCenterY,
        hairs,
        haventSleptForDays,
        hairColor,
        dyeColorOffset,
        backgroundColor,
        mouthPoints,
      };
    }, [seed]);

    const [avatarData, setAvatarData] = useState<SVGAvatarData>(() => generateAvatarData());

    // 响应 seed 变化，重新生成头像
    useEffect(() => {
      setAvatarData(generateAvatarData());
      onGenerate?.();
    }, [seed, generateAvatarData, onGenerate]);

    const regenerate = useCallback(() => {
      setAvatarData(generateAvatarData());
      onGenerate?.();
    }, [generateAvatarData, onGenerate]);

    const svgContent = useMemo(() => {
      const {
        faceScale,
        computedFacePoints,
        eyeRightUpper,
        eyeRightLower,
        eyeRightCountour,
        eyeLeftUpper,
        eyeLeftLower,
        eyeLeftCountour,
        center,
        distanceBetweenEyes,
        leftEyeOffsetX,
        leftEyeOffsetY,
        rightEyeOffsetX,
        rightEyeOffsetY,
        eyeHeightOffset,
        rightPupilShiftX,
        rightPupilShiftY,
        leftPupilShiftX,
        leftPupilShiftY,
        rightNoseCenterX,
        rightNoseCenterY,
        leftNoseCenterX,
        leftNoseCenterY,
        hairs,
        haventSleptForDays,
        hairColor,
        dyeColorOffset,
        backgroundColor,
        mouthPoints,
      } = avatarData;

      return (
        <svg
          ref={ref}
          viewBox="-100 -100 200 200"
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          className={className}
        >
          <defs>
            <clipPath id="leftEyeClipPath">
              <polyline points={pointsToString(eyeLeftCountour)} />
            </clipPath>
            <clipPath id="rightEyeClipPath">
              <polyline points={pointsToString(eyeRightCountour)} />
            </clipPath>

            <filter id="fuzzy">
              <feTurbulence
                id="turbulence"
                baseFrequency="0.05"
                numOctaves="3"
                type="turbulence"
                result="noise"
              />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
            </filter>
            
            <linearGradient id="rainbowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop
                offset="0%"
                stopColor={HAIR_COLORS[Math.floor(Math.random() * 10)]}
                stopOpacity="1"
              />
              <stop
                offset={dyeColorOffset}
                stopColor={HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)]}
                stopOpacity="1"
              />
              <stop
                offset="100%"
                stopColor={HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)]}
                stopOpacity="1"
              />
            </linearGradient>
          </defs>
          
          <title>Generated Avatar</title>
          <desc>Generated by ugly-avatar algorithm</desc>
          
          {/* Background */}
          <rect
            x="-100"
            y="-100"
            width="100%"
            height="100%"
            fill={backgroundColor}
          />
          
          {/* Face */}
          <polyline
            id="faceContour"
            points={pointsToString(computedFacePoints)}
            fill="#ffc9a9"
            stroke="black"
            strokeWidth={3.0 / faceScale}
            strokeLinejoin="round"
            filter="url(#fuzzy)"
          />

          {/* Eyes */}
          <g
            transform={`translate(${center[0] + distanceBetweenEyes + rightEyeOffsetX} ${-(-center[1] + eyeHeightOffset + rightEyeOffsetY)})`}
          >
            <polyline
              points={pointsToString(eyeRightCountour)}
              fill="white"
              stroke="white"
              strokeWidth={0.0 / faceScale}
              strokeLinejoin="round"
              filter="url(#fuzzy)"
            />
          </g>
          
          <g
            transform={`translate(${-(center[0] + distanceBetweenEyes + leftEyeOffsetX)} ${-(-center[1] + eyeHeightOffset + leftEyeOffsetY)})`}
          >
            <polyline
              points={pointsToString(eyeLeftCountour)}
              fill="white"
              stroke="white"
              strokeWidth={0.0 / faceScale}
              strokeLinejoin="round"
              filter="url(#fuzzy)"
            />
          </g>

          {/* Eye lines */}
          <g
            transform={`translate(${center[0] + distanceBetweenEyes + rightEyeOffsetX} ${-(-center[1] + eyeHeightOffset + rightEyeOffsetY)})`}
          >
            <polyline
              points={pointsToString(eyeRightUpper)}
              fill="none"
              stroke="black"
              strokeWidth={(haventSleptForDays ? 5.0 : 3.0) / faceScale}
              strokeLinejoin="round"
              strokeLinecap="round"
              filter="url(#fuzzy)"
            />
            <polyline
              points={pointsToString(eyeRightLower)}
              fill="none"
              stroke="black"
              strokeWidth={(haventSleptForDays ? 5.0 : 3.0) / faceScale}
              strokeLinejoin="round"
              strokeLinecap="round"
              filter="url(#fuzzy)"
            />
            {/* Pupils */}
            {Array.from({ length: 10 }, (_, i) => (
              <circle
                key={i}
                r={Math.random() * 2 + 3.0}
                cx={rightPupilShiftX + Math.random() * 5 - 2.5}
                cy={rightPupilShiftY + Math.random() * 5 - 2.5}
                stroke="black"
                fill="none"
                strokeWidth={1.0 + Math.random() * 0.5}
                filter="url(#fuzzy)"
                clipPath="url(#rightEyeClipPath)"
              />
            ))}
          </g>

          <g
            transform={`translate(${-(center[0] + distanceBetweenEyes + leftEyeOffsetX)} ${-(-center[1] + eyeHeightOffset + leftEyeOffsetY)})`}
          >
            <polyline
              points={pointsToString(eyeLeftUpper)}
              fill="none"
              stroke="black"
              strokeWidth={(haventSleptForDays ? 5.0 : 3.0) / faceScale}
              strokeLinejoin="round"
              filter="url(#fuzzy)"
            />
            <polyline
              points={pointsToString(eyeLeftLower)}
              fill="none"
              stroke="black"
              strokeWidth={(haventSleptForDays ? 5.0 : 3.0) / faceScale}
              strokeLinejoin="round"
              filter="url(#fuzzy)"
            />
            {/* Pupils */}
            {Array.from({ length: 10 }, (_, i) => (
              <circle
                key={i}
                r={Math.random() * 2 + 3.0}
                cx={leftPupilShiftX + Math.random() * 5 - 2.5}
                cy={leftPupilShiftY + Math.random() * 5 - 2.5}
                stroke="black"
                fill="none"
                strokeWidth={1.0 + Math.random() * 0.5}
                filter="url(#fuzzy)"
                clipPath="url(#leftEyeClipPath)"
              />
            ))}
          </g>

          {/* Hair */}
          <g id="hairs">
            {hairs.map((hair, index) => (
              <polyline
                key={index}
                points={pointsToString(hair)}
                fill="none"
                stroke={hairColor}
                strokeWidth={0.5 + Math.random() * 2.5}
                strokeLinejoin="round"
                filter="url(#fuzzy)"
              />
            ))}
          </g>

          {/* Nose */}
          {Math.random() > 0.5 ? (
            <g id="pointNose">
              <g id="rightNose">
                {Array.from({ length: 10 }, (_, i) => (
                  <circle
                    key={i}
                    r={Math.random() * 2 + 1.0}
                    cx={rightNoseCenterX + Math.random() * 4 - 2}
                    cy={rightNoseCenterY + Math.random() * 4 - 2}
                    stroke="black"
                    fill="none"
                    strokeWidth={1.0 + Math.random() * 0.5}
                    filter="url(#fuzzy)"
                  />
                ))}
              </g>
              <g id="leftNose">
                {Array.from({ length: 10 }, (_, i) => (
                  <circle
                    key={i}
                    r={Math.random() * 2 + 1.0}
                    cx={leftNoseCenterX + Math.random() * 4 - 2}
                    cy={leftNoseCenterY + Math.random() * 4 - 2}
                    stroke="black"
                    fill="none"
                    strokeWidth={1.0 + Math.random() * 0.5}
                    filter="url(#fuzzy)"
                  />
                ))}
              </g>
            </g>
          ) : (
            <g id="lineNose">
              <path
                d={`M ${leftNoseCenterX} ${leftNoseCenterY}, Q${rightNoseCenterX} ${rightNoseCenterY * 1.5},${(leftNoseCenterX + rightNoseCenterX) / 2} ${-eyeHeightOffset * 0.2}`}
                fill="none"
                stroke="black"
                strokeWidth={2.5 + Math.random() * 1.0}
                strokeLinejoin="round"
                filter="url(#fuzzy)"
              />
            </g>
          )}

          {/* Mouth */}
          <g id="mouth">
            <polyline
              points={pointsToString(mouthPoints)}
              fill="rgb(215,127,140)"
              stroke="black"
              strokeWidth={2.7 + Math.random() * 0.5}
              strokeLinejoin="round"
              filter="url(#fuzzy)"
            />
          </g>
        </svg>
      );
    }, [avatarData, size, className]);

    return svgContent;
  }
);

SVGAvatarGenerator.displayName = 'SVGAvatarGenerator';