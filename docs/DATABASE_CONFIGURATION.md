# Database Configuration Guide

**Last Updated:** October 2, 2025

---

## 🎯 Current Configuration

### **Application (Next.js)**
- ✅ **Uses REMOTE database** via `.env.local`
- URL: `https://rzpywoxtrclvodpiqiqq.supabase.co`
- All API routes connect to remote
- All client-side queries connect to remote

### **Local Supabase (Development)**
- ⚠️ **Running but NOT used by app**
- URL: `http://127.0.0.1:54321`
- Only used for migration testing
- Can be stopped to avoid confusion

---

## ✅ How to Stay in Sync

### **Rule #1: Always Work with Remote**
Your `.env.local` file ensures the app uses remote:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://rzpywoxtrclvodpiqiqq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-key>
```

**Never change these to localhost URLs!**

### **Rule #2: Test Migrations Locally First**
1. Apply migration to local: `supabase db reset`
2. Test locally: `npm run dev` (but change .env.local temporarily)
3. Apply to remote: `supabase db push`
4. Restore .env.local to remote URLs

### **Rule #3: Repair Migration History**
If you manually apply SQL in Supabase Dashboard:
```bash
supabase migration repair --status applied <migration-name>
```

---

## 🔧 Common Commands

### **Check Which Database You're Using**
```bash
# Check environment variables
grep NEXT_PUBLIC_SUPABASE_URL .env.local

# Should show: https://rzpywoxtrclvodpiqiqq.supabase.co
```

### **Check Migration Status**
```bash
supabase migration list

# All migrations should show in both Local and Remote columns
```

### **Stop Local Database (Recommended)**
```bash
supabase stop

# This prevents accidentally using local DB
```

### **Start Local Database (Only for Testing)**
```bash
supabase start

# Remember to stop it after testing!
```

---

## 📊 Current Sync Status

**Last Verified:** October 2, 2025 at 6:13 PM

| Component | Status | Notes |
|-----------|--------|-------|
| Schema | ✅ In Sync | All tables and columns match |
| Migrations | ✅ In Sync | All 32 migrations applied to both |
| Data | ⚠️ Different | Local has test data, remote has production |
| Storage | ✅ In Sync | Avatars bucket exists in both |

---

## 🚨 Warning Signs You're Out of Sync

### **Sign #1: Migration List Shows Differences**
```bash
supabase migration list
# If Local and Remote columns don't match → out of sync
```

### **Sign #2: Schema Comparison Fails**
```bash
node scripts/compare-schemas.js
# If any items show "Missing in REMOTE" → out of sync
```

### **Sign #3: App Works Locally But Not in Production**
- Likely means local DB has migrations that remote doesn't
- Run `supabase db push` to sync

---

## 🛠️ How to Fix Sync Issues

### **Option 1: Push Local to Remote (Recommended)**
```bash
# 1. Check what's missing
supabase migration list

# 2. Push missing migrations
supabase db push --include-all

# 3. Verify sync
supabase migration list
```

### **Option 2: Pull Remote to Local**
```bash
# 1. Reset local to match remote
supabase db reset

# 2. Verify sync
supabase migration list
```

### **Option 3: Repair Migration History**
```bash
# If schema is in sync but migration history isn't
supabase migration repair --status applied <migration-name>
```

---

## 📝 Best Practices

### **DO:**
- ✅ Always check `.env.local` points to remote
- ✅ Test migrations locally first
- ✅ Push migrations to remote immediately after testing
- ✅ Run `supabase migration list` regularly
- ✅ Stop local Supabase when not testing migrations

### **DON'T:**
- ❌ Apply SQL directly in Supabase Dashboard without creating a migration
- ❌ Change `.env.local` to localhost and forget to change it back
- ❌ Run migrations on local without pushing to remote
- ❌ Assume local and remote are in sync without checking

---

## 🔍 Quick Health Check

Run this to verify everything is in sync:

```bash
# 1. Check environment
echo "App uses: $(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d= -f2)"

# 2. Check migrations
echo "\nMigration Status:"
supabase migration list

# 3. Check schema
echo "\nSchema Comparison:"
node scripts/compare-schemas.js
```

---

## 📞 Troubleshooting

### **"Not authenticated" errors**
- Check API routes use `createServerClient` from `@supabase/ssr`
- Verify cookies are being passed correctly

### **"Bucket not found" errors**
- Run `node scripts/setup-avatars-bucket.js`
- Check Storage section in Supabase Dashboard

### **"Migration already applied" errors**
- Use `supabase migration repair` to fix history
- Don't try to re-apply migrations manually

---

## 🎯 Summary

**Your app is configured to use REMOTE database by default.**

This is the correct setup for development and production. The local Supabase instance is only for testing migrations before pushing them to remote.

**To stay in sync:** Always push migrations to remote immediately after testing locally.
