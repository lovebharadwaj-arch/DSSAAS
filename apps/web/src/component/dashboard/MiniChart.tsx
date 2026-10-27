import "../../index.css";

export default function MiniChart({
  type = "line",
}: {
  type?: "line" | "bar";
}) {
  const bars = [28, 43, 34, 58, 47, 68, 53, 79, 61, 72, 58, 91];
  if (type === "bar")
    return (
      <div className="flex h-32 items-end gap-2">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-600/70 to-sky-400/90 transition hover:opacity-80"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    );
  return (
    <svg
      viewBox="0 0 500 150"
      className="h-36 w-full"
      preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity=".28" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[25, 60, 95, 130].map((y) => (
        <line
          key={y}
          x1="0"
          x2="500"
          y1={y}
          y2={y}
          stroke="#293449"
          strokeDasharray="4 6"
        />
      ))}
      <path
        d="M0 112 C24 100 36 110 58 83 S95 91 116 68 S153 85 177 64 S218 76 238 48 S274 65 296 56 S333 75 357 38 S394 52 416 30 S455 47 500 14 L500 150 L0 150 Z"
        fill="url(#chartFill)"
      />
      <path
        d="M0 112 C24 100 36 110 58 83 S95 91 116 68 S153 85 177 64 S218 76 238 48 S274 65 296 56 S333 75 357 38 S394 52 416 30 S455 47 500 14"
        fill="none"
        stroke="#818cf8"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
