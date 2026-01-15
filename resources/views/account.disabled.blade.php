<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Disabled Account UI — Pure HTML/CSS</title>
<style>
  :root{
    --bg:#0f1724;
    --card:#0b1220;
    --muted:#94a3b8;
    --accent:#60a5fa;
    --glass: rgba(255,255,255,0.03);
    --danger:#fb7185;
    --radius:12px;
  }

  /* Reset-ish */
  *{box-sizing:border-box}
  html,body{height:100%}
  body{
    margin:0;
    font-family:Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
    background: linear-gradient(180deg,var(--bg) 0%, #071025 100%);
    color:#e6eef8;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:28px;
    -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;
  }

  .wrapper{
    width:100%;
    max-width:980px;
    display:grid;
    grid-template-columns: 360px 1fr;
    gap:20px;
  }

  /* Card */
  .card{
    background: linear-gradient(180deg,var(--card), rgba(255,255,255,0.02));
    border-radius:var(--radius);
    padding:20px;
    box-shadow: 0 6px 20px rgba(2,6,23,0.6);
    position:relative;
    overflow:hidden;
  }

  /* Left profile panel */
  .profile{
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:14px;
    text-align:center;
  }
  .avatar{
    width:110px;
    height:110px;
    border-radius:999px;
    background:linear-gradient(135deg,var(--accent), #7dd3fc);
    display:grid;
    place-items:center;
    font-weight:700;
    font-size:34px;
    color:#04263b;
    box-shadow: 0 6px 18px rgba(2,6,23,0.5), inset 0 -6px 18px rgba(255,255,255,0.03);
  }
  .name{font-weight:700; font-size:18px}
  .subtitle{color:var(--muted); font-size:13px}

  .meta{
    width:100%;
    margin-top:6px;
    display:flex;
    flex-direction:column;
    gap:8px;
  }
  .meta .row{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
    padding:8px;
    background:var(--glass);
    border-radius:10px;
    font-size:13px;
    color:var(--muted);
  }

  /* Right form panel */
  .form{
    display:flex;
    flex-direction:column;
    gap:12px;
  }
  h2{margin:0; font-size:18px}
  p.lead{margin:0; color:var(--muted); font-size:13px}

  form{
    margin-top:8px;
    display:grid;
    gap:10px;
    grid-template-columns: 1fr 1fr;
  }

  label{
    display:block;
    font-size:13px;
    color:var(--muted);
    margin-bottom:6px;
  }

  input[type="text"],
  input[type="email"],
  select,
  textarea{
    grid-column: span 2;
    padding:10px 12px;
    border-radius:10px;
    border:1px solid rgba(255,255,255,0.04);
    background: rgba(255,255,255,0.02);
    color:inherit;
    font-size:14px;
    outline: none;
    transition: box-shadow .12s, transform .06s;
  }

  .half { grid-column: auto; }

  textarea{min-height:90px; resize:vertical}

  .actions{
    display:flex;
    gap:10px;
    margin-top:6px;
    align-items:center;
  }

  button{
    border:0;
    padding:10px 14px;
    border-radius:10px;
    font-weight:600;
    cursor:pointer;
    background:linear-gradient(180deg,var(--accent), #3b82f6);
    color:#04263b;
    box-shadow: 0 6px 18px rgba(59,130,246,0.15);
    transition: transform .08s, box-shadow .12s;
  }
  button:active{transform:translateY(1px)}

  /* Disabled overlay / state */
  .disabled-overlay{
    position:absolute;
    inset:0;
    background: linear-gradient(180deg, rgba(2,6,23,0.55), rgba(2,6,23,0.6));
    display:flex;
    align-items:flex-start;
    justify-content:center;
    padding:20px;
    pointer-events:none; /* prevents interaction */
  }

  .notice{
    margin-top:12px;
    background: linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02));
    border-radius:10px;
    padding:12px 14px;
    display:flex;
    gap:10px;
    align-items:center;
    width:100%;
    max-width:420px;
    border: 1px solid rgba(255,255,255,0.03);
    box-shadow: 0 8px 30px rgba(2,6,23,0.5);
  }

  .notice .dot{
    min-width:44px;
    min-height:44px;
    border-radius:10px;
    background: linear-gradient(135deg,var(--danger), #fb7185);
    display:grid;
    place-items:center;
    font-weight:700;
  }
  .notice .txt{
    color:var(--muted);
    font-size:13px;
  }
  .notice strong{color:#fff; font-weight:700; display:block; margin-bottom:4px; font-size:14px}

  /* Make inputs visually disabled */
  input:disabled, textarea:disabled, select:disabled, button:disabled{
    opacity:0.65;
    filter:grayscale(.07);
    cursor:not-allowed;
    background: rgba(255,255,255,0.01);
    box-shadow:none;
    border:1px dashed rgba(255,255,255,0.03);
    color:var(--muted);
  }

  /* Make entire card appear deactivated */
  .card.disabled{
    transform: scale(0.998);
    filter: grayscale(.02) contrast(.96) brightness(.95);
  }

  /* A ribbon badge */
  .ribbon{
    position:absolute;
    right: -56px;
    top: 14px;
    background: #111827;
    color:var(--muted);
    transform: rotate(30deg);
    padding:6px 72px;
    font-size:12px;
    border-radius:6px;
    border:1px solid rgba(255,255,255,0.03);
    box-shadow: 0 6px 18px rgba(2,6,23,0.6);
  }

  /* Responsive */
  @media (max-width:880px){
    .wrapper{grid-template-columns:1fr; padding:6px}
    form{grid-template-columns:1fr}
    .avatar{width:92px;height:92px;font-size:28px}
  }
</style>
</head>
<body>
  <div class="wrapper">
    <!-- Left profile -->
    <div class="card">
    <div class="ribbon">Account paused</div>


    <!-- Right form -->
    <div class="card disabled" aria-disabled="true" role="group" aria-label="Account details (disabled)">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;">
        <div>
          <h2>Account paused</h2>
          <p class="lead">Your access has been paused. This may be for security or policy reasons. Please contact support with your name and email to get help restoring access.</p>
        </div>
      </div>



      <!-- overlay notice -->
      <div class="disabled-overlay" aria-hidden="true">
        <div class="notice" role="status" aria-live="polite">
          <div class="dot">!</div>
          <div class="txt">
            <strong>Account paused</strong>
            Changes are locked while your account is paused. Contact support with your account details to request a review.
            <div style="margin-top:10px; display:flex; gap:10px;">
              <a href="{{ route('contact') }}" style="background:#4338ca;color:white;padding:8px 12px;border-radius:8px;text-decoration:none;">Contact support</a>
              <form method="POST" action="{{ route('logout') }}" style="display:inline">
                @csrf
                <button type="submit" style="background:#dc2626;color:white;padding:8px 12px;border-radius:8px;border:0;cursor:pointer;">Sign out</button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</body>
</html>
