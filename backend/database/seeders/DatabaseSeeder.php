<?php

namespace Database\Seeders;

use App\Models\Application;
use App\Models\AppSetting;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Primary admin account (override password via ADMIN_SEED_PASSWORD in .env)
        User::updateOrCreate(
            ['email' => 'markirfan512@gmail.com'],
            [
                'name' => 'Irfan',
                'password' => Hash::make(env('ADMIN_SEED_PASSWORD', 'ChangeMe123!')),
                'email_verified_at' => now(),
            ]
        );

        // Demo user account for test suite compatibility
        User::firstOrCreate(
            ['email' => 'user@jobtracker.local'],
            [
                'name' => 'Job Seeker',
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]
        );

        // App Settings
        AppSetting::set('reminder_days', 7);
        AppSetting::set('sources', [
            'JobStreet',
            'LinkedIn',
            'MyFutureJobs',
            'MauKerja',
            'TechStreet',
            'Hiredly',
            'Indeed',
            'Company Site',
            'Email',
            'Referral',
            'Other',
        ]);
        AppSetting::set('default_location', 'Kuala Lumpur');

        // Sample Malaysian Tech Companies & Applications for quick testing
        $grab = Company::firstOrCreate(
            ['name' => 'Grab Malaysia'],
            [
                'website' => 'https://grab.careers',
                'industry' => 'Technology / Superapp',
                'size' => '10000+ employees',
                'location' => 'Petaling Jaya, Selangor',
            ]
        );

        $app1 = Application::firstOrCreate(
            ['job_title' => 'Senior Fullstack Engineer', 'company_id' => $grab->id],
            [
                'job_url' => 'https://grab.careers/jobs/senior-fullstack-engineer',
                'source' => 'LinkedIn',
                'date_applied' => now()->subDays(12)->toDateString(),
                'location' => 'Petaling Jaya',
                'job_description' => "We are looking for a Senior Fullstack Engineer proficient in modern web architecture, REST APIs, and distributed systems to build high-scale mobility and financial services.",
                'status' => 'Interview',
                'follow_up_date' => now()->addDays(2)->toDateString(),
                'notes' => 'Passed first technical assessment. Final round with Engineering Lead scheduled.',
            ]
        );
        if ($app1->statusHistory()->count() === 0) {
            $app1->statusHistory()->createMany([
                ['from_status' => null, 'to_status' => 'Applied', 'changed_at' => now()->subDays(12)],
                ['from_status' => 'Applied', 'to_status' => 'Screening', 'changed_at' => now()->subDays(9)],
                ['from_status' => 'Screening', 'to_status' => 'Interview', 'changed_at' => now()->subDays(3)],
            ]);
        }

        $airasia = Company::firstOrCreate(
            ['name' => 'AirAsia MOVE'],
            [
                'website' => 'https://airasia.com',
                'industry' => 'Travel & Fintech',
                'size' => '5000+ employees',
                'location' => 'KL Sentral, Kuala Lumpur',
            ]
        );

        $app2 = Application::firstOrCreate(
            ['job_title' => 'Laravel & React Developer', 'company_id' => $airasia->id],
            [
                'job_url' => 'https://jobstreet.com.my/job/airasia-laravel-react',
                'source' => 'JobStreet',
                'date_applied' => now()->subDays(7)->toDateString(),
                'location' => 'Kuala Lumpur',
                'job_description' => "Looking for a proactive developer experienced in Laravel REST APIs and React frontends to enhance travel booking and rewards services.",
                'status' => 'Technical Test',
                'notes' => 'Received technical take-home test on Thursday. Due in 5 days.',
            ]
        );
        if ($app2->statusHistory()->count() === 0) {
            $app2->statusHistory()->createMany([
                ['from_status' => null, 'to_status' => 'Applied', 'changed_at' => now()->subDays(7)],
                ['from_status' => 'Applied', 'to_status' => 'Technical Test', 'changed_at' => now()->subDays(2)],
            ]);
        }

        $carsome = Company::firstOrCreate(
            ['name' => 'Carsome Malaysia'],
            [
                'website' => 'https://carsome.my',
                'industry' => 'Automotive E-commerce',
                'size' => '2000+ employees',
                'location' => 'Mutiara Damansara, Selangor',
            ]
        );

        $app3 = Application::firstOrCreate(
            ['job_title' => 'Backend API Engineer', 'company_id' => $carsome->id],
            [
                'job_url' => 'https://my.hiredly.com/jobs/carsome-backend-engineer',
                'source' => 'Hiredly',
                'date_applied' => now()->subDays(2)->toDateString(),
                'location' => 'Mutiara Damansara',
                'job_description' => "Responsible for developing robust microservices and managing database queries across our regional platform.",
                'status' => 'Applied',
                'notes' => 'Submitted via Hiredly. Waiting for HR review.',
            ]
        );
        if ($app3->statusHistory()->count() === 0) {
            $app3->statusHistory()->create([
                'from_status' => null,
                'to_status' => 'Applied',
                'changed_at' => now()->subDays(2),
            ]);
        }

        $tng = Company::firstOrCreate(
            ['name' => "Touch 'n Go Digital"],
            [
                'website' => 'https://touchngo.com.my',
                'industry' => 'Fintech / E-wallet',
                'size' => '1000+ employees',
                'location' => 'Bangsar South, Kuala Lumpur',
            ]
        );

        $app4 = Application::firstOrCreate(
            ['job_title' => 'Senior Frontend Engineer', 'company_id' => $tng->id],
            [
                'job_url' => 'https://indeed.com/viewjob?jk=tng-frontend-engineer',
                'source' => 'Indeed',
                'date_applied' => now()->subDays(18)->toDateString(),
                'location' => 'Bangsar South',
                'job_description' => "Leading the web experiences and dashboard portals powering payment services across Malaysia.",
                'status' => 'Offer',
                'follow_up_date' => now()->addDays(1)->toDateString(),
                'notes' => 'Received formal offer letter. Reviewing contract and onboarding terms.',
            ]
        );
        if ($app4->statusHistory()->count() === 0) {
            $app4->statusHistory()->createMany([
                ['from_status' => null, 'to_status' => 'Applied', 'changed_at' => now()->subDays(18)],
                ['from_status' => 'Applied', 'to_status' => 'Screening', 'changed_at' => now()->subDays(14)],
                ['from_status' => 'Screening', 'to_status' => 'Interview', 'changed_at' => now()->subDays(8)],
                ['from_status' => 'Interview', 'to_status' => 'Offer', 'changed_at' => now()->subDays(1)],
            ]);
        }
    }
}
