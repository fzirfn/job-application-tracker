<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contact extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_id',
        'name',
        'role',
        'email',
        'phone',
        'linkedin_url',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }
}

