<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ProjectVersion extends Model
{
    use HasUuids;

    protected $fillable = [
        'project_id',
        'snapshot',
        'version_number'
    ];

    protected $casts = [
        'snapshot' => 'array'
    ];

    public $incrementing = false;
    protected $keyType = 'string';

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
