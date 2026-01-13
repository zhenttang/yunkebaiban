import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Float, Text, Environment, ContactShadows } from '@react-three/drei'

gsap.registerPlugin(ScrollTrigger)

export const Experience = () => {
    const cameraRef = useRef()
    const sceneRef = useRef()
    const tl = useRef()
    const { camera, scene } = useThree()

    useLayoutEffect(() => {
        // Create a timeline that is scrubbed by the scroll
        tl.current = gsap.timeline({
            scrollTrigger: {
                trigger: "body", // The entire body is the trigger
                start: "top top",
                end: "bottom bottom",
                scrub: 1, // Smooth scrubbing
            }
        })

        // Animation 1: Move camera deeper into the scene
        tl.current.to(camera.position, {
            z: -10,
            y: -2,
            duration: 10
        })

        // Animation 2: Rotate the scene slightly
        tl.current.to(scene.rotation, {
            y: Math.PI * 2,
            duration: 10
        }, 0) // Start at the same time

        return () => {
            // Cleanup
            if (tl.current) tl.current.kill()
            ScrollTrigger.getAll().forEach(t => t.kill())
        }
    }, [camera, scene])

    return (
        <>
            <Environment preset="city" />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />

            {/* Floating Objects */}
            <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                <mesh position={[0, 0, 0]}>
                    <torusKnotGeometry args={[1, 0.3, 100, 16]} />
                    <meshStandardMaterial color="#ff6b6b" roughness={0.1} metalness={0.8} />
                </mesh>
            </Float>

            <Float speed={1.5} rotationIntensity={2} floatIntensity={0.5}>
                <mesh position={[-3, 2, -5]}>
                    <boxGeometry />
                    <meshStandardMaterial color="#4ecdc4" roughness={0.2} metalness={0.5} />
                </mesh>
            </Float>

            <Float speed={2.5} rotationIntensity={1.5} floatIntensity={0.8}>
                <mesh position={[3, -2, -3]}>
                    <icosahedronGeometry />
                    <meshStandardMaterial color="#ffe66d" roughness={0.1} metalness={0.9} />
                </mesh>
            </Float>

            {/* Text in 3D space */}
            <Text
                position={[0, 0, -2]}
                fontSize={1}
                color="white"
                anchorX="center"
                anchorY="middle"
            >
                Scroll Down
            </Text>

            <Text
                position={[0, 0, -15]}
                fontSize={2}
                color="white"
                anchorX="center"
                anchorY="middle"
            >
                Keep Going
            </Text>

            <ContactShadows opacity={0.5} scale={10} blur={1} far={10} resolution={256} color="#000000" />
        </>
    )
}
