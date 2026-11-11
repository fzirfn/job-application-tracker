<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    public function check(): JsonResponse
    {
        $dbConnected = false;
        $dbError = null;

        try {
            DB::connection()->getPdo();
            $dbConnected = true;
        } catch (\Throwable $e) {
            $dbError = $e->getMessage();
        }

        return response()->json([
            'status' => $dbConnected ? 'ok' : 'degraded',
            'api' => 'Job Application Tracker API',
            'database' => [
                'connected' => $dbConnected,
                'connection' => config('database.default'),
                'error' => $dbError,
            ],
            'timezone' => config('app.timezone'),
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}

