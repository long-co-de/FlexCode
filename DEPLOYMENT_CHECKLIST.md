# Production Deployment Checklist - Atomic Transaction Security

**Project:** BorrowLite  
**Feature:** Atomic Transaction Security Implementation  
**Date:** January 15, 2026  
**Deployed By:** [Name]  
**Approval:** [Sign-off]

---

## Pre-Deployment (48 Hours Before)

### Database & Infrastructure
- [ ] Database backup created and verified
  ```bash
  mysqldump --all-databases > backup_$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] Redis/Cache cluster verified working
  ```bash
  redis-cli PING
  ```
- [ ] Database version confirmed (MySQL 8.0+)
  ```sql
  SELECT VERSION();
  ```
- [ ] Connection pool settings reviewed
- [ ] Query timeout settings appropriate (> 30 seconds)

### Code Review
- [ ] AtomicController code reviewed by 2+ senior developers
- [ ] PreventRapidTransactions middleware reviewed
- [ ] WalletController changes reviewed
- [ ] No hardcoded values or test code left
- [ ] All error messages user-friendly

### Documentation
- [ ] All documentation files present:
  - [ ] ATOMIC_TRANSACTION_SECURITY.md
  - [ ] ATOMIC_TRANSACTION_QUICK_REF.md
  - [ ] ATOMIC_IMPLEMENTATION_SUMMARY.md
- [ ] Team briefing scheduled
- [ ] Support team trained on new error messages

---

## 24 Hours Before Deployment

### Testing
- [ ] All unit tests passing
  ```bash
  php artisan test
  ```
- [ ] Integration tests with real database passing
- [ ] Load test completed (simulate 100 concurrent users)
- [ ] Race condition test passed (10 concurrent transfers)
- [ ] Negative balance test verified (database rejects)
- [ ] Rate limiting test verified (3 requests per minute)

### Monitoring Setup
- [ ] Error tracking setup (Sentry/Bugsnag)
- [ ] Performance monitoring enabled (New Relic/DataDog)
- [ ] Alert thresholds configured
- [ ] Slack/PagerDuty integration verified
- [ ] Log aggregation running (ELK/Splunk)

### Communication
- [ ] Status page prepared
- [ ] User notification scheduled (if needed)
- [ ] Customer support briefed
- [ ] On-call team identified
- [ ] Incident commander assigned

---

## Deployment Day - Before Launch

### Environment Preparation
- [ ] Staging environment fully tested
- [ ] Feature flags prepared (if using FF system)
- [ ] Rollback strategy reviewed and tested
- [ ] Database backup restored in staging and verified
- [ ] Staging environment mirrors production exactly

### Final Checks
- [ ] Verify no uncommitted changes
  ```bash
  git status
  git log --oneline -5
  ```
- [ ] All migrations reviewed one final time
- [ ] Route middleware verified in routes/web.php
- [ ] Cache driver configured correctly in .env
- [ ] Session driver configured correctly

### Team Readiness
- [ ] All developers on standby
- [ ] Database administrator available
- [ ] Security team ready to respond
- [ ] Customer support ready for inquiries
- [ ] Marketing aware (no surprise announces)

---

## Deployment - Execution

### Step 1: Maintenance Window
- [ ] Set app to maintenance mode
  ```bash
  php artisan down --message="Scheduled updates" --retry=60
  ```
- [ ] Notify users
- [ ] Wait 5 minutes for in-flight requests to complete

### Step 2: Database Migration
- [ ] Pull latest code
  ```bash
  git pull origin main
  ```
- [ ] Install dependencies (if needed)
  ```bash
  composer install --no-dev
  ```
- [ ] Run migrations
  ```bash
  php artisan migrate --force
  ```
- [ ] Verify migration output for errors
- [ ] Confirm indexes created:
  ```sql
  SHOW INDEXES FROM users;
  SHOW INDEXES FROM transactions;
  ```
- [ ] Confirm constraint added:
  ```sql
  SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE TABLE_NAME='users' AND CONSTRAINT_TYPE='CHECK';
  ```

### Step 3: Cache Setup
- [ ] Clear all caches
  ```bash
  php artisan cache:clear
  php artisan config:clear
  php artisan route:clear
  php artisan view:clear
  ```
- [ ] Verify cache driver is working
  ```bash
  php artisan tinker
  > Cache::put('test', true); Cache::get('test');
  ```
- [ ] Warm up caches (if applicable)

### Step 4: Application Startup
- [ ] Bring application out of maintenance mode
  ```bash
  php artisan up
  ```
- [ ] Verify application loads
- [ ] Check for error logs
  ```bash
  tail -f storage/logs/laravel.log
  ```
- [ ] Verify API endpoints responding

### Step 5: Smoke Testing
- [ ] Test user login
- [ ] Navigate to wallet page
- [ ] Test beneficiary lookup
- [ ] Test PIN verification
- [ ] Perform test transfer (small amount)
- [ ] Verify transaction recorded
- [ ] Verify notifications sent
- [ ] Check database transaction records

---

## Post-Deployment - Immediate (First Hour)

### Monitoring
- [ ] Monitor error rate (should be normal)
- [ ] Monitor transaction processing time (should be ~20ms)
- [ ] Monitor cache hit rate (should be > 90%)
- [ ] Monitor database lock time (should be < 5ms)
- [ ] Monitor active connections (should be normal)

### User Reports
- [ ] Monitor support tickets (should be normal volume)
- [ ] Search for "atomic", "lock", "rate limit" in tickets
- [ ] Monitor social media for complaints
- [ ] Customer support ready to escalate

### Quick Checks
- [ ] Run production smoke tests again
- [ ] Verify logs show transactions processing:
  ```bash
  tail -100 storage/logs/transactions.log
  ```
- [ ] Check for any "duplicate request" errors (normal, but track)
- [ ] Verify duplicate check cache working:
  ```bash
  redis-cli KEYS "duplicate_check*"
  ```

### Early Warning Signs to Watch For
- ❌ Spike in error rate
- ❌ Transactions failing with new error messages
- ❌ Users reporting "too many requests" incorrectly
- ❌ Users unable to complete legitimate transfers
- ❌ Database connection pool exhausted
- ❌ Cache lock timeout errors appearing

---

## Post-Deployment - Extended (First 24 Hours)

### Continuous Monitoring
- [ ] Monitor error trends (should stabilize)
- [ ] Verify no negative wallet balances exist:
  ```sql
  SELECT COUNT(*) FROM users WHERE wallet_balance < 0;
  -- Should return 0
  ```
- [ ] Monitor constraint violations:
  ```bash
  grep -i "chk_positive_wallet_balance" storage/logs/laravel.log
  -- Should be empty
  ```
- [ ] Monitor rate limiting effectiveness:
  ```bash
  grep "rate limit" storage/logs/laravel.log | wc -l
  -- Monitor trend
  ```

### Business Metrics
- [ ] Transaction success rate (should be > 99.5%)
- [ ] Transaction processing time (should be < 50ms avg)
- [ ] User completion rate (should be same as before)
- [ ] Support ticket volume (should be normal)

### Data Integrity Checks
- [ ] No orphaned transactions (both sender and recipient recorded)
- [ ] All balances reconciled
- [ ] No duplicate transfers for same request_id
- [ ] All transfers have valid request_ids

### Team Debrief
- [ ] Deployment went smoothly
- [ ] No unexpected issues
- [ ] All team members available if needed
- [ ] Plan next steps

---

## Rollback - If Needed

### Immediate Actions (If Critical Issue)
- [ ] Put application in maintenance mode
- [ ] Notify all stakeholders
- [ ] Prepare rollback commands
- [ ] Get database backup ready

### Rollback Steps
```bash
# 1. Revert database migration
php artisan migrate:rollback

