<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_check_returns_ok(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'api',
                'database' => ['connected', 'connection'],
                'timezone',
                'timestamp',
            ]);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'user@jobtracker.local',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'user@jobtracker.local',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'token',
                'user' => ['id', 'name', 'email'],
            ]);
    }

    public function test_user_cannot_login_with_invalid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'user@jobtracker.local',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'user@jobtracker.local',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_authenticated_user_can_access_me_and_logout(): void
    {
        $user = User::factory()->create([
            'email' => 'user@jobtracker.local',
            'password' => Hash::make('password123'),
        ]);

        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'user@jobtracker.local',
            'password' => 'password123',
        ]);

        $token = $loginResponse->json('token');

        // Check /api/auth/me
        $meResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me');

        $meResponse->assertStatus(200)
            ->assertJson([
                'user' => [
                    'email' => 'user@jobtracker.local',
                ],
            ]);

        // Logout
        $logoutResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/logout');

        $logoutResponse->assertStatus(200)
            ->assertJson(['message' => 'Logged out successfully']);

        // Clear resolved guard user in test application container
        $this->app['auth']->forgetGuards();

        // Me after logout should be unauthorized
        $afterLogoutResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me');

        $afterLogoutResponse->assertStatus(401);
    }

    public function test_user_can_change_password_with_valid_current_password(): void
    {
        $user = User::factory()->create([
            'email' => 'user@jobtracker.local',
            'password' => Hash::make('password123'),
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/auth/password', [
                'current_password' => 'password123',
                'new_password' => 'newpassword456',
                'new_password_confirmation' => 'newpassword456',
            ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Password changed successfully']);

        // Verify user can now log in with the new password
        $this->assertTrue(Hash::check('newpassword456', $user->fresh()->password));
    }

    public function test_user_cannot_change_password_with_invalid_current_password(): void
    {
        $user = User::factory()->create([
            'email' => 'user@jobtracker.local',
            'password' => Hash::make('password123'),
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/auth/password', [
                'current_password' => 'incorrectpassword',
                'new_password' => 'newpassword456',
                'new_password_confirmation' => 'newpassword456',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);
    }

    public function test_authenticated_user_can_list_and_create_users(): void
    {
        $user = User::factory()->create([
            'name' => 'Irfan',
            'email' => 'markirfan512@gmail.com',
            'password' => Hash::make('test-admin-password'),
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        // List users
        $listRes = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/users');

        $listRes->assertStatus(200)
            ->assertJsonStructure(['users']);

        // Create new user
        $createRes = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/users', [
                'name' => 'Sarah Team',
                'email' => 'sarah@example.com',
                'password' => 'supersecure999',
            ]);

        $createRes->assertStatus(201)
            ->assertJsonPath('user.email', 'sarah@example.com')
            ->assertJsonPath('user.name', 'Sarah Team');

        $this->assertDatabaseHas('users', ['email' => 'sarah@example.com']);
    }

    public function test_non_admin_cannot_create_new_user(): void
    {
        $nonAdmin = User::factory()->create([
            'name' => 'Other Member',
            'email' => 'other@example.com',
            'password' => Hash::make('password123'),
        ]);

        $token = $nonAdmin->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/users', [
                'name' => 'Forbidden User',
                'email' => 'forbidden@example.com',
                'password' => 'secret12345',
            ]);

        $response->assertStatus(403)
            ->assertJson(['message' => 'Unauthorized: Only markirfan512@gmail.com can add new users.']);

        $this->assertDatabaseMissing('users', ['email' => 'forbidden@example.com']);
    }
}
