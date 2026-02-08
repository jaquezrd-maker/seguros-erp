const LoadingSpinner = ({ size = 40 }: { size?: number }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div
      className="border-4 border-slate-700 border-t-teal-500 rounded-full animate-spin"
      style={{ width: size, height: size }}
    />
  </div>
);

export default LoadingSpinner;
