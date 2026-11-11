<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('job_title');
            $table->text('job_url')->nullable();
            $table->string('source')->default('Other');
            $table->date('date_applied');
            $table->string('location')->default('Kuala Lumpur');
            $table->longText('job_description')->nullable();
            $table->string('screenshot_path')->nullable();
            $table->string('status')->default('Applied');
            $table->date('follow_up_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['status', 'date_applied']);
            $table->index('follow_up_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};

