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
        Schema::create('interviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('applications')->cascadeOnDelete();
            $table->string('interview_type')->default('HR');
            $table->dateTime('scheduled_at');
            $table->string('interviewer')->nullable();
            $table->string('link_or_location')->nullable();
            $table->text('prep_notes')->nullable();
            $table->text('result_notes')->nullable();
            $table->timestamps();

            $table->index(['scheduled_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('interviews');
    }
};

