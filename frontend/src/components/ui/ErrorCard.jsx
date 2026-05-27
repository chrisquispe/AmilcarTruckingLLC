export default function ErrorCard({ message, onRetry }) {
  return (
    <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-xl text-red-700">
      <span className="text-xl shrink-0">⚠</span>
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-2 text-xs text-red-600 underline hover:no-underline">
            Try again
          </button>
        )}
      </div>
    </div>
  )
}
