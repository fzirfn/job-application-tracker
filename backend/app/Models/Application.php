<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Application extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'job_title',
        'job_url',
        'source',
        'date_applied',
        'location',
        'job_description',
        'screenshot_path',
        'status',
        'follow_up_date',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'date_applied' => 'date',
            'follow_up_date' => 'date',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(StatusHistory::class)->orderBy('changed_at', 'desc');
    }

    public function interviews(): HasMany
    {
        return $this->hasMany(Interview::class)->orderBy('scheduled_at', 'asc');
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    /**
     * Change status and automatically log to status_history
     */
    public function setStatus(string $newStatus): void
    {
        $oldStatus = $this->status;
        if ($oldStatus === $newStatus) {
            return;
        }

        $this->status = $newStatus;
        $this->save();

        $this->statusHistory()->create([
            'from_status' => $oldStatus,
            'to_status' => $newStatus,
            'changed_at' => now(),
        ]);
    }
}

