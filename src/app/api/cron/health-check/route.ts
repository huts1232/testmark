import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role key for server-side operations
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    // Verify the request is coming from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting health check cron job...');

    // Get all active bookmarks that need checking
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('bookmarks')
      .select(`
        id,
        url,
        title,
        user_id,
        check_frequency,
        last_checked,
        profiles!inner(
          id,
          notification_settings(
            email_notifications,
            push_notifications
          )
        )
      `)
      .eq('is_active', true)
      .not('deleted_at', 'is', null);

    if (bookmarksError) {
      console.error('Error fetching bookmarks:', bookmarksError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!bookmarks || bookmarks.length === 0) {
      console.log('No active bookmarks found');
      return NextResponse.json({ message: 'No bookmarks to check', checked: 0 });
    }

    const now = new Date();
    const checksToPerform = bookmarks.filter(bookmark => {
      if (!bookmark.last_checked) return true;
      
      const lastChecked = new Date(bookmark.last_checked);
      const frequencyMinutes = getFrequencyInMinutes(bookmark.check_frequency);
      const nextCheck = new Date(lastChecked.getTime() + frequencyMinutes * 60000);
      
      return now >= nextCheck;
    });

    console.log(`Found ${checksToPerform.length} bookmarks to check out of ${bookmarks.length} total`);

    let successCount = 0;
    let failureCount = 0;
    const alerts: any[] = [];

    // Process bookmarks in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < checksToPerform.length; i += batchSize) {
      const batch = checksToPerform.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (bookmark) => {
        try {
          const checkResult = await performHealthCheck(bookmark.url);
          
          // Store health check result
          const { error: insertError } = await supabase
            .from('health_checks')
            .insert({
              bookmark_id: bookmark.id,
              status_code: checkResult.status,
              response_time: checkResult.responseTime,
              is_accessible: checkResult.isAccessible,
              error_message: checkResult.error,
              checked_at: now.toISOString()
            });

          if (insertError) {
            console.error(`Error inserting health check for bookmark ${bookmark.id}:`, insertError);
            return;
          }

          // Update bookmark's last_checked timestamp
          await supabase
            .from('bookmarks')
            .update({ last_checked: now.toISOString() })
            .eq('id', bookmark.id);

          if (checkResult.isAccessible) {
            successCount++;
          } else {
            failureCount++;
            
            // Create alert for failed check
            const alert = {
              user_id: bookmark.user_id,
              bookmark_id: bookmark.id,
              alert_type: 'url_down',
              title: `Bookmark "${bookmark.title}" is down`,
              message: `URL: ${bookmark.url}\nStatus: ${checkResult.status || 'Error'}\nError: ${checkResult.error || 'Unknown error'}`,
              severity: (checkResult.status ?? 0) >= 500 ? 'high' : 'medium',
              is_read: false,
              created_at: now.toISOString()
            };
            
            alerts.push(alert);
          }
        } catch (error) {
          console.error(`Error checking bookmark ${bookmark.id}:`, error);
          failureCount++;
        }
      }));
      
      // Small delay between batches
      if (i + batchSize < checksToPerform.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Insert alerts in batch
    if (alerts.length > 0) {
      const { error: alertsError } = await supabase
        .from('alerts')
        .insert(alerts);

      if (alertsError) {
        console.error('Error inserting alerts:', alertsError);
      } else {
        console.log(`Created ${alerts.length} alerts for failed checks`);
      }
    }

    const result = {
      message: 'Health check completed',
      checked: checksToPerform.length,
      successful: successCount,
      failed: failureCount,
      alerts_created: alerts.length,
      timestamp: now.toISOString()
    };

    console.log('Health check cron job completed:', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Health check cron job failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function performHealthCheck(url: string) {
  const startTime = Date.now();
  
  try {
    // Add protocol if missing
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    
    const response = await fetch(fullUrl, {
      method: 'HEAD', // Use HEAD to minimize data transfer
      headers: {
        'User-Agent': 'TestMark Health Check Bot/1.0',
        'Accept': '*/*',
        'Connection': 'close'
      },
      // Set reasonable timeout
      signal: AbortSignal.timeout(30000) // 30 seconds
    });

    const responseTime = Date.now() - startTime;
    const isAccessible = response.status >= 200 && response.status < 400;

    return {
      status: response.status,
      responseTime,
      isAccessible,
      error: isAccessible ? null : `HTTP ${response.status} ${response.statusText}`
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    let errorMessage = 'Unknown error';
    
    if (error instanceof TypeError) {
      errorMessage = 'Network error or invalid URL';
    } else if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      status: null,
      responseTime,
      isAccessible: false,
      error: errorMessage
    };
  }
}

function getFrequencyInMinutes(frequency: string): number {
  switch (frequency) {
    case 'every_5_minutes':
      return 5;
    case 'every_15_minutes':
      return 15;
    case 'every_30_minutes':
      return 30;
    case 'hourly':
      return 60;
    case 'every_6_hours':
      return 360;
    case 'daily':
      return 1440;
    case 'weekly':
      return 10080;
    default:
      return 60; // Default to hourly
  }
}