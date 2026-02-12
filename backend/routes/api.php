<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\ProjectController;

Route::prefix('projects')->group(function () {

    Route::post('/', [ProjectController::class, 'store']);
    Route::get('{id}', [ProjectController::class, 'show']);
    Route::put('{id}/save', [ProjectController::class, 'saveSchema']);
    Route::post('{id}/conversation', [ProjectController::class, 'saveConversation']);
    Route::post('{id}/version', [ProjectController::class, 'saveVersion']);
    Route::delete('{id}', [ProjectController::class, 'destroy']);

});
