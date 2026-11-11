<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Interview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InterviewController extends Controller
{
    /**
     * Schedule / record an interview for an application.
     */
    public function store(Request $request, int $applicationId): JsonResponse
    {
        $application = Application::findOrFail($applicationId);

        $validated = $request->validate([
            'interview_type' => ['required', 'string', 'max:100'],
            'scheduled_at' => ['required', 'date'],
            'interviewer' => ['nullable', 'string', 'max:255'],
            'link_or_location' => ['nullable', 'string', 'max:500'],
            'prep_notes' => ['nullable', 'string'],
            'result_notes' => ['nullable', 'string'],
        ], [
            'interview_type.required' => 'Please select the interview type.',
            'scheduled_at.required' => 'Interview date and time are required.',
        ]);

        $interview = $application->interviews()->create($validated);

        return response()->json([
            'message' => 'Interview scheduled successfully.',
            'interview' => $interview,
        ], 201);
    }

    /**
     * Update an interview record.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $interview = Interview::findOrFail($id);

        $validated = $request->validate([
            'interview_type' => ['sometimes', 'required', 'string', 'max:100'],
            'scheduled_at' => ['sometimes', 'required', 'date'],
            'interviewer' => ['nullable', 'string', 'max:255'],
            'link_or_location' => ['nullable', 'string', 'max:500'],
            'prep_notes' => ['nullable', 'string'],
            'result_notes' => ['nullable', 'string'],
        ]);

        $interview->update($validated);

        return response()->json([
            'message' => 'Interview updated successfully.',
            'interview' => $interview,
        ]);
    }

    /**
     * Delete an interview record.
     */
    public function destroy(int $id): JsonResponse
    {
        $interview = Interview::findOrFail($id);
        $interview->delete();

        return response()->json([
            'message' => 'Interview deleted successfully.',
        ]);
    }
}

