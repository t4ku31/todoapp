import { Card } from "@/components/ui/card";
import type { PomodoroPhase } from "@/store/usePomodoroStore";

interface TimerRingProps {
  timeLeft: number;
  phase: PomodoroPhase;
  progress: number;
  dailyFocusTime: number;
  totalFocusTime: number;
  dailyGoal: number;
  onAdjustTime?: (seconds: number) => void;
}

export function TimerRing({
  timeLeft,
  phase,
  progress,
  dailyFocusTime,
  totalFocusTime,
  dailyGoal,
  onAdjustTime,
}: TimerRingProps) {
  // Format time mm:ss
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Phase colors
  const phaseColors = {
    focus: { text: 'text-purple-600' },
    shortBreak: { text: 'text-green-600' },
    longBreak: { text: 'text-blue-600' },
  };
  const colors = phaseColors[phase];

  // Phase label
  const phaseLabel = phase === 'focus' ? 'フォーカス' : phase === 'shortBreak' ? '小休憩' : '長休憩';

  return (
    <Card className="relative w-72 h-72 rounded-full border-none shadow-xl bg-white/80 backdrop-blur-sm">
      {/* Progress Ring */}
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            {phase === 'focus' ? (
              <>
                <stop offset="0%" stopColor="#8b5cf6">
                  <animate attributeName="stop-color" values="#8b5cf6;#ec4899;#8b5cf6" dur="3s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="#a855f7">
                  <animate attributeName="stop-color" values="#a855f7;#8b5cf6;#a855f7" dur="3s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#ec4899">
                  <animate attributeName="stop-color" values="#ec4899;#a855f7;#ec4899" dur="3s" repeatCount="indefinite" />
                </stop>
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#10b981">
                  <animate attributeName="stop-color" values="#10b981;#34d399;#10b981" dur="3s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="#34d399">
                  <animate attributeName="stop-color" values="#34d399;#10b981;#34d399" dur="3s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#6ee7b7">
                  <animate attributeName="stop-color" values="#6ee7b7;#34d399;#6ee7b7" dur="3s" repeatCount="indefinite" />
                </stop>
              </>
            )}
          </linearGradient>
        </defs>
        {/* Background circle */}
        <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="6" />
        {/* Progress circle */}
        <circle
          cx="50" cy="50" r="45"
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 45}`}
          strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      
      {/* Time Display with +/- buttons */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-6xl font-black text-gray-800 tracking-tight">
          {formattedTime}
        </span>
        
        {/* +/- buttons below time */}
        {onAdjustTime && (
          <div className="flex items-center gap-6 mt-1">
            <button
              onClick={() => onAdjustTime(-60)}
              className="text-xl font-light text-gray-400 hover:text-gray-600 transition-colors px-3"
              title="1分減らす"
            >
              −
            </button>
            <button
              onClick={() => onAdjustTime(60)}
              className="text-xl font-light text-gray-400 hover:text-gray-600 transition-colors px-3"
              title="1分追加"
            >
              +
            </button>
          </div>
        )}
        
        <span className={`text-sm font-semibold uppercase tracking-widest mt-2 ${colors.text}`}>
          {phaseLabel}
        </span>
        {/* Total Focus Time */}
        <div className="mt-2 flex flex-col items-center">
          <span className="text-sm font-semibold text-gray-600 tabular-nums">
            {Math.floor((dailyFocusTime + totalFocusTime) / 60)}分 / {dailyGoal}分
          </span>
        </div>
      </div>
    </Card>
  );
}
