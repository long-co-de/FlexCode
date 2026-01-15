<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CronLog extends Model
{
    protected $fillable = [
        'command_name',
        'status',
        'processed',
        'succeeded',
        'failed',
        'output',
        'error_message',
        'execution_time_seconds',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public static function startLog($commandName)
    {
        return static::create([
            'command_name' => $commandName,
            'status' => 'running',
            'started_at' => now(),
        ]);
    }

    public function finish($status = 'success', $data = [])
    {
        $this->status = $status;
        $this->completed_at = now();
        $this->execution_time_seconds = $this->started_at->diffInSeconds($this->completed_at);
        
        if (isset($data['processed'])) {
            $this->processed = $data['processed'];
        }
        if (isset($data['succeeded'])) {
            $this->succeeded = $data['succeeded'];
        }
        if (isset($data['failed'])) {
            $this->failed = $data['failed'];
        }
        if (isset($data['output'])) {
            $this->output = $data['output'];
        }
        if (isset($data['error_message'])) {
            $this->error_message = $data['error_message'];
        }
        
        $this->save();
        return $this;
    }

    public function scopeByCommand($query, $commandName)
    {
        return $query->where('command_name', $commandName);
    }

    public function scopeRecent($query)
    {
        return $query->orderBy('created_at', 'desc');
    }

    public function scopeSuccessful($query)
    {
        return $query->where('status', 'success');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }
}
