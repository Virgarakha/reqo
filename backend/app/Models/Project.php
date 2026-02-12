<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Project extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'description',
        'theme'
    ];

    public $incrementing = false;
    protected $keyType = 'string';

    // ================= RELATIONS =================

    public function tables()
    {
        return $this->hasMany(DbTable::class);
    }

    public function relations()
    {
        return $this->hasMany(DbRelation::class);
    }

    public function edges()
    {
        return $this->hasMany(DbEdge::class);
    }

    public function conversations()
    {
        return $this->hasMany(AiConversation::class);
    }

    public function versions()
    {
        return $this->hasMany(ProjectVersion::class);
    }
}
