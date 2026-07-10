import React, { useState } from 'react';
import { useWorkflowTasks } from '@/hooks/useWorkflow';
import { useAuth } from '@/context/AuthContext';
import { format, addMonths, subMonths, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function WorkflowCalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week'>('month');
  const { data: tasks, isLoading } = useWorkflowTasks();
  const navigate = useNavigate();

  const handlePrev = () => setCurrentDate(viewType === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1));
  const handleNext = () => setCurrentDate(viewType === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  
  const startDate = viewType === 'month' 
    ? startOfWeek(monthStart, { weekStartsOn: 1 })
    : startOfWeek(currentDate, { weekStartsOn: 1 });
    
  const endDate = viewType === 'month'
    ? endOfWeek(monthEnd, { weekStartsOn: 1 })
    : endOfWeek(currentDate, { weekStartsOn: 1 });

  const dateFormat = "MMMM yyyy";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  if (isLoading) {
    return <div className="p-6 text-center text-slate-500">Takvim yükleniyor...</div>;
  }

  // Group tasks by date
  // We'll place tasks on their DUE DATE for simplicity on the calendar.
  const getTasksForDay = (day: Date) => {
    if (!tasks) return [];
    return tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-8 h-8 text-primary" />
            İş Takvimi
          </h1>
          <p className="text-slate-500 mt-1">Aylık görev planınızı buradan takip edebilirsiniz.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button onClick={() => setViewType('month')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${viewType === 'month' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}>Aylık</button>
            <button onClick={() => setViewType('week')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${viewType === 'week' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}>Haftalık</button>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold w-32 text-center capitalize">
              {viewType === 'month' 
                ? format(currentDate, dateFormat, { locale: tr })
                : `${format(startDate, 'd MMM')} - ${format(endDate, 'd MMM', { locale: tr })}`}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <Button variant="outline" size="sm" className="h-8" onClick={handleToday}>Bugün</Button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 items-center text-sm font-medium">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 border border-blue-600"></div>
          <span className="text-slate-600 dark:text-slate-300">Benim Görevlerim</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500 border border-purple-600"></div>
          <span className="text-slate-600 dark:text-slate-300">Takip Ettiğim Görevler</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600"></div>
          <span className="text-slate-600 dark:text-slate-300">Tamamlananlar</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center text-sm font-semibold text-slate-600 dark:text-slate-400">
              {day}
            </div>
          ))}
        </div>
        
        {/* Grid */}
        <div className="grid grid-cols-7 auto-rows-fr">
          {days.map((day, i) => {
            const dayTasks = getTasksForDay(day);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div 
                key={i} 
                className={`${viewType === 'month' ? 'min-h-[120px]' : 'min-h-[400px]'} p-2 border-b border-r border-slate-100 dark:border-slate-800 flex flex-col gap-1 transition-colors
                  ${!isCurrentMonth ? 'bg-slate-50 dark:bg-slate-900/50' : 'bg-white dark:bg-slate-900'}
                  ${(i+1) % 7 === 0 ? 'border-r-0' : ''}
                `}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-primary text-primary-foreground' : (isCurrentMonth ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600')}
                  `}>
                    {format(day, 'd')}
                  </span>
                </div>
                
                <div className={`flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar ${viewType === 'month' ? 'max-h-[100px]' : 'max-h-[350px]'}`}>
                  {dayTasks.map(task => {
                    const isMine = task.assigneeId === user?.username;
                    const isDone = task.status === 'DONE';
                    const isBlocked = task.status === 'BLOCKED';
                    
                    let bg = isMine ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800';
                    
                    if (isDone) bg = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 opacity-60';
                    if (isBlocked) bg = 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800';

                    return (
                      <div 
                        key={task.id}
                        onClick={() => navigate(`/workflow/tasks/${task.id}`)}
                        className={`text-xs p-1.5 px-2 rounded-md border cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1.5 truncate ${bg}`}
                        title={task.title}
                      >
                        {task.recurrence && <Clock className="w-3 h-3 flex-shrink-0" />}
                        <span className="truncate font-medium">{task.title}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
