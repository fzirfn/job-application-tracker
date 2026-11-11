<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Get application settings (sources list, reminder threshold, default location).
     */
    public function index(): JsonResponse
    {
        $sources = AppSetting::get('sources', [
            'JobStreet',
            'LinkedIn',
            'MyFutureJobs',
            'MauKerja',
            'TechStreet',
            'Hiredly',
            'Indeed',
            'Company Site',
            'Email',
            'Referral',
            'Other',
        ]);

        $reminderDays = (int) AppSetting::get('reminder_days', 7);
        $defaultLocation = AppSetting::get('default_location', 'Kuala Lumpur');

        return response()->json([
            'sources' => $sources,
            'reminder_days' => $reminderDays,
            'default_location' => $defaultLocation,
        ]);
    }

    /**
     * Update application settings.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reminder_days' => ['sometimes', 'integer', 'min:1', 'max:90'],
            'sources' => ['sometimes', 'array'],
            'sources.*' => ['string', 'max:100'],
            'default_location' => ['sometimes', 'string', 'max:255'],
        ]);

        if (isset($validated['reminder_days'])) {
            AppSetting::set('reminder_days', $validated['reminder_days']);
        }

        if (isset($validated['sources'])) {
            AppSetting::set('sources', array_values(array_unique($validated['sources'])));
        }

        if (isset($validated['default_location'])) {
            AppSetting::set('default_location', $validated['default_location']);
        }

        return $this->index();
    }
}

