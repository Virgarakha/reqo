<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class AiConversation extends Model
{
    use HasUuids;

    protected $fillable = [
        'project_id',
        'role',
        'content'
    ];

    public $incrementing = false;
    protected $keyType = 'string';

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
