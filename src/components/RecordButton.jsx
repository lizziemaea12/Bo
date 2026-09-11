export default function RecordButton({ isRecording, onClick, disabled }) {
  return (
    <div className="flex-center flex-col gap-sm" style={{ marginTop: 'var(--space-lg)' }}>
      <button
        className={`record-btn ${isRecording ? 'recording' : ''}`}
        onClick={onClick}
        disabled={disabled}
        id="record-button"
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isRecording ? '⏹' : '🎤'}
      </button>
      <span style={{
        fontSize: 'var(--font-size-md)',
        fontWeight: 700,
        color: isRecording ? 'var(--color-coral)' : 'var(--text-secondary)',
      }}>
        {isRecording ? 'Tap when done!' : 'Read to Bo!'}
      </span>
    </div>
  );
}
