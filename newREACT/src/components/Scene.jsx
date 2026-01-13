import { Canvas } from '@react-three/fiber'
import { Experience } from './Experience'

export const Scene = () => {
    return (
        <Canvas
            camera={{
                position: [0, 0, 5],
                fov: 45
            }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100vh',
                pointerEvents: 'none', // Allow scrolling through the canvas
                zIndex: -1
            }}
        >
            <Experience />
        </Canvas>
    )
}
