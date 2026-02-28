import { Component } from 'react'
import Spline from '@splinetool/react-spline'

/**
 * Wraps Spline in an error boundary. When the scene fails to load
 * (e.g. invalid URL, "Data read, but end of buffer not reached"),
 * we render nothing so the gradient overlay shows instead.
 */
class SplineErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.warn('Spline scene failed to load:', error?.message)
  }

  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

export default function SplineBackground({ scene, className, style }) {
  return (
    <SplineErrorBoundary>
      <Spline
        scene={scene}
        className={className}
        style={style}
      />
    </SplineErrorBoundary>
  )
}
