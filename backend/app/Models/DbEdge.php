<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class DbEdge extends Model
{
    use HasUuids;

    protected $fillable = [
        'project_id',
        'source_table_id',
        'source_column',
        'target_table_id',
        'target_column',
        'label'
    ];

    public $incrementing = false;
    protected $keyType = 'string';

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