# 2. Revert code (if needed)
git revert <commit-hash>
git push origin main

# 3. Clear caches
php artisan cache:clear

# 4. Verify rollback
# - Check routes don't have new middleware
# - Check database has no new indexes
# - Check application loads normally

# 5. Bring back online
php artisan up

# 6. Post-rollback verification
# - Test critical paths
# - Monitor logs
# - Notify users
```

### Post-Rollback Actions
- [ ] Create incident report
- [ ] Schedule post-mortem
- [ ] Identify root cause
- [ ] Fix issues
- [ ] Plan second deployment attempt
- [ ] Additional testing before retry

---

## Success Criteria

### Deployment Success
✅ **All of these must be true:**
- [ ] Zero deployment errors
- [ ] All migrations successful
- [ ] Constraints enforced at database level
- [ ] Application loads and responds normally
- [ ] No spike in error rate
- [ ] No increase in support tickets (related to this feature)
- [ ] Transactions process successfully
- [ ] Notifications sent properly
- [ ] Database integrity maintained

### Functional Verification
✅ **Test each scenario:**
- [ ] User transfers money - SUCCESS
- [ ] User clicks submit twice - PREVENTED
- [ ] User refreshes page after transfer - NOT DUPLICATED
- [ ] User has insufficient balance - ERROR
- [ ] User tries 5 transfers in 60 seconds - RATE LIMITED
- [ ] Recipient receives credit in real-time - YES
- [ ] Transaction history shows transfer - YES

### Performance Verification
✅ **Metrics must meet standards:**
- [ ] Avg transaction time: < 50ms
- [ ] P95 transaction time: < 100ms
- [ ] P99 transaction time: < 200ms
- [ ] Database CPU usage: normal
- [ ] Cache hit rate: > 90%
- [ ] User response time: not degraded

### Security Verification
✅ **Security team confirms:**
- [ ] No negative wallet balances possible
- [ ] Race conditions eliminated
- [ ] Replay attacks prevented
- [ ] Database constraints enforced
- [ ] Audit trail complete
- [ ] No new vulnerabilities introduced

---

## Sign-Off

### Development
- **Developer Name:** _________________
- **Date:** _________________
- **Time:** _________________

### QA/Testing
- **QA Lead Name:** _________________
- **Date:** _________________
- **Time:** _________________

### Database
- **DBA Name:** _________________
- **Date:** _________________
- **Time:** _________________

### Operations
- **Ops Lead Name:** _________________
- **Date:** _________________
- **Time:** _________________

### Security
- **Security Lead Name:** _________________
- **Date:** _________________
- **Time:** _________________

### Product/Business
- **Product Owner:** _________________
- **Date:** _________________
- **Time:** _________________

---

## Post-Deployment Notes

### What Went Well
- 
- 
- 

### What Could Be Improved
- 
- 
- 

### Issues Encountered & Resolution
1. 
2. 
3. 

### Monitoring Changes Made
- 
- 
- 

### Follow-up Actions (if any)
- [ ] Action: _________________ | Owner: _________ | Due: _________
- [ ] Action: _________________ | Owner: _________ | Due: _________
- [ ] Action: _________________ | Owner: _________ | Due: _________

---

## Contact Information

**On-Call During Deployment:**
- Incident Commander: _________________ | _________________ (phone)
- Senior Developer: _________________ | _________________ (phone)
- Database Admin: _________________ | _________________ (phone)
- Operations: _________________ | _________________ (phone)

**Escalation:**
- Level 1: On-call developer
- Level 2: Engineering manager
- Level 3: CTO

---

## Document History

| Date | Action | By | Status |
|------|--------|----|----|
| 2026-01-15 | Created | [Your Name] | Draft |
| | Reviewed | [Reviewer] | Review |
| | Approved | [Lead] | Approved |
| | Executed | [Deployer] | Complete |

---

**KEEP THIS FORM WITH YOUR RUNBOOKS**  
**REFER TO IT IN FUTURE DEPLOYMENTS**  
**ATTACH TO INCIDENT REPORTS IF ISSUES OCCUR**
