<?php

use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\InterviewController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::get('/health', [HealthController::class, 'check']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Authenticated routes (Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::put('/auth/password', [AuthController::class, 'changePassword']);

    // User management
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);

    // Dashboard summary
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

    // Applications CRUD, search, filter, status pipeline & screenshots
    Route::get('/applications', [ApplicationController::class, 'index']);
    Route::post('/applications', [ApplicationController::class, 'store']);
    Route::post('/applications/upload-screenshot', [ApplicationController::class, 'uploadScreenshot']);
    Route::get('/applications/{id}', [ApplicationController::class, 'show']);
    Route::put('/applications/{id}', [ApplicationController::class, 'update']);
    Route::patch('/applications/{id}/status', [ApplicationController::class, 'updateStatus']);
    Route::delete('/applications/{id}', [ApplicationController::class, 'destroy']);

    // Interviews
    Route::post('/applications/{id}/interviews', [InterviewController::class, 'store']);
    Route::put('/interviews/{id}', [InterviewController::class, 'update']);
    Route::delete('/interviews/{id}', [InterviewController::class, 'destroy']);

    // Contacts
    Route::post('/applications/{id}/contacts', [ContactController::class, 'store']);
    Route::put('/contacts/{id}', [ContactController::class, 'update']);
    Route::delete('/contacts/{id}', [ContactController::class, 'destroy']);

    // Documents (CV / Cover Letter)
    Route::post('/applications/{id}/documents', [DocumentController::class, 'store']);
    Route::delete('/documents/{id}', [DocumentController::class, 'destroy']);

    // Companies
    Route::post('/companies/lookup', [CompanyController::class, 'lookup']);
    Route::get('/companies', [CompanyController::class, 'index']);
    Route::get('/companies/{id}', [CompanyController::class, 'show']);

    // Settings
    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings', [SettingController::class, 'update']);
});
