<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Display the notification management page.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        // Get user counts for different roles
        $userCounts = [
            'all' => User::count(),
            'users' => User::where('role', 'user')->count(),
            'agents' => User::where('role', 'agent')->count(),
            'admins' => User::where('role', 'admin')->count(),
        ];

        return Inertia::render('Admin/Notifications/Index', [
            'userCounts' => $userCounts,
        ]);
    }
    
    /**
     * Display the notification history page.
     *
     * @return \Inertia\Response
     */
    public function history()
    {
        // Get admin notifications (sent by the system)
        $notifications = DB::table('notifications')
            // ->where('type', 'App\Notifications\AdminNotification')
            ->orderBy('created_at', 'desc')
            ->paginate(10);
            
        return Inertia::render('Admin/Notifications/History', [
            'notifications' => $notifications,
        ]);
    }

    /**
     * Send notifications to users.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function send(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'required|in:info,success,warning,error',
            'target' => 'required|in:all,role,individual,bulk',
            'role' => 'required_if:target,role|in:user,agent,admin',
            'user_ids' => 'required_if:target,individual|array',
            'user_ids.*' => 'exists:users,id',
            'action' => 'nullable|string|max:255',
            'action_url' => 'nullable|string|max:255',
            'bulk_criteria' => 'required_if:target,bulk|in:active,inactive,recent,wallet_balance',
            'bulk_value' => 'required_if:bulk_criteria,wallet_balance',
            'bulk_operator' => 'required_if:bulk_criteria,wallet_balance|in:greater,less,equal',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $title = $request->title;
        $message = $request->message;
        $type = $request->type;
        $action = $request->action;
        $actionUrl = $request->action_url;

        switch ($request->target) {
            case 'all':
                $this->notificationService->sendSystemNotificationToAllUsers(
                    $title,
                    $message,
                    $type,
                    $action,
                    $actionUrl
                );
                $targetDescription = 'all users';
                break;

            case 'role':
                $this->notificationService->sendSystemNotificationToRole(
                    $request->role,
                    $title,
                    $message,
                    $type,
                    $action,
                    $actionUrl
                );
                $targetDescription = 'all ' . $request->role . 's';
                break;

            case 'individual':
                $this->notificationService->sendSystemNotificationToUsers(
                    $request->user_ids,
                    $title,
                    $message,
                    $type,
                    $action,
                    $actionUrl
                );
                $targetDescription = count($request->user_ids) . ' selected users';
                break;
                
            case 'bulk':
                $this->notificationService->sendSystemNotificationByBulkCriteria(
                    $request->bulk_criteria,
                    $request->bulk_value,
                    $request->bulk_operator,
                    $title,
                    $message,
                    $type,
                    $action,
                    $actionUrl
                );
                
                // Determine target description for user feedback
                switch ($request->bulk_criteria) {
                    case 'active':
                        $targetDescription = 'active users';
                        break;
                        
                    case 'inactive':
                        $targetDescription = 'inactive users';
                        break;
                        
                    case 'recent':
                        $targetDescription = 'users registered in the last 30 days';
                        break;
                        
                    case 'wallet_balance':
                        $value = (float) $request->bulk_value;
                        
                        if ($request->bulk_operator === 'greater') {
                            $targetDescription = 'users with wallet balance greater than ₦' . $value;
                        } elseif ($request->bulk_operator === 'less') {
                            $targetDescription = 'users with wallet balance less than ₦' . $value;
                        } else {
                            $targetDescription = 'users with wallet balance equal to ₦' . $value;
                        }
                        break;
                        
                    default:
                        $targetDescription = 'users matching criteria';
                }
                break;
        }

        return redirect()->route('admin.notifications.history')
            ->with('success', 'Notification sent successfully to ' . $targetDescription);
    }

    /**
     * Get users for selection in the notification form.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUsers(Request $request)
    {
        $search = $request->input('search', '');
        $role = $request->input('role', null);
        
        $query = User::query()
            ->select('id', 'name', 'email', 'phone_number', 'role')
            ->orderBy('name');
            
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone_number', 'like', "%{$search}%");
            });
        }
        
        if ($role) {
            $query->where('role', $role);
        }
        
        $users = $query->paginate(10);
        
        return response()->json($users);
    }
}