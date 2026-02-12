<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DbTable extends Model
{
    protected $fillable = [
        'id',
        'project_id',
        'name',
        'position_x',
        'position_y'
    ];

    public $incrementing = false;
    protected $keyType = 'string';

    /*
    |--------------------------------------------------------------------------
    | RELATIONS
    |--------------------------------------------------------------------------
    */

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function columns()
    {
        return $this->hasMany(DbColumn::class, 'table_id');
    }

    public function edgesFrom()
    {
        return $this->hasMany(DbEdge::class, 'source_table_id');
    }

    public function edgesTo()
    {
        return $this->hasMany(DbEdge::class, 'target_table_id');
    }
}
