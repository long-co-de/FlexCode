<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'key',
        'value',
        'group',
        'is_public',
    ];

    /**
     * Get a setting value by key
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function get($key, $default = null)
    {
        return Cache::remember('setting_' . $key, 60 * 60, function () use ($key, $default) {
            $setting = self::where('key', $key)->first();
            return $setting ? $setting->value : $default;
        });
    }

    /**
     * Set a setting value
     *
     * @param string $key
     * @param mixed $value
     * @param string $group
     * @param bool $isPublic
     * @return Setting
     */
    public static function set($key, $value, $group = 'general', $isPublic = true)
    {
        $setting = self::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value,
                'group' => $group,
                'is_public' => $isPublic,
            ]
        );

        Cache::forget('setting_' . $key);
        
        return $setting;
    }

    /**
     * Get all settings as an array
     *
     * @param bool $onlyPublic
     * @return array
     */
    public static function getAllSettings($onlyPublic = false)
    {
        $query = self::query();
        
        if ($onlyPublic) {
            $query->where('is_public', true);
        }
        
        $settings = $query->get();
        
        $result = [];
        foreach ($settings as $setting) {
            $result[$setting->key] = $setting->value;
        }
        
        return $result;
    }

    /**
     * Get settings by group
     *
     * @param string $group
     * @param bool $onlyPublic
     * @return array
     */
    public static function getByGroup($group, $onlyPublic = false)
    {
        $query = self::where('group', $group);
        
        if ($onlyPublic) {
            $query->where('is_public', true);
        }
        
        $settings = $query->get();
        
        $result = [];
        foreach ($settings as $setting) {
            $result[$setting->key] = $setting->value;
        }
        
        return $result;
    }
}