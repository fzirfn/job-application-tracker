<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CompanyLookupTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create([
            'email' => 'user@jobtracker.local',
        ]);
        $this->token = $this->user->createToken('test-token')->plainTextToken;
    }

    protected function authHeaders(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->token,
            'Accept' => 'application/json',
        ];
    }

    public function test_lookup_returns_existing_company_from_database(): void
    {
        Company::create([
            'name' => 'Petronas Digital',
            'website' => 'https://petronas.com',
            'industry' => 'Energy & Technology',
            'size' => '5000+ employees',
            'location' => 'Kuala Lumpur',
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/companies/lookup', [
                'name' => 'Petronas Digital',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('found', true)
            ->assertJsonPath('source', 'database')
            ->assertJsonPath('company.name', 'Petronas Digital')
            ->assertJsonPath('company.industry', 'Energy & Technology');
    }

    public function test_lookup_calls_ai_when_not_in_database(): void
    {
        config(['services.gemini.api_key' => 'fake-gemini-key']);

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'website' => 'https://aerodyne.group',
                                        'industry' => 'Drone Technology & AI',
                                        'size' => '500-1000 employees',
                                        'location' => 'Cyberjaya, Selangor',
                                    ]),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/companies/lookup', [
                'name' => 'Aerodyne Group',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('found', true)
            ->assertJsonPath('source', 'ai')
            ->assertJsonPath('company.website', 'https://aerodyne.group')
            ->assertJsonPath('company.industry', 'Drone Technology & AI')
            ->assertJsonPath('company.location', 'Cyberjaya, Selangor');
    }

    public function test_lookup_gracefully_falls_back_when_ai_fails_or_finds_nothing(): void
    {
        config(['services.gemini.api_key' => 'fake-gemini-key']);

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([], 500),
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/companies/lookup', [
                'name' => 'Unknown Local SME Enterprise',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('found', false)
            ->assertJsonPath('source', 'none')
            ->assertJsonPath('company.name', 'Unknown Local SME Enterprise')
            ->assertJsonPath('company.location', 'Kuala Lumpur');
    }
}

