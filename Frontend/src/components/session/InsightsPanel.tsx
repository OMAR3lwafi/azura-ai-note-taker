import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import {
  FileText,
  CheckCircle2,
  Users,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

interface AISuggestion {
  id: string;
  kind: 'summary' | 'decision' | 'action_item';
  content: any;
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  assignee?: string | null;
  due_date?: string | null;
  status: 'open' | 'done';
}

interface InsightsPanelProps {
  suggestions: AISuggestion[];
  tasks: Task[];
  onRegenerateSummary?: () => Promise<void>;
  onToggleTask?: (taskId: string) => void;
  loading?: boolean;
}

export function InsightsPanel({
  suggestions,
  tasks,
  onRegenerateSummary,
  onToggleTask,
  loading = false,
}: InsightsPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    decisions: true,
    tasks: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Extract latest suggestions by kind
  const latestSummary = suggestions
    .filter((s) => s.kind === 'summary')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  const decisions = suggestions
    .filter((s) => s.kind === 'decision')
    .map((s) => s.content);

  const actionItems = suggestions
    .filter((s) => s.kind === 'action_item')
    .map((s) => s.content);

  const summary = latestSummary?.content?.summary || '';
  const summaryDecisions = latestSummary?.content?.decisions || [];
  const summaryTasks = latestSummary?.content?.action_items || [];

  const allDecisions = [...summaryDecisions, ...decisions].filter(Boolean);

  if (suggestions.length === 0 && tasks.length === 0) {
    return (
      <Card className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2 p-6">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">No insights yet</p>
          <p className="text-sm text-muted-foreground">
            AI will generate insights as the meeting progresses
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Insights</CardTitle>
          {onRegenerateSummary && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerateSummary}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 px-6 pb-6">
        <div className="space-y-4">
          {/* Summary Section */}
          {summary && (
            <Collapsible
              open={expandedSections.summary}
              onOpenChange={() => toggleSection('summary')}
            >
              <div className="space-y-2">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <h4 className="font-semibold">Summary</h4>
                    </div>
                    {expandedSections.summary ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-4">
                      <p className="text-sm leading-relaxed">{summary}</p>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {/* Decisions Section */}
          {allDecisions.length > 0 && (
            <>
              <Separator />
              <Collapsible
                open={expandedSections.decisions}
                onOpenChange={() => toggleSection('decisions')}
              >
                <div className="space-y-2">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <h4 className="font-semibold">Decisions</h4>
                        <Badge variant="secondary">{allDecisions.length}</Badge>
                      </div>
                      {expandedSections.decisions ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <ul className="space-y-2">
                      {allDecisions.map((decision, index) => (
                        <li key={index}>
                          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                            <CardContent className="pt-3 pb-3">
                              <p className="text-sm">{decision}</p>
                            </CardContent>
                          </Card>
                        </li>
                      ))}
                    </ul>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </>
          )}

          {/* Tasks Section */}
          {(tasks.length > 0 || summaryTasks.length > 0) && (
            <>
              <Separator />
              <Collapsible
                open={expandedSections.tasks}
                onOpenChange={() => toggleSection('tasks')}
              >
                <div className="space-y-2">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-500" />
                        <h4 className="font-semibold">Action Items</h4>
                        <Badge variant="secondary">
                          {tasks.length || summaryTasks.length}
                        </Badge>
                      </div>
                      {expandedSections.tasks ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <ul className="space-y-2">
                      {tasks.map((task) => (
                        <li key={task.id}>
                          <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
                            <CardContent className="pt-3 pb-3">
                              <div className="flex items-start gap-2">
                                <Checkbox
                                  checked={task.status === 'done'}
                                  onCheckedChange={() => onToggleTask?.(task.id)}
                                  className="mt-1"
                                />
                                <div className="flex-1 space-y-1">
                                  <p
                                    className={`text-sm ${
                                      task.status === 'done' ? 'line-through text-muted-foreground' : ''
                                    }`}
                                  >
                                    {task.title}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {task.assignee && (
                                      <span className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        {task.assignee}
                                      </span>
                                    )}
                                    {task.due_date && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(task.due_date).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </li>
                      ))}

                      {summaryTasks.map((task: any, index: number) => (
                        <li key={`summary-${index}`}>
                          <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
                            <CardContent className="pt-3 pb-3">
                              <div className="flex items-start gap-2">
                                <div className="flex-1 space-y-1">
                                  <p className="text-sm">{task.title}</p>
                                  {task.assignee && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {task.assignee}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </li>
                      ))}
                    </ul>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
