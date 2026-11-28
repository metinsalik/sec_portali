import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, RefreshCw, Sparkles } from 'lucide-react';

export interface DomainCockpitItem {
  id: string;
  moduleKey: string;
  moduleLabel: string;
  title: string;
  subtitle: string;
  isMine: boolean;
  isOverdue: boolean;
  daysDiff: number | null;
  severity: 'critical' | 'warning' | 'info';
  link: string;
  actionLabel: string;
}

interface DomainCockpitSidebarProps {
  title: string;
  description: string;
  items: DomainCockpitItem[];
  isLoading: boolean;
  isFetching: boolean;
  onRefresh: () => void;
}

export function DomainCockpitSidebar({
  title,
  description,
  items,
  isLoading,
  isFetching,
  onRefresh,
}: DomainCockpitSidebarProps) {
  const navigate = useNavigate();
  const [onlyMine, setOnlyMine] = useState(false);

  const visibleItems = onlyMine ? items.filter((i) => i.isMine) : items;
  const mineCount = items.filter((i) => i.isMine).length;

  const formatDays = (item: DomainCockpitItem) => {
    if (item.daysDiff === null || item.daysDiff === undefined) return null;
    if (item.daysDiff < 0) return `${Math.abs(item.daysDiff)}g gecikti`;
    if (item.daysDiff === 0) return 'Bugün';
    return `${item.daysDiff}g kaldı`;
  };

  return (
    <Card className="rounded-lg border-border/80 overflow-hidden sticky top-20">
      <CardHeader className="pb-3 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-[11px] tabular-nums">
              {visibleItems.length}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isFetching}
              className="h-7 w-7"
              title="Yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <CardDescription className="text-xs">{description}</CardDescription>

        <div className="flex items-center gap-1.5 pt-2">
          <Button
            type="button"
            size="sm"
            variant={!onlyMine ? 'default' : 'outline'}
            onClick={() => setOnlyMine(false)}
            className="h-7 px-2.5 text-[11px]"
          >
            Tümü ({items.length})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={onlyMine ? 'default' : 'outline'}
            onClick={() => setOnlyMine(true)}
            className="h-7 px-2.5 text-[11px]"
          >
            Bana Ait ({mineCount})
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-3">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-14 rounded-lg bg-muted animate-pulse" />
            <div className="h-14 rounded-lg bg-muted animate-pulse" />
            <div className="h-14 rounded-lg bg-muted animate-pulse" />
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="py-8 text-center space-y-1.5 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
            <p className="font-medium text-foreground">Bekleyen iş bulunmuyor</p>
            <p className="text-[11px]">Bu alandaki görev ve aksiyonlarınız güncel.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {visibleItems.map((item) => {
              const dueText = formatDays(item);
              return (
                <div
                  key={item.id}
                  onClick={() => navigate(item.link)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all space-y-1.5 ${
                    item.isOverdue || item.severity === 'critical'
                      ? 'border-destructive/30 bg-destructive/5 hover:border-destructive/50'
                      : item.severity === 'warning'
                      ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
                      : 'border-border/70 bg-card hover:border-primary/40 hover:bg-muted/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
                        {item.moduleLabel}
                      </Badge>
                      {item.isMine && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary">
                          Bana Ait
                        </Badge>
                      )}
                    </div>
                    {dueText && (
                      <span
                        className={`text-[10px] font-semibold tabular-nums inline-flex items-center gap-1 ${
                          item.isOverdue ? 'text-destructive' : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {item.isOverdue ? <AlertTriangle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                        {dueText}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">
                    {item.title}
                  </p>

                  <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                    <span className="truncate">{item.subtitle}</span>
                    <span className="inline-flex items-center gap-0.5 text-primary font-medium shrink-0">
                      {item.actionLabel}
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
