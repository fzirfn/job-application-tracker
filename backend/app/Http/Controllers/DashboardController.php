<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\AppSetting;
use App\Models\Interview;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Get aggregated dashboard statistics: status counts, activity this week,
     * upcoming interviews, and overdue follow-ups / stale applications.
     */
    public function summary(): JsonResponse
    {
        $today = Carbon::today('Asia/Kuala_Lumpur');
        $startOfWeek = Carbon::now('Asia/Kuala_Lumpur')->startOfWeek();
        $endOfWeek = Carbon::now('Asia/Kuala_Lumpur')->endOfWeek();

        // 1. Status counts: Single aggregated query instead of 11 sequential database round trips
        $rawCounts = Application::selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->all();

        $statusCounts = [];
        $totalApplications = 0;
        foreach (ApplicationController::VALID_STATUSES as $status) {
            $count = (int) ($rawCounts[$status] ?? 0);
            $statusCounts[$status] = $count;
            $totalApplications += $count;
        }

        // 2. Applications sent this week
        $sentThisWeekCount = Application::whereBetween('date_applied', [
            $startOfWeek->toDateString(),
            $endOfWeek->toDateString(),
        ])->count();

        $sentThisWeek = Application::with('company')
            ->whereBetween('date_applied', [
                $startOfWeek->toDateString(),
                $endOfWeek->toDateString(),
            ])
            ->orderBy('date_applied', 'desc')
            ->limit(5)
            ->get();

        // 3. Upcoming interviews
        $upcomingInterviews = Interview::with(['application.company'])
            ->where('scheduled_at', '>=', now())
            ->orderBy('scheduled_at', 'asc')
            ->limit(10)
            ->get();

        // 4. Overdue follow-ups & Stale applications (no reply for >= reminder_days)
        $reminderDays = (int) AppSetting::get('reminder_days', 7);
        $staleThresholdDate = Carbon::now('Asia/Kuala_Lumpur')->subDays($reminderDays)->toDateString();

        // Overdue explicit follow-up date
        $overdueFollowUps = Application::with('company')
            ->whereNotNull('follow_up_date')
            ->where('follow_up_date', '<=', $today->toDateString())
            ->whereNotIn('status', ['Accepted', 'Rejected', 'Ghosted', 'Withdrawn'])
            ->orderBy('follow_up_date', 'asc')
            ->get();

        // Stale applications: Applied with no status change / reply for >= reminder_days
        $staleApplications = Application::with('company')
            ->where('status', 'Applied')
            ->where('date_applied', '<=', $staleThresholdDate)
            ->where(function ($q) use ($today) {
                $q->whereNull('follow_up_date')
                  ->orWhere('follow_up_date', '>', $today->toDateString());
            })
            ->orderBy('date_applied', 'asc')
            ->get();

        // 5. Today's Interviews
        $todayInterviews = Interview::with(['application.company'])
            ->whereDate('scheduled_at', $today->toDateString())
            ->orderBy('scheduled_at', 'asc')
            ->get();

        return response()->json([
            'status_counts' => $statusCounts,
            'total_applications' => $totalApplications,
            'this_week' => [
                'count' => $sentThisWeekCount,
                'applications' => $sentThisWeek,
                'start_of_week' => $startOfWeek->toDateString(),
                'end_of_week' => $endOfWeek->toDateString(),
            ],
            'upcoming_interviews' => $upcomingInterviews,
            'today_interviews' => $todayInterviews,
            'overdue_follow_ups' => $overdueFollowUps,
            'stale_applications' => $staleApplications,
            'reminder_days' => $reminderDays,
            'current_time' => Carbon::now('Asia/Kuala_Lumpur')->toIso8601String(),
        ]);
    }
}

