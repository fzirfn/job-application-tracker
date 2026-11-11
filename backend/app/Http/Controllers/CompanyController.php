<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Services\CompanyLookupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    /**
     * Look up company details: checks database first, then queries AI.
     */
    public function lookup(Request $request, CompanyLookupService $lookupService): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ], [
            'name.required' => 'Please provide a company name to look up.',
        ]);

        $result = $lookupService->lookup($validated['name']);

        return response()->json($result);
    }

    /**
     * List companies, optionally filtered by search term for autocomplete.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Company::query();

        if ($search = $request->query('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $companies = $query->orderBy('name', 'asc')
            ->withCount('applications')
            ->limit(50)
            ->get();

        return response()->json([
            'companies' => $companies,
        ]);
    }

    /**
     * Get single company details.
     */
    public function show(int $id): JsonResponse
    {
        $company = Company::with(['applications' => function ($q) {
            $q->orderBy('date_applied', 'desc');
        }])->findOrFail($id);

        return response()->json([
            'company' => $company,
        ]);
    }
}

