<?php

use App\Http\Controllers\AuthController as A;
use App\Http\Controllers\KelolaController as K;
use App\Http\Controllers\SistemController as S;
use Illuminate\Support\Facades\Route;

Route::post('/login', [A::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [A::class, 'me']);
    Route::post('/logout', [A::class, 'logout']);
    Route::get('/sistem', [S::class, 'index']);
    Route::post('/sso/{kode}', [S::class, 'sso']);

    Route::middleware('can:superadmin')->group(function () {
        Route::get('/users', [K::class, 'index']);
        Route::post('/users', [K::class, 'store']);
        Route::patch('/users/{user}', [K::class, 'update'])->whereNumber('user');
        Route::delete('/users/{user}', [K::class, 'destroy'])->whereNumber('user');
        Route::put('/akses', [K::class, 'akses']);
    });
});
