<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('db_columns', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('table_id');
            $table->string('name');
            $table->string('type');
            $table->boolean('is_primary')->default(false);
            $table->boolean('is_unique')->default(false);
            $table->boolean('is_nullable')->default(true);

            $table->uuid('foreign_table_id')->nullable();
            $table->string('foreign_column')->nullable();

            $table->timestamps();

            $table->foreign('table_id')
                  ->references('id')
                  ->on('db_tables')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('db_columns');
    }
};
