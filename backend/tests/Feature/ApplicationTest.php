<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ApplicationTest extends TestCase
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

    public function test_can_create_application_and_records_initial_status_history(): void
    {
        $payload = [
            'job_title' => 'Senior Laravel Developer',
            'company_name' => 'Grab Malaysia',
            'job_url' => 'https://grab.careers/jobs/12345',
            'source' => 'LinkedIn',
            'date_applied' => '2026-11-04',
            'location' => 'Kuala Lumpur',
            'job_description' => 'Looking for senior backend engineer.',
            'status' => 'Applied',
            'notes' => 'Applied with updated tech resume.',
        ];

        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/applications', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('application.job_title', 'Senior Laravel Developer')
            ->assertJsonPath('application.company.name', 'Grab Malaysia')
            ->assertJsonPath('application.status', 'Applied');

        $appId = $response->json('application.id');

        // Verify status_history has initial record
        $this->assertDatabaseHas('status_history', [
            'application_id' => $appId,
            'from_status' => null,
            'to_status' => 'Applied',
        ]);
    }

    public function test_changing_status_writes_row_to_status_history(): void
    {
        $company = Company::create(['name' => 'Shopee Malaysia']);
        $application = Application::create([
            'company_id' => $company->id,
            'job_title' => 'Fullstack Engineer',
            'source' => 'JobStreet',
            'date_applied' => '2026-11-01',
            'status' => 'Applied',
        ]);

        $this->assertDatabaseCount('status_history', 0);

        // Transition from Applied to Screening
        $response = $this->withHeaders($this->authHeaders())
            ->patchJson("/api/applications/{$application->id}/status", [
                'status' => 'Screening',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('application.status', 'Screening');

        $this->assertDatabaseHas('status_history', [
            'application_id' => $application->id,
            'from_status' => 'Applied',
            'to_status' => 'Screening',
        ]);

        // Transition from Screening to Interview
        $this->withHeaders($this->authHeaders())
            ->patchJson("/api/applications/{$application->id}/status", [
                'status' => 'Interview',
            ]);

        $this->assertDatabaseHas('status_history', [
            'application_id' => $application->id,
            'from_status' => 'Screening',
            'to_status' => 'Interview',
        ]);

        $this->assertDatabaseCount('status_history', 2);
    }

    public function test_search_and_filter_applications(): void
    {
        $grab = Company::create(['name' => 'Grab']);
        $airasia = Company::create(['name' => 'AirAsia MOVE']);

        Application::create([
            'company_id' => $grab->id,
            'job_title' => 'Software Engineer',
            'source' => 'LinkedIn',
            'date_applied' => '2026-11-01',
            'status' => 'Interview',
            'notes' => 'Technical test next Monday',
        ]);

        Application::create([
            'company_id' => $airasia->id,
            'job_title' => 'Frontend React Developer',
            'source' => 'Hiredly',
            'date_applied' => '2026-11-03',
            'status' => 'Applied',
            'notes' => 'Referred by alumni',
        ]);

        // Search by company
        $searchCompany = $this->withHeaders($this->authHeaders())
            ->getJson('/api/applications?search=AirAsia');
        $searchCompany->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.job_title', 'Frontend React Developer');

        // Filter by status
        $filterStatus = $this->withHeaders($this->authHeaders())
            ->getJson('/api/applications?status=Interview');
        $filterStatus->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.company.name', 'Grab');

        // Filter by source
        $filterSource = $this->withHeaders($this->authHeaders())
            ->getJson('/api/applications?source=Hiredly');
        $filterSource->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_can_upload_screenshot(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('job_posting.png', 800, 600);

        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/applications/upload-screenshot', [
                'screenshot' => $file,
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message', 'path', 'url']);
    }
}

