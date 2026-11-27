<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
        // Aturan isian dijaga CHECK/UNIQUE di database. Tolakannya dijadikan pesan yang bisa dibaca user.
        $exceptions->render(function (QueryException $e) {
            $msg = match ($e->getCode()) {
                '23505' => str_contains($e->getMessage(), 'users_nik_key') ? 'NIK sudah dipakai akun lain.' : 'Data sudah ada.',
                '23502', '23514', '22P02' => 'Isian belum lengkap atau tidak sesuai.',
                '23503' => 'Akun tidak ditemukan.',
                default => null,
            };

            return $msg ? response()->json(['message' => $msg], 422) : null;
        });
    })->create();
