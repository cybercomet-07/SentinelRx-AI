export default function Loader({ size = 'md', center = false }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={center ? 'flex items-center justify-center min-h-[50vh] w-full' : 'inline-flex'}>
      <div className={`${sizes[size]} border-2 border-mint-200 border-t-mint-500 rounded-full animate-spin`} />
    </div>
  )
}
