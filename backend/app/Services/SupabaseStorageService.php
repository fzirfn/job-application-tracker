<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SupabaseStorageService
{
    protected ?string $supabaseUrl;
    protected ?string $serviceRoleKey;
    protected string $bucket;

    public function __construct()
    {
        $this->supabaseUrl = config('services.supabase.url') ?: env('SUPABASE_URL');
        $this->serviceRoleKey = config('services.supabase.service_role_key') ?: env('SUPABASE_SERVICE_ROLE_KEY');
        $this->bucket = config('services.supabase.storage_bucket') ?: env('SUPABASE_STORAGE_BUCKET', 'job-tracker-files');
    }

    /**
     * Determine if Supabase Storage is configured.
     */
    public function isConfigured(): bool
    {
        return ! empty($this->supabaseUrl) &&
               ! empty($this->serviceRoleKey) &&
               ! str_contains($this->supabaseUrl, 'YOUR_PROJECT_REF');
    }

    /**
     * Upload a file (screenshot or document).
     *
     * @param UploadedFile $file
     * @param string $folder e.g. 'screenshots' or 'documents'
     * @return array{path: string, url: string}
     */
    public function upload(UploadedFile $file, string $folder = 'screenshots'): array
    {
        $extension = $file->getClientOriginalExtension() ?: 'png';
        $filename = Str::uuid() . '.' . $extension;
        $storagePath = $folder . '/' . $filename;

        // If Supabase Storage is configured, upload directly to Supabase Storage REST API
        if ($this->isConfigured()) {
            try {
                $endpoint = rtrim($this->supabaseUrl, '/') . '/storage/v1/object/' . $this->bucket . '/' . $storagePath;

                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $this->serviceRoleKey,
                    'apikey' => $this->serviceRoleKey,
                    'Content-Type' => $file->getMimeType() ?: 'application/octet-stream',
                    'x-upsert' => 'true',
                ])->withBody(
                    file_get_contents($file->getRealPath()),
                    $file->getMimeType() ?: 'application/octet-stream'
                )->post($endpoint);

                if ($response->successful()) {
                    $publicUrl = rtrim($this->supabaseUrl, '/') . '/storage/v1/object/public/' . $this->bucket . '/' . $storagePath;
                    return [
                        'path' => $storagePath,
                        'url' => $publicUrl,
                    ];
                }
            } catch (\Throwable $e) {
                logger()->error('Supabase Storage upload failed, falling back to local disk: ' . $e->getMessage());
            }
        }

        // Fallback: Local storage in storage/app/public/screenshots
        $localPath = $file->storeAs('public/' . $folder, $filename);
        $relativeUrl = '/storage/' . $folder . '/' . $filename;

        return [
            'path' => $storagePath,
            'url' => url($relativeUrl),
        ];
    }

    /**
     * Get accessible URL for a storage path.
     */
    public function getUrl(string $path): string
    {
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        if ($this->isConfigured()) {
            return rtrim($this->supabaseUrl, '/') . '/storage/v1/object/public/' . $this->bucket . '/' . $path;
        }

        return url('/storage/' . $path);
    }
}

