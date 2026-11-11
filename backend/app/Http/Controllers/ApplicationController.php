<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Company;
use App\Services\SupabaseStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ApplicationController extends Controller
{
    protected SupabaseStorageService $storage;

    public const VALID_STATUSES = [
        'Saved',
        'Applied',
        'Screening',
        'Interview',
        'Technical Test',
        'Offer',
        'Accepted',
        'Rejected',
        'Ghosted',
        'Withdrawn',
    ];

    public function __construct(SupabaseStorageService $storage)
    {
        $this->storage = $storage;
    }

    /**
     * Display a listing of applications with search, filters, and sorting.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Application::with(['company', 'statusHistory']);

        // Search across company name, job title, and notes
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('job_title', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhereHas('company', function ($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by status (single or comma-separated)
        if ($status = $request->query('status')) {
            $statuses = array_filter(array_map('trim', explode(',', $status)));
            if (! empty($statuses)) {
                $query->whereIn('status', $statuses);
            }
        }

        // Filter by source
        if ($source = $request->query('source')) {
            $query->where('source', $source);
        }

        // Filter by company_id
        if ($companyId = $request->query('company_id')) {
            $query->where('company_id', $companyId);
        }

        // Filter by date range (date_from, date_to)
        if ($dateFrom = $request->query('date_from')) {
            $query->where('date_applied', '>=', $dateFrom);
        }
        if ($dateTo = $request->query('date_to')) {
            $query->where('date_applied', '<=', $dateTo);
        }

        // Sorting
        $sortBy = $request->query('sort_by', 'date_applied');
        $sortOrder = strtolower($request->query('sort_order', 'desc')) === 'asc' ? 'asc' : 'desc';

        if ($sortBy === 'company') {
            $query->join('companies', 'applications.company_id', '=', 'companies.id')
                  ->orderBy('companies.name', $sortOrder)
                  ->select('applications.*');
        } elseif (in_array($sortBy, ['date_applied', 'job_title', 'status', 'created_at'])) {
            $query->orderBy($sortBy, $sortOrder)->orderBy('id', 'desc');
        } else {
            $query->orderBy('date_applied', 'desc')->orderBy('id', 'desc');
        }

        // Pagination or full list
        $perPage = (int) $request->query('per_page', 50);
        $applications = $query->paginate($perPage);

        // Append accessible screenshot URL
        $applications->getCollection()->transform(function ($app) {
            if ($app->screenshot_path) {
                $app->screenshot_url = $this->storage->getUrl($app->screenshot_path);
            } else {
                $app->screenshot_url = null;
            }
            return $app;
        });

        return response()->json($applications);
    }

    /**
     * Store a newly created application.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'job_title' => ['required', 'string', 'max:255'],
            'company_name' => ['required', 'string', 'max:255'],
            'company_id' => ['nullable', 'integer', 'exists:companies,id'],
            'company_website' => ['nullable', 'string', 'max:255'],
            'company_industry' => ['nullable', 'string', 'max:255'],
            'company_size' => ['nullable', 'string', 'max:100'],
            'job_url' => ['nullable', 'url', 'max:2048'],
            'source' => ['required', 'string', 'max:100'],
            'date_applied' => ['required', 'date'],
            'location' => ['nullable', 'string', 'max:255'],
            'job_description' => ['nullable', 'string'],
            'screenshot' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:10240'],
            'screenshot_path' => ['nullable', 'string'],
            'status' => ['required', Rule::in(self::VALID_STATUSES)],
            'follow_up_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ], [
            'job_title.required' => 'The job title is required.',
            'company_name.required' => 'The company name is required.',
            'source.required' => 'Please select or enter the application source.',
            'date_applied.required' => 'The application date is required.',
            'status.in' => 'The selected status is invalid.',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            // Find or create the company
            if (! empty($validated['company_id'])) {
                $company = Company::findOrFail($validated['company_id']);
            } else {
                $company = Company::firstOrCreate(
                    ['name' => trim($validated['company_name'])],
                    [
                        'website' => $validated['company_website'] ?? null,
                        'industry' => $validated['company_industry'] ?? null,
                        'size' => $validated['company_size'] ?? null,
                        'location' => $validated['location'] ?? 'Kuala Lumpur',
                    ]
                );
            }

            // Handle screenshot upload if a file was passed
            $screenshotPath = $validated['screenshot_path'] ?? null;
            if ($request->hasFile('screenshot')) {
                $uploadResult = $this->storage->upload($request->file('screenshot'), 'screenshots');
                $screenshotPath = $uploadResult['path'];
            }

            // Create application
            $application = Application::create([
                'company_id' => $company->id,
                'job_title' => $validated['job_title'],
                'job_url' => $validated['job_url'] ?? null,
                'source' => $validated['source'],
                'date_applied' => $validated['date_applied'],
                'location' => $validated['location'] ?? 'Kuala Lumpur',
                'job_description' => $validated['job_description'] ?? null,
                'screenshot_path' => $screenshotPath,
                'status' => $validated['status'],
                'follow_up_date' => $validated['follow_up_date'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            // Initial status history log
            $application->statusHistory()->create([
                'from_status' => null,
                'to_status' => $application->status,
                'changed_at' => now(),
            ]);

            $application->load(['company', 'statusHistory']);
            if ($application->screenshot_path) {
                $application->screenshot_url = $this->storage->getUrl($application->screenshot_path);
            }

            return response()->json([
                'message' => 'Application created successfully.',
                'application' => $application,
            ], 201);
        });
    }

    /**
     * Display the specified application.
     */
    public function show(int $id): JsonResponse
    {
        $application = Application::with([
            'company',
            'statusHistory',
            'interviews',
            'contacts',
            'documents',
        ])->findOrFail($id);

        if ($application->screenshot_path) {
            $application->screenshot_url = $this->storage->getUrl($application->screenshot_path);
        }

        // Append accessible URLs to documents
        $application->documents->each(function ($doc) {
            $doc->url = $this->storage->getUrl($doc->file_path);
        });

        return response()->json([
            'application' => $application,
        ]);
    }

    /**
     * Update the specified application.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $application = Application::findOrFail($id);

        $validated = $request->validate([
            'job_title' => ['sometimes', 'required', 'string', 'max:255'],
            'company_name' => ['sometimes', 'required', 'string', 'max:255'],
            'company_id' => ['nullable', 'integer', 'exists:companies,id'],
            'job_url' => ['nullable', 'url', 'max:2048'],
            'source' => ['sometimes', 'required', 'string', 'max:100'],
            'date_applied' => ['sometimes', 'required', 'date'],
            'location' => ['nullable', 'string', 'max:255'],
            'job_description' => ['nullable', 'string'],
            'screenshot' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:10240'],
            'screenshot_path' => ['nullable', 'string'],
            'status' => ['sometimes', 'required', Rule::in(self::VALID_STATUSES)],
            'follow_up_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        return DB::transaction(function () use ($application, $validated, $request) {
            // If company name was updated
            if (isset($validated['company_name'])) {
                $company = Company::firstOrCreate(
                    ['name' => trim($validated['company_name'])],
                    ['location' => $validated['location'] ?? 'Kuala Lumpur']
                );
                $application->company_id = $company->id;
            } elseif (isset($validated['company_id'])) {
                $application->company_id = $validated['company_id'];
            }

            // Handle new screenshot
            if ($request->hasFile('screenshot')) {
                $uploadResult = $this->storage->upload($request->file('screenshot'), 'screenshots');
                $application->screenshot_path = $uploadResult['path'];
            } elseif (array_key_exists('screenshot_path', $validated)) {
                $application->screenshot_path = $validated['screenshot_path'];
            }

            // Handle status change with automatic history logging
            if (isset($validated['status']) && $validated['status'] !== $application->status) {
                $application->setStatus($validated['status']);
            }

            // Fill remaining attributes
            $application->fill(array_filter([
                'job_title' => $validated['job_title'] ?? null,
                'job_url' => $validated['job_url'] ?? null,
                'source' => $validated['source'] ?? null,
                'date_applied' => $validated['date_applied'] ?? null,
                'location' => $validated['location'] ?? null,
                'job_description' => $validated['job_description'] ?? null,
                'follow_up_date' => array_key_exists('follow_up_date', $validated) ? $validated['follow_up_date'] : $application->follow_up_date,
                'notes' => array_key_exists('notes', $validated) ? $validated['notes'] : $application->notes,
            ], fn($v) => ! is_null($v)));

            $application->save();

            $application->load(['company', 'statusHistory']);
            if ($application->screenshot_path) {
                $application->screenshot_url = $this->storage->getUrl($application->screenshot_path);
            }

            return response()->json([
                'message' => 'Application updated successfully.',
                'application' => $application,
            ]);
        });
    }

    /**
     * Change status only (e.g. quick pipeline / Kanban transition).
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(self::VALID_STATUSES)],
        ], [
            'status.required' => 'Status is required.',
            'status.in' => 'The selected status is invalid.',
        ]);

        $application = Application::findOrFail($id);
        $oldStatus = $application->status;

        $application->setStatus($validated['status']);
        $application->load(['company', 'statusHistory']);

        return response()->json([
            'message' => "Status changed from {$oldStatus} to {$application->status}.",
            'application' => $application,
        ]);
    }

    /**
     * Delete an application.
     */
    public function destroy(int $id): JsonResponse
    {
        $application = Application::findOrFail($id);
        $application->delete();

        return response()->json([
            'message' => 'Application deleted successfully.',
        ]);
    }

    /**
     * Dedicated screenshot upload endpoint.
     */
    public function uploadScreenshot(Request $request): JsonResponse
    {
        $request->validate([
            'screenshot' => ['required', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:10240'],
        ], [
            'screenshot.required' => 'Please select an image file to upload.',
            'screenshot.image' => 'The file must be an image.',
            'screenshot.max' => 'The image size cannot exceed 10MB.',
        ]);

        $result = $this->storage->upload($request->file('screenshot'), 'screenshots');

        return response()->json([
            'message' => 'Screenshot uploaded successfully.',
            'path' => $result['path'],
            'url' => $result['url'],
        ]);
    }
}

