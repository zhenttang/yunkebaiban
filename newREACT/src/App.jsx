import React, { useEffect } from 'react'
import Lenis from 'lenis'
import { Scene } from './components/Scene'

function App() {
  useEffect(() => {
    const lenis = new Lenis()

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)
  }, [])

  return (
    <div className="App">
      <Scene />

      {/* Scrollable Content */}
      <div className="content">
        <section className="section">
          <h1>Welcome to the Void</h1>
          <p>Scroll to explore</p>
        </section>

        <section className="section">
          <h2>Deeper...</h2>
        </section>

        <section className="section">
          <h2>Almost there</h2>
        </section>

        <section className="section">
          <h2>The End</h2>
        </section>
      </div>
    </div>
  )
}

export default App
