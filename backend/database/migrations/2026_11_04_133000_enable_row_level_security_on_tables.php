<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Enables Row Level Security (RLS) on all public tables for Supabase security compliance.
     * In PostgreSQL, table owners and superusers (which Laravel connects as) bypass RLS by default.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        $tables = [
            'migrations',
            'users',
            'password_reset_tokens',
            'sessions',
            'cache',
            'cache_locks',
            'jobs',
            'job_batches',
            'failed_jobs',
            'personal_access_tokens',
            'companies',
            'applications',
            'status_history',
            'interviews',
            'contacts',
            'documents',
            'app_settings',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                DB::statement("ALTER TABLE \"{$table}\" ENABLE ROW LEVEL SECURITY;");
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        $tables = [
            'migrations',
            'users',
            'password_reset_tokens',
            'sessions',
            'cache',
            'cache_locks',
            'jobs',
            'job_batches',
            'failed_jobs',
            'personal_access_tokens',
            'companies',
            'applications',
            'status_history',
            'interviews',
            'contacts',
            'documents',
            'app_settings',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                DB::statement("ALTER TABLE \"{$table}\" DISABLE ROW LEVEL SECURITY;");
            }
        }
    }
};

