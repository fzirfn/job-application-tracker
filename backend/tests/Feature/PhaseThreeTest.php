<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Interview;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PhaseThreeTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected string $token;
    protected Application $application;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create([
            'email' => 'user@jobtracker.local',
        ]);
        $this->token = $this->user->createToken('test-token')->plainTextToken;

        $company = Company::create(['name' => 'Grab Malaysia']);
        $this->application = Application::create([
            'company_id' => $company->id,
            'job_title' => 'Software Engineer',
            'source' => 'LinkedIn',
            'date_applied' => now()->toDateString(),
            'status' => 'Interview',
            'follow_up_date' => now()->subDay()->toDateString(), // Overdue
        ]);
    }

    protected function authHeaders(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->token,
            'Accept' => 'application/json',
        ];
    }

    public function test_dashboard_summary_returns_aggregated_metrics(): void
    {
        // Schedule upcoming interview
        $this->application->interviews()->create([
            'interview_type' => 'Technical',
            'scheduled_at' => now()->addDays(2),
            'interviewer' => 'John Doe',
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/dashboard/summary');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status_counts',
                'total_applications',
                'this_week' => ['count', 'applications'],
                'upcoming_interviews',
                'overdue_follow_ups',
                'stale_applications',
                'reminder_days',
            ])
            ->assertJsonPath('total_applications', 1)
            ->assertJsonPath('status_counts.Interview', 1);

        $this->assertCount(1, $response->json('upcoming_interviews'));
        $this->assertCount(1, $response->json('overdue_follow_ups'));
    }

    public function test_can_manage_interviews(): void
    {
        // 1. Add interview
        $createRes = $this->withHeaders($this->authHeaders())
            ->postJson("/api/applications/{$this->application->id}/interviews", [
                'interview_type' => 'HR',
                'scheduled_at' => '2026-11-10 14:00:00',
                'interviewer' => 'Jane recruiter',
                'link_or_location' => 'Google Meet link',
                'prep_notes' => 'Review behavioral questions',
            ]);

        $createRes->assertStatus(201)
            ->assertJsonPath('interview.interviewer', 'Jane recruiter');

        $interviewId = $createRes->json('interview.id');

        // 2. Update interview
        $updateRes = $this->withHeaders($this->authHeaders())
            ->putJson("/api/interviews/{$interviewId}", [
                'result_notes' => 'Went very well, invited to technical round',
            ]);

        $updateRes->assertStatus(200)
            ->assertJsonPath('interview.result_notes', 'Went very well, invited to technical round');

        // 3. Delete interview
        $deleteRes = $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/interviews/{$interviewId}");

        $deleteRes->assertStatus(200);
        $this->assertDatabaseMissing('interviews', ['id' => $interviewId]);
    }

    public function test_can_manage_contacts(): void
    {
        // 1. Add contact
        $createRes = $this->withHeaders($this->authHeaders())
            ->postJson("/api/applications/{$this->application->id}/contacts", [
                'name' => 'Sarah Connor',
                'role' => 'Tech Recruiter',
                'email' => 'sarah@example.com',
                'phone' => '+60123456789',
                'linkedin_url' => 'https://linkedin.com/in/sarah-connor',
            ]);

        $createRes->assertStatus(201)
            ->assertJsonPath('contact.name', 'Sarah Connor');

        $contactId = $createRes->json('contact.id');

        // 2. Update contact
        $updateRes = $this->withHeaders($this->authHeaders())
            ->putJson("/api/contacts/{$contactId}", [
                'role' => 'Head of Talent Acquisition',
            ]);

        $updateRes->assertStatus(200)
            ->assertJsonPath('contact.role', 'Head of Talent Acquisition');

        // 3. Delete contact
        $deleteRes = $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/contacts/{$contactId}");

        $deleteRes->assertStatus(200);
        $this->assertDatabaseMissing('contacts', ['id' => $contactId]);
    }

    public function test_can_upload_and_delete_documents(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->create('resume_v1.pdf', 200, 'application/pdf');

        $uploadRes = $this->withHeaders($this->authHeaders())
            ->postJson("/api/applications/{$this->application->id}/documents", [
                'kind' => 'cv',
                'document' => $file,
            ]);

        $uploadRes->assertStatus(201)
            ->assertJsonPath('document.kind', 'cv')
            ->assertJsonPath('document.file_name', 'resume_v1.pdf');

        $docId = $uploadRes->json('document.id');

        $deleteRes = $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/documents/{$docId}");

        $deleteRes->assertStatus(200);
        $this->assertDatabaseMissing('documents', ['id' => $docId]);
    }

    public function test_settings_returns_default_sources_including_malaysian_portals(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/settings');

        $response->assertStatus(200)
            ->assertJsonStructure(['sources', 'reminder_days', 'default_location']);

        $sources = $response->json('sources');
        $this->assertContains('MyFutureJobs', $sources);
        $this->assertContains('MauKerja', $sources);
        $this->assertContains('TechStreet', $sources);
        $this->assertContains('Email', $sources);
    }
}

