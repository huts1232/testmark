import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Globe,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

interface StatsCardsProps {
  stats: {
    total: number;
    up: number;
    down: number;
    slow: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  // Calculate percentages for visual indicators
  const upPercentage = stats.total > 0 ? Math.round((stats.up / stats.total) * 100) : 0;
  const downPercentage = stats.total > 0 ? Math.round((stats.down / stats.total) * 100) : 0;
  const slowPercentage = stats.total > 0 ? Math.round((stats.slow / stats.total) * 100) : 0;

  // Determine overall health status
  const getHealthStatus = () => {
    if (stats.down > 0) return { status: "Critical", color: "destructive" as const };
    if (stats.slow > 0) return { status: "Warning", color: "secondary" as const };
    return { status: "Healthy", color: "default" as const };
  };

  const healthStatus = getHealthStatus();

  const cards = [
    {
      title: "Total Bookmarks",
      value: stats.total.toLocaleString(),
      icon: Globe,
      description: "URLs being monitored",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: null
    },
    {
      title: "Healthy Sites",
      value: stats.up.toLocaleString(),
      icon: CheckCircle2,
      description: `${upPercentage}% of total bookmarks`,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: upPercentage >= 90 ? "positive" : upPercentage >= 70 ? "neutral" : "negative"
    },
    {
      title: "Down Sites",
      value: stats.down.toLocaleString(),
      icon: XCircle,
      description: stats.down > 0 ? `${downPercentage}% need attention` : "All sites operational",
      color: "text-red-600",
      bgColor: "bg-red-50",
      trend: stats.down === 0 ? "positive" : "negative"
    },
    {
      title: "Slow Response",
      value: stats.slow.toLocaleString(),
      icon: Clock,
      description: stats.slow > 0 ? `${slowPercentage}% responding slowly` : "All sites fast",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      trend: stats.slow === 0 ? "positive" : stats.slow <= 2 ? "neutral" : "negative"
    }
  ];

  return (
    <div className="space-y-4">
      {/* Overall Health Status Banner */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {healthStatus.status === "Healthy" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : healthStatus.status === "Warning" ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-semibold text-lg">System Health</span>
              </div>
              <Badge variant={healthStatus.color} className="ml-2">
                {healthStatus.status}
              </Badge>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => {
          const IconComponent = card.icon;
          
          return (
            <Card key={index} className="transition-all duration-200 hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${card.bgColor}`}>
                  <IconComponent className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{card.value}</div>
                    {card.trend && (
                      <div className="flex items-center space-x-1">
                        <TrendingUp 
                          className={`h-3 w-3 ${
                            card.trend === "positive" 
                              ? "text-green-600" 
                              : card.trend === "neutral" 
                              ? "text-yellow-600" 
                              : "text-red-600"
                          }`} 
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {card.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Insights */}
      {stats.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Uptime Rate</div>
                <div className="text-xl font-semibold text-green-600">
                  {upPercentage}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Issues Found</div>
                <div className="text-xl font-semibold text-red-600">
                  {stats.down + stats.slow}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Monitoring</div>
                <div className="text-xl font-semibold text-blue-600">
                  {stats.total} sites
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}