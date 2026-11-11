<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public const ADMIN_EMAIL = 'markirfan512@gmail.com';

    /**
     * List all users.
     */
    public function index(Request $request): JsonResponse
    {
        $users = User::select('id', 'name', 'email', 'created_at')
            ->orderBy('id', 'asc')
            ->get();

        $currentUser = $request->user();
        $canAddUsers = $currentUser && strtolower(trim($currentUser->email)) === strtolower(self::ADMIN_EMAIL);

        return response()->json([
            'users' => $users,
            'can_add_users' => $canAddUsers,
            'admin_email' => self::ADMIN_EMAIL,
        ]);
    }

    /**
     * Create a new user account. Only the primary administrator (markirfan512@gmail.com) can add users.
     */
    public function store(Request $request): JsonResponse
    {
        $currentUser = $request->user();

        if (!$currentUser || strtolower(trim($currentUser->email)) !== strtolower(self::ADMIN_EMAIL)) {
            return response()->json([
                'message' => 'Unauthorized: Only markirfan512@gmail.com can add new users.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ], [
            'name.required' => 'Please specify the user name.',
            'email.required' => 'Please provide an email address.',
            'email.email' => 'Please provide a valid email address.',
            'email.unique' => 'A user with this email address already exists.',
            'password.required' => 'Please provide a password.',
            'password.min' => 'Password must be at least 8 characters.',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => strtolower(trim($validated['email'])),
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(),
        ]);

        return response()->json([
            'message' => 'User created successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'created_at' => $user->created_at,
            ],
        ], 201);
    }
}

