<?php

namespace App\Services;

use App\Models\Company;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class CompanyLookupService
{
    protected ?string $geminiApiKey;

    public function __construct()
    {
        $this->geminiApiKey = config('services.gemini.api_key') ?: env('GEMINI_API_KEY');
    }

    /**
     * Look up company details: first checks local database, then queries AI API.
     *
     * @param string $name
     * @return array{found: bool, source: string, company: array<string, mixed>, message?: string}
     */
    public function lookup(string $name): array
    {
        $trimmedName = trim($name);
        if (empty($trimmedName)) {
            return [
                'found' => false,
                'source' => 'none',
                'company' => [
                    'name' => $trimmedName,
                    'website' => null,
                    'industry' => null,
                    'size' => null,
                    'location' => 'Kuala Lumpur',
                ],
            ];
        }

        // 1. Check local database first (exact or case-insensitive match across Postgres and SQLite)
        $existing = Company::whereRaw('LOWER(name) = ?', [strtolower($trimmedName)])
            ->orWhere('name', $trimmedName)
            ->first();

        if ($existing) {
            return [
                'found' => true,
                'source' => 'database',
                'company' => [
                    'id' => $existing->id,
                    'name' => $existing->name,
                    'website' => $existing->website,
                    'industry' => $existing->industry,
                    'size' => $existing->size,
                    'location' => $existing->location ?: 'Kuala Lumpur',
                    'logo_url' => $existing->logo_url,
                ],
            ];
        }

        // 2. Query AI Model (Gemini) if API key is provided
        if (! empty($this->geminiApiKey) && ! str_contains($this->geminiApiKey, 'YOUR_')) {
            $aiResult = $this->queryGemini($trimmedName);
            if ($aiResult) {
                return [
                    'found' => true,
                    'source' => 'ai',
                    'company' => [
                        'name' => $trimmedName,
                        'website' => $aiResult['website'] ?? null,
                        'industry' => $aiResult['industry'] ?? null,
                        'size' => $aiResult['size'] ?? null,
                        'location' => $aiResult['location'] ?? 'Kuala Lumpur',
                    ],
                ];
            }
        }

        // 3. Fallback: Lookup finds nothing or AI key not configured; manual entry always works
        return [
            'found' => false,
            'source' => 'none',
            'company' => [
                'name' => $trimmedName,
                'website' => null,
                'industry' => null,
                'size' => null,
                'location' => 'Kuala Lumpur',
            ],
            'message' => 'No prior record or AI data found. You can enter details manually.',
        ];
    }

    /**
     * Query Gemini API with structured prompt for company details.
     *
     * @param string $companyName
     * @return array{website?: ?string, industry?: ?string, size?: ?string, location?: ?string}|null
     */
    protected function queryGemini(string $companyName): ?array
    {
        try {
            $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$this->geminiApiKey}";

            $prompt = <<<PROMPT
You are a corporate intelligence database assistant.
Provide factual business details for the company named "{$companyName}".
If this is a Malaysian or Southeast Asian organization, focus on its Malaysian operations or regional headquarters.

Return ONLY a valid JSON object without markdown formatting, backticks, or preamble:
{
  "website": "Official website URL, e.g. https://example.com or null",
  "industry": "Primary industry sector, e.g. Financial Technology, Automotive, E-Commerce, or null",
  "size": "Estimated employee size range, e.g. 50-200 employees, 1000-5000 employees, 10000+ employees, or null",
  "location": "City and Country of headquarters, e.g. Kuala Lumpur, Malaysia or Petaling Jaya, Selangor, or null"
}
PROMPT;

            $response = Http::timeout(10)->post($endpoint, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'temperature' => 0.1,
                    'responseMimeType' => 'application/json',
                ],
            ]);

            if ($response->successful()) {
                $candidates = $response->json('candidates');
                $text = $candidates[0]['content']['parts'][0]['text'] ?? null;
                if ($text) {
                    $cleaned = trim($text);
                    // Remove code fence if present
                    if (str_starts_with($cleaned, '```json')) {
                        $cleaned = substr($cleaned, 7);
                    } elseif (str_starts_with($cleaned, '```')) {
                        $cleaned = substr($cleaned, 3);
                    }
                    if (str_ends_with($cleaned, '```')) {
                        $cleaned = substr($cleaned, 0, -3);
                    }
                    $cleaned = trim($cleaned);

                    $decoded = json_decode($cleaned, true);
                    if (is_array($decoded)) {
                        return [
                            'website' => ! empty($decoded['website']) ? $decoded['website'] : null,
                            'industry' => ! empty($decoded['industry']) ? $decoded['industry'] : null,
                            'size' => ! empty($decoded['size']) ? $decoded['size'] : null,
                            'location' => ! empty($decoded['location']) ? $decoded['location'] : 'Kuala Lumpur',
                        ];
                    }
                }
            }
        } catch (\Throwable $e) {
            logger()->warning("Gemini company lookup error for '{$companyName}': " . $e->getMessage());
        }

        return null;
    }
}
