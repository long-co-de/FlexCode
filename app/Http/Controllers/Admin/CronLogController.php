<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CronLog;
use App\Services\CronLogService;
use Inertia\Inertia;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Http\Request;

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

    public function dispatchCommand(Request $request)
    {
        $request->validate([
            'command' => 'required|string',
        ]);

        try {
            // We use Artisan::call to run the command synchronously for the admin
            Artisan::call($request->command);
            $output = Artisan::output();

            return back()->with('success', "Command '{$request->command}' executed successfully. Output: " . $output);
        } catch (\Exception $e) {
            return back()->with('error', "Failed to execute command '{$request->command}': " . $e->getMessage());
        }
    }

    public function dispatchAll()
    {
        $commands = [
            'vtu:update-data-plans',
            'vtu:check-transactions',
            'borrowing:process-repayments',
            'borrowing:handle-overdue',
            'borrowing:send-reminders --days=3',
            'borrowing:send-reminders --days=1',
        ];

        $results = [];
        foreach ($commands as $command) {
            try {
                Artisan::call($command);
                $results[] = "✓ {$command}";
            } catch (\Exception $e) {
                $results[] = "✗ {$command}: " . $e->getMessage();
            }
        }

        return back()->with('success', "Dispatched all commands: " . implode(', ', $results));
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
