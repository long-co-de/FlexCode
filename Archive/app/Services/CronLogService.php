<?php

namespace App\Services;

use App\Models\CronLog;

class CronLogService
{
    private $log;

    public function startLog($commandName)
    {
        $this->log = CronLog::startLog($commandName);
        return $this->log;
    }

    public function finishSuccess($data = [])
    {
        if ($this->log) {
            $this->log->finish('success', $data);
        }
    }

    public function finishFailed($errorMessage, $data = [])
    {
        if ($this->log) {
            $data['error_message'] = $errorMessage;
            $this->log->finish('failed', $data);
        }
    }

    public function getLog()
    {
        return $this->log;
    }

    public static function getCommandStats($commandName)
    {
        $logs = CronLog::byCommand($commandName)->recent()->take(30)->get();
        
        if ($logs->isEmpty()) {
            return [
                'total_runs' => 0,
                'successful' => 0,
                'failed' => 0,
                'success_rate' => 0,
                'avg_execution_time' => 0,
                'last_run' => null,
            ];
        }

        $successful = $logs->where('status', 'success')->count();
        $failed = $logs->where('status', 'failed')->count();
        $total = $logs->count();
        $avgTime = round($logs->avg('execution_time_seconds'), 2);

        return [
            'total_runs' => $total,
            'successful' => $successful,
            'failed' => $failed,
            'success_rate' => round(($successful / $total) * 100, 2),
            'avg_execution_time' => $avgTime,
            'last_run' => $logs->first(),
        ];
    }

    public static function getAllStats()
    {
        $commands = CronLog::distinct()->pluck('command_name');
        $stats = [];

        foreach ($commands as $command) {
            $stats[$command] = self::getCommandStats($command);
        }

        return $stats;
    }
}
