<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CronLog;
use App\Services\CronLogService;
use Inertia\Inertia;

class CronLogController extends Controller
{
    public function index()
    {
        $logs = CronLog::recent()->paginate(50);
        $stats = CronLogService::getAllStats();

        return Inertia::render('Admin/CronLogs/Index', [
            'logs' => $logs,
            'stats' => $stats,
        ]);
    }

    public function show(CronLog $cronLog)
    {
        return Inertia::render('Admin/CronLogs/Show', [
            'log' => $cronLog,
        ]);
    }

    public function command($commandName)
    {
        $logs = CronLog::byCommand($commandName)->recent()->paginate(30);
        $stats = CronLogService::getCommandStats($commandName);

        return Inertia::render('Admin/CronLogs/Command', [
            'commandName' => $commandName,
            'logs' => $logs,
            'stats' => $stats,
        ]);
    }
}
