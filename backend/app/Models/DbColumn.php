<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class DbColumn extends Model
{
    use HasUuids;

    protected $fillable = [
        'table_id',
        'name',
        'type',
        'is_primary',
        'is_unique',
        'is_nullable',
        'foreign_table_id',
        'foreign_column',

    ];

    public function table()
    {
        return $this->belongsTo(DbTable::class, 'table_id');
    }
}
