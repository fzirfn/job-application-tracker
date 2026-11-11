<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Document;
use App\Services\SupabaseStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DocumentController extends Controller
{
    protected SupabaseStorageService $storage;

    public function __construct(SupabaseStorageService $storage)
    {
        $this->storage = $storage;
    }

    /**
     * Upload a CV or Cover Letter document for an application.
     */
    public function store(Request $request, int $applicationId): JsonResponse
    {
        $application = Application::findOrFail($applicationId);

        $request->validate([
            'kind' => ['required', Rule::in(['cv', 'cover_letter'])],
            'document' => [
                'required',
                'file',
                'mimes:pdf,doc,docx,txt,rtf',
                'max:15360', // 15MB max
            ],
        ], [
            'kind.required' => 'Please select the document kind (CV or Cover Letter).',
            'kind.in' => 'Document kind must be CV or Cover Letter.',
            'document.required' => 'Please choose a document file to upload.',
            'document.mimes' => 'Document must be a PDF, DOC, DOCX, or TXT file.',
            'document.max' => 'The file size cannot exceed 15MB.',
        ]);

        $file = $request->file('document');
        $originalFileName = $file->getClientOriginalName();

        $uploadResult = $this->storage->upload($file, 'documents');

        $document = $application->documents()->create([
            'kind' => $request->kind,
            'file_name' => $originalFileName,
            'file_path' => $uploadResult['path'],
        ]);

        $document->url = $this->storage->getUrl($document->file_path);

        return response()->json([
            'message' => 'Document uploaded successfully.',
            'document' => $document,
        ], 201);
    }

    /**
     * Delete an uploaded document.
     */
    public function destroy(int $id): JsonResponse
    {
        $document = Document::findOrFail($id);
        $document->delete();

        return response()->json([
            'message' => 'Document deleted successfully.',
        ]);
    }
}

