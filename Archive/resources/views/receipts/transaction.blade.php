@php
use App\Models\Setting;
@endphp
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Transaction Receipt</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f0f2f5;
            line-height: 1.4;
        }
        .receipt {
            max-width: 380px;
            margin: 0 auto;
            padding: 24px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .logo {
            text-align: center;
            margin-bottom: 16px;
        }
        .logo img {
            width: 70%;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom: 1px solid #eee;
        }
        .header h1 {
            font-size: 16px;
            margin: 0 0 4px;
            color: #111827;
        }
        .header p {
            font-size: 12px;
            color: #6b7280;
            margin: 4px 0;
        }
        .amount {
            text-align: center;
            font-size: 28px;
            font-weight: 600;
            margin: 16px 0;
            color: #111827;
            letter-spacing: -0.5px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
        }
        .naira-icon {
            width: 20px;
            height: 20px;
            margin-top: -2px;
        }
        .status {
            text-align: center;
            margin: 0 0 20px;
            padding: 6px 12px;
            border-radius: 16px;
            font-size: 13px;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .status::before {
            content: "";
            display: inline-block;
            width: 6px;
            height: 6px;
            border-radius: 50%;
        }
        .status-successful {
            background: #ecfdf5;
            color: #059669;
        }
        .status-successful::before {
            background: #059669;
        }
        .status-pending {
            background: #fffbeb;
            color: #b45309;
        }
        .status-pending::before {
            background: #b45309;
        }
        .status-failed {
            background: #fef2f2;
            color: #dc2626;
        }
        .status-failed::before {
            background: #dc2626;
        }
        .status-wrapper {
            text-align: center;
            margin-bottom: 20px;
        }
        .details {
            margin: 0 0 20px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
        }
        .row {
            display: flex;
            justify-content: space-between;
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        .row:last-child {
            border-bottom: none;
        }
        .label {
            color: #6b7280;
            font-size: 12px;
        }
        .value {
            color: #111827;
            font-weight: 500;
            font-size: 12px;
            text-align: right;
        }
        .reference {
            text-align: center;
            background: #f9fafb;
            padding: 12px;
            margin: 20px 0;
            border-radius: 8px;
            font-family: ui-monospace, monospace;
            font-size: 12px;
            color: #374151;
            border: 1px dashed #e5e7eb;
        }
        .reference .label {
            display: block;
            margin-bottom: 4px;
            color: #6b7280;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 11px;
        }
        .footer p {
            margin: 3px 0;
        }
        .company-info {
            text-align: center;
            color: #6b7280;
            font-size: 11px;
            margin: 8px 0 0;
        }
        .company-info p { margin: 2px 0; }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="logo">
            @php
                $logoPath = Setting::get('site_logo_path');
                $logoUrl = $logoPath ? public_path($logoPath) : public_path('logo.png');
                $siteName = Setting::get('site_name', 'BorrowLite');
            @endphp
            <img src="{{ $logoUrl }}" alt="{{ $siteName }}">
        </div>

        <div class="header">
            <h1>{{ Setting::get('receipt_title', 'Transaction Receipt') }}</h1>
            <p>{{ date('D, M j, Y g:i A', strtotime($date)) }}</p>
            <p>{{ Setting::get('receipt_number_label', 'Receipt No') }}: {{ $receipt_no }}</p>
        </div>

        @php
            $companyName = Setting::get('company_name', $siteName);
            $companyAddress = Setting::get('company_address');
            $companyEmail = Setting::get('contact_email');
            $companyPhone = Setting::get('contact_phone');
            $companyWebsite = Setting::get('company_website');
        @endphp
        <div class="company-info">
            <p><strong>{{ $companyName }}</strong></p>
            @if($companyAddress)
                <p>{{ $companyAddress }}</p>
            @endif
            @if($companyEmail || $companyPhone)
                <p>
                    @if($companyEmail) {{ $companyEmail }} @endif
                    @if($companyEmail && $companyPhone) | @endif
                    @if($companyPhone) {{ $companyPhone }} @endif
                </p>
            @endif
            @if($companyWebsite)
                <p>borrowlite.com</p>
            @endif
        </div>

        <div class="amount">
            <svg class="naira-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 3H4.5L9 15H15L19.5 3H22M2 21H4.5L9 9H15L19.5 21H22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="2" y1="9" x2="22" y2="9" stroke="currentColor" stroke-width="2"/>
                <line x1="2" y1="15" x2="22" y2="15" stroke="currentColor" stroke-width="2"/>
            </svg>
            {{ number_format($transaction->amount, 2) }}
        </div>

        <div class="status-wrapper">
            <div class="status status-{{ $transaction->status }}">
                {{ ucfirst($transaction->status) }}
            </div>
        </div>

        <div class="details">
            <div class="row">
                <span class="label">Type</span>
                <span class="value">{{ ucwords(str_replace('_', ' ', $transaction->type)) }}</span>
            </div>
            @if($transaction->recipient)
            <div class="row">
                <span class="label">Recipient</span>
                <span class="value">{{ $transaction->recipient }}</span>
            </div>
            @endif
            @if($transaction->fee > 0)
            <div class="row">
                <span class="label">Fee</span>
                <span class="value">
                    <svg class="naira-icon" style="width: 12px; height: 12px; display: inline;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 3H4.5L9 15H15L19.5 3H22M2 21H4.5L9 9H15L19.5 21H22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <line x1="2" y1="9" x2="22" y2="9" stroke="currentColor" stroke-width="2"/>
                        <line x1="2" y1="15" x2="22" y2="15" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    {{ number_format($transaction->fee, 2) }}
                </span>
            </div>
            @endif
            @if(isset($transaction->meta_data['payment_method']))
            <div class="row">
                <span class="label">Payment Method</span>
                <span class="value">{{ $transaction->meta_data['payment_method'] }}</span>
            </div>
            @endif
            <div class="row">
                <span class="label">Date</span>
                <span class="value">{{ date('M j, Y g:i A', strtotime($transaction->created_at)) }}</span>
            </div>
        </div>

        <div class="reference">
            <span class="label">Transaction Reference</span>
            {{ $transaction->reference }}
        </div>

        <div class="footer">
            <p>{{ Setting::get('receipt_thank_you', 'Thank you for your purchase!') }}</p>
            <p>{{ Setting::get('site_description', 'Buy airtime, data, cable TV subscriptions, and pay electricity bills') }}</p>
            <p>
                {{ Setting::get('receipt_support_label', 'For support:') }}
                {{ Setting::get('contact_email', 'support@borrowlite.com') }}
                @if(Setting::get('contact_phone')) | {{ Setting::get('contact_phone') }} @endif
            </p>
            <p>&copy; {{ date('Y') }} {{ Setting::get('company_name', Setting::get('site_name', 'BorrowLite')) }}. {{ Setting::get('receipt_rights', 'All rights reserved.') }}</p>
        </div>
    </div>
</body>
</html>
