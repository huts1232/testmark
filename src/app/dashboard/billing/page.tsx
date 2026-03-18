import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, CreditCard, Calendar, AlertTriangle, Crown, Zap, Shield } from 'lucide-react';
import { redirect } from 'next/navigation';

interface BillingPageProps {}

interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  plan: 'free' | 'pro' | 'enterprise';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

interface Usage {
  bookmarks: number;
  health_checks: number;
  alerts: number;
}

interface PlanLimits {
  bookmarks: number;
  health_checks: number;
  check_frequency: string;
  email_alerts: boolean;
  webhook_alerts: boolean;
  priority_support: boolean;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    bookmarks: 25,
    health_checks: 100,
    check_frequency: 'Every hour',
    email_alerts: true,
    webhook_alerts: false,
    priority_support: false,
  },
  pro: {
    bookmarks: 500,
    health_checks: 5000,
    check_frequency: 'Every 5 minutes',
    email_alerts: true,
    webhook_alerts: true,
    priority_support: true,
  },
  enterprise: {
    bookmarks: 9999,
    health_checks: 99999,
    check_frequency: 'Every minute',
    email_alerts: true,
    webhook_alerts: true,
    priority_support: true,
  },
};

const PLAN_PRICES = {
  pro: { monthly: 19, yearly: 190 },
  enterprise: { monthly: 99, yearly: 990 },
};

async function getUserSubscription(): Promise<Subscription | null> {
  const supabase = createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth');
  }

  // In a real app, this would fetch from your billing provider (Stripe, etc.)
  // For demo purposes, we'll simulate subscription data
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_plan')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return {
      id: 'demo-sub',
      status: 'active',
      plan: 'free',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancel_at_period_end: false,
    };
  }

  return {
    id: 'demo-sub',
    status: profile.subscription_status || 'active',
    plan: profile.subscription_plan || 'free',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancel_at_period_end: false,
  };
}

async function getUserUsage(): Promise<Usage> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { bookmarks: 0, health_checks: 0, alerts: 0 };
  }

  const [bookmarksResult, healthChecksResult, alertsResult] = await Promise.all([
    supabase.from('bookmarks').select('id', { count: 'exact' }).eq('user_id', user.id),
    supabase.from('health_checks').select('id', { count: 'exact' }).eq('user_id', user.id),
    supabase.from('alerts').select('id', { count: 'exact' }).eq('user_id', user.id),
  ]);

  return {
    bookmarks: bookmarksResult.count || 0,
    health_checks: healthChecksResult.count || 0,
    alerts: alertsResult.count || 0,
  };
}

function getPlanIcon(plan: string) {
  switch (plan) {
    case 'pro':
      return <Zap className="h-5 w-5 text-blue-500" />;
    case 'enterprise':
      return <Crown className="h-5 w-5 text-purple-500" />;
    default:
      return <Shield className="h-5 w-5 text-gray-500" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
    case 'trialing':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Trial</Badge>;
    case 'past_due':
      return <Badge variant="destructive">Past Due</Badge>;
    case 'canceled':
      return <Badge variant="outline">Canceled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function calculateUsagePercentage(current: number, limit: number): number {
  if (limit === 9999 || limit === 99999) return 0; // Unlimited plans
  return Math.min((current / limit) * 100, 100);
}

export default async function BillingPage() {
  const [subscription, usage] = await Promise.all([
    getUserSubscription(),
    getUserUsage(),
  ]);

  if (!subscription) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing information
          </p>
        </div>
        
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Unable to load billing information. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentPlan = PLAN_LIMITS[subscription.plan];
  const bookmarkUsage = calculateUsagePercentage(usage.bookmarks, currentPlan.bookmarks);
  const healthCheckUsage = calculateUsagePercentage(usage.health_checks, currentPlan.health_checks);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing information
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Current Plan */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getPlanIcon(subscription.plan)}
                Current Plan
              </CardTitle>
              {getStatusBadge(subscription.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold capitalize">{subscription.plan}</div>
                <div className="text-sm text-muted-foreground">
                  {subscription.plan === 'free' ? 'Free forever' : 
                   subscription.plan === 'pro' ? '$19/month' : 
                   '$99/month'}
                </div>
              </div>
              
              {subscription.status === 'active' && (
                <div className="text-sm">
                  <div className="text-muted-foreground">Next billing date</div>
                  <div className="font-medium">{formatDate(subscription.current_period_end)}</div>
                </div>
              )}
              
              {subscription.cancel_at_period_end && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Your subscription will end on {formatDate(subscription.current_period_end)}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Overview</CardTitle>
            <CardDescription>Current period usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Bookmarks</span>
                  <span>{usage.bookmarks}/{currentPlan.bookmarks === 9999 ? '∞' : currentPlan.bookmarks}</span>
                </div>
                <Progress value={bookmarkUsage} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Health Checks</span>
                  <span>{usage.health_checks}/{currentPlan.health_checks === 99999 ? '∞' : currentPlan.health_checks}</span>
                </div>
                <Progress value={healthCheckUsage} className="h-2" />
              </div>
              
              <div className="pt-2 border-t">
                <div className="text-sm text-muted-foreground">Check frequency</div>
                <div className="font-medium">{currentPlan.check_frequency}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscription.plan === 'free' ? (
                <Button className="w-full">
                  Upgrade to Pro
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Invoices
                  </Button>
                  
                  <Button variant="outline" className="w-full">
                    Update Payment Method
                  </Button>
                  
                  {!subscription.cancel_at_period_end ? (
                    <Button variant="destructive" className="w-full">
                      Cancel Subscription
                    </Button>
                  ) : (
                    <Button className="w-full">
                      Reactivate Subscription
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Comparison */}
      {subscription.plan === 'free' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Upgrade Your Plan</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Pro Plan */}
            <Card className="border-blue-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-500" />
                    Pro
                  </CardTitle>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">Popular</Badge>
                </div>
                <CardDescription>Perfect for growing teams and projects</CardDescription>
                <div className="text-3xl font-bold">$19<span className="text-lg font-normal text-muted-foreground">/month</span></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">500 bookmarks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">5,000 health checks/month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Check every 5 minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Webhook alerts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Priority support</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <Button className="w-full">
                    Upgrade to Pro
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-purple-500" />
                  Enterprise
                </CardTitle>
                <CardDescription>For large organizations with high-volume needs</CardDescription>
                <div className="text-3xl font-bold">$99<span className="text-lg font-normal text-muted-foreground">/month</span></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Unlimited bookmarks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Unlimited health checks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Check every minute</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Advanced webhook alerts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Dedicated support</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <Button variant="outline" className="w-full">
                    Contact Sales
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}