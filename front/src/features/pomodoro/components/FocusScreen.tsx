import { usePomodoroStore } from "@/store/usePomodoroStore";
import { useTodoStore } from "@/store/useTodoStore";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ControlButtons } from "./ControlButtons";
import { TaskSelector } from "./TaskSelector";
import { TimerRing } from "./TimerRing";

export default function FocusScreen() {
  const navigate = useNavigate();
  const [taskDropdownOpen, setTaskDropdownOpen] = useState(false);
  
  const {
    timeLeft,
    isActive,
    phase,
    startTimer,
    pauseTimer,
    resetTimer,
    tick,
    skipPhase,
    settings,
    currentTaskId,
    setFocusTask,
    updateSettings,
    totalFocusTime,
    dailyFocusTime,
    fetchDailySummary,
    saveFocusTime,
    adjustTime,
  } = usePomodoroStore();

  const allTasks = useTodoStore((state) => state.allTasks);
  const updateTask = useTodoStore((state) => state.updateTask);
  
  // Get today's date
  const today = format(new Date(), "yyyy-MM-dd");
  
  // Filter tasks
  const todaysTasks = allTasks.filter(t => 
    t.executionDate === today && t.status !== 'COMPLETED'
  );
  const allTodayTasks = allTasks.filter(t => t.executionDate === today);
  const currentTask = currentTaskId ? allTasks.find(t => t.id === currentTaskId) : null;
  
  // Handle task completion
  const handleCompleteTask = async (taskId: number) => {
    await updateTask(taskId, { status: 'COMPLETED' });
    if (currentTaskId === taskId) {
      setFocusTask(null);
    }
  };

  // White noise state
  const isWhiteNoiseOn = settings.whiteNoise !== 'none';

  // Fetch daily summary on mount
  useEffect(() => {
    fetchDailySummary();
    console.log('Daily summary fetched');
  }, [fetchDailySummary]);

  // Save focus time on page leave
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (phase === 'focus' && totalFocusTime > 0) {
          saveFocusTime(totalFocusTime, currentTaskId);
          console.log('Focus time saved before unload');
      }
    };

    const handleVisibilityChange = () => {
      // タブ切替、ブラウザ最小化時に未保存のフォーカス時間の保存
      if (document.visibilityState === 'hidden' && phase === 'focus' && totalFocusTime > 0) {
          saveFocusTime(totalFocusTime, currentTaskId);
          console.log('Focus time saved');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [phase, totalFocusTime, currentTaskId, saveFocusTime]);

  // Timer tick effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive) {
      interval = setInterval(() => tick(), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, tick]);

  // Calculate progress
  const totalDuration = phase === 'focus' 
    ? settings.focusDuration * 60 
    : phase === 'shortBreak' 
      ? settings.shortBreakDuration * 60 
      : settings.longBreakDuration * 60;
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

  // Handlers
  const handleEndSession = async () => {
    if (phase === 'focus' && totalFocusTime > 0) {
        await saveFocusTime(totalFocusTime, currentTaskId);
        console.log('Focus time saved by ha');
    }
    resetTimer();
    setFocusTask(null);
    navigate('/home');
  };

  const handlePlayPause = () => {
    isActive ? pauseTimer() : startTimer();
  };

  const toggleWhiteNoise = () => {
    updateSettings({ whiteNoise: isWhiteNoiseOn ? 'none' : 'rain' });
  };

  const toggleAutoAdvance = () => {
    updateSettings({ autoAdvance: !settings.autoAdvance });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 relative bg-gradient-to-r from-blue-200 via-purple-200 to-purple-300">
      
      {/* Task Selector */}
      <TaskSelector
        isOpen={taskDropdownOpen}
        onToggle={() => setTaskDropdownOpen(!taskDropdownOpen)}
        currentTask={currentTask ?? null}
        todaysTasks={todaysTasks}
        allTodayTasks={allTodayTasks}
        currentTaskId={currentTaskId}
        onSelectTask={setFocusTask}
        onCompleteTask={handleCompleteTask}
        onUpdateTask={updateTask}
      />

      {/* Timer Section */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <TimerRing
          timeLeft={timeLeft}
          phase={phase}
          progress={progress}
          dailyFocusTime={dailyFocusTime}
          totalFocusTime={totalFocusTime}
          dailyGoal={settings.dailyGoal}
          onAdjustTime={adjustTime}
        />

        <ControlButtons
          isActive={isActive}
          phase={phase}
          isWhiteNoiseOn={isWhiteNoiseOn}
          autoAdvance={settings.autoAdvance}
          onPlayPause={handlePlayPause}
          onReset={resetTimer}
          onSkip={skipPhase}
          onEndSession={handleEndSession}
          onToggleWhiteNoise={toggleWhiteNoise}
          onToggleAutoAdvance={toggleAutoAdvance}
        />
      </div>
    </div>
  );
}
