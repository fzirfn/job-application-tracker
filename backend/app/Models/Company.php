<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'website',
        'industry',
        'size',
        'location',
        'logo_url',
    ];

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }
}

