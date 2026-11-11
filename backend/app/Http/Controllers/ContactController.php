<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Contact;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    /**
     * Store a contact linked to an application.
     */
    public function store(Request $request, int $applicationId): JsonResponse
    {
        $application = Application::findOrFail($applicationId);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'role' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:100'],
            'linkedin_url' => ['nullable', 'url', 'max:500'],
        ], [
            'name.required' => 'Contact name is required.',
            'email.email' => 'Please provide a valid email address.',
            'linkedin_url.url' => 'Please provide a valid LinkedIn URL.',
        ]);

        $contact = $application->contacts()->create($validated);

        return response()->json([
            'message' => 'Contact added successfully.',
            'contact' => $contact,
        ], 201);
    }

    /**
     * Update an existing contact.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $contact = Contact::findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'role' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:100'],
            'linkedin_url' => ['nullable', 'url', 'max:500'],
        ]);

        $contact->update($validated);

        return response()->json([
            'message' => 'Contact updated successfully.',
            'contact' => $contact,
        ]);
    }

    /**
     * Delete a contact.
     */
    public function destroy(int $id): JsonResponse
    {
        $contact = Contact::findOrFail($id);
        $contact->delete();

        return response()->json([
            'message' => 'Contact deleted successfully.',
        ]);
    }
}

