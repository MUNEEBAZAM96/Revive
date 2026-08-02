/*
 * REVIVE - Premium Wellness Logo Animation
 * 
 * REACT NATIVE / EXPO INTEGRATION GUIDE:
 * To use this directly in a React Native / Expo project:
 * 1. Install dependencies: 
 *    `npx expo install react-native-svg react-native-reanimated`
 * 2. Replace the web <svg> and <path> tags with Reanimated components:
 *    const AnimatedPath = Animated.createAnimatedComponent(Path);
 *    const AnimatedCircle = Animated.createAnimatedComponent(Circle);
 * 3. Replace CSS animations with Reanimated `useSharedValue` and `withTiming`.
 *    Example for the ring draw:
 *    const ringProgress = useSharedValue(629);
 *    // in useEffect: ringProgress.value = withDelay(2800, withTiming(0, { duration: 2000 }));
 *    // in animatedProps: strokeDashoffset: ringProgress.value
 */

import React from 'react';

export default function ReviveLogo() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      {/* Container to mock an app icon or splash screen context */}
      <div className="relative w-full max-w-md aspect-square shadow-2xl rounded-[3rem] overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#F7FAF7' }}>
        
        {}
        <svg viewBox="0 0 400 400" className="w-full h-full">
          <style>
            {`
              /* Base opacity for animated elements */
              .seed { opacity: 0; animation: fadeIn 1s ease-out 0.2s forwards; }
              
              /* Stroke drawing animation for the stem */
              .stem { 
                stroke-dasharray: 150; 
                stroke-dashoffset: 150; 
                animation: drawStroke 1.5s ease-in-out 1s forwards; 
              }
              
              /* Sun glow expansion */
              .sun { 
                opacity: 0; 
                transform-origin: 200px 165px; 
                animation: glowBurst 2.5s ease-out 1.5s forwards; 
              }
              
              /* Leaf popping/scaling animations */
              .leaf-scale-left { 
                opacity: 0; 
                transform-origin: 0px 0px; 
                animation: scaleInLeft 1s ease-out 1.8s forwards; 
              }
              .leaf-scale-right { 
                opacity: 0; 
                transform-origin: 0px 0px; 
                animation: scaleInRight 1s ease-out 2.2s forwards; 
              }
              
              /* Progress rings */
              .ring-bg { 
                opacity: 0; 
                animation: fadeIn 1.5s ease-out 2.5s forwards; 
              }
              .ring-active { 
                stroke-dasharray: 629; 
                stroke-dashoffset: 629; 
                transform: rotate(-90deg); 
                transform-origin: 200px 165px; 
                animation: drawStroke 2s cubic-bezier(0.4, 0, 0.2, 1) 2.8s forwards; 
              }
              
              /* Typography sliding up */
              .logo-text { 
                opacity: 0; 
                animation: slideUpText 1.2s ease-out 4s forwards; 
              }
              
              /* Continuous gentle pulsing for the plant core */
              .core-group { 
                transform-origin: 200px 165px; 
                animation: gentlePulse 4s ease-in-out 5.5s infinite; 
              }

              @keyframes fadeIn { 
                to { opacity: 1; } 
              }
              @keyframes drawStroke { 
                to { stroke-dashoffset: 0; } 
              }
              @keyframes glowBurst { 
                0% { opacity: 0; transform: scale(0.6); } 
                100% { opacity: 0.35; transform: scale(1.1); } 
              }
              @keyframes scaleInLeft { 
                0% { opacity: 0; transform: scale(0) rotate(-15deg); } 
                100% { opacity: 1; transform: scale(1) rotate(0deg); } 
              }
              @keyframes scaleInRight { 
                0% { opacity: 0; transform: scale(0) rotate(15deg); } 
                100% { opacity: 1; transform: scale(1) rotate(0deg); } 
              }
              @keyframes slideUpText { 
                0% { opacity: 0; transform: translateY(12px); } 
                100% { opacity: 1; transform: translateY(0); } 
              }
              @keyframes gentlePulse { 
                0%, 100% { transform: translateY(0) scale(1); } 
                50% { transform: translateY(-3px) scale(1.015); } 
              }
            `}
          </style>

          {}
          {/* Background Base (Fallback) */}
          <rect width="100%" height="100%" fill="#F7FAF7" rx="48" />

          {/* Outer Progress Rings */}
          <circle cx="200" cy="165" r="100" stroke="#A8D5BA" strokeWidth="2" fill="none" className="ring-bg" />
          <circle cx="200" cy="165" r="100" stroke="#3A8D6D" strokeWidth="4.5" strokeLinecap="round" fill="none" className="ring-active" />

          {/* Core Animated Group (Pulses after initialization) */}
          <g className="core-group">
            
            {}
            {/* Warm Sunlight Glow Behind Plant */}
            <circle cx="200" cy="165" r="70" fill="#F4D98C" className="sun" />

            {/* Organic Plant Stem */}
            <path 
              d="M 200 240 Q 180 180 203 115" 
              stroke="#3A8D6D" 
              strokeWidth="5" 
              strokeLinecap="round" 
              fill="none" 
              className="stem" 
            />

            {/* The Initial Seed */}
            <circle cx="200" cy="240" r="5.5" fill="#3A8D6D" className="seed" />

            {}
            {/* Left Leaf (Sage Green) - positioned accurately along the bezier curve */}
            <g transform="translate(191, 182) rotate(-65)">
              <path 
                d="M 0,0 C -18,-20 -22,-45 0,-60 C 22,-45 18,-20 0,0 Z" 
                fill="#A8D5BA" 
                className="leaf-scale-left" 
              />
            </g>

            {/* Right Leaf (Forest Green) - positioned higher up on the stem */}
            <g transform="translate(198, 135) rotate(45)">
              <path 
                d="M 0,0 C -15,-15 -18,-40 0,-52 C 18,-40 15,-15 0,0 Z" 
                fill="#3A8D6D" 
                className="leaf-scale-right" 
              />
            </g>
          </g>

          {/* Revive Typography */}
          <text 
            x="200" 
            y="330" 
            fontFamily="system-ui, -apple-system, sans-serif" 
            fontSize="26" 
            fontWeight="600" 
            fill="#3A8D6D" 
            textAnchor="middle" 
            letterSpacing="8" 
            className="logo-text"
          >
            REVIVE
          </text>
        </svg>
      </div>
    </div>
  );
}