<?php

namespace App\Models;
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class DbRelation extends Model
{
    use HasUuids;

    protected $fillable = [
        'project_id',
        'from_table_id',
        'to_table_id',
        'relation_type'
    ];

    public $incrementing = false;
    protected $keyType = 'string';

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function fromTable()
    {
        return $this->belongsTo(DbTable::class, 'from_table_id');
    }

    public function toTable()
    {
        return $this->belongsTo(DbTable::class, 'to_table_id');
    }
}
