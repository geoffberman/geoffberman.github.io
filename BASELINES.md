# Coffee Brew Recommender - Baseline Versions

This document tracks stable "baseline" versions of the application that serve as known-good reference points.

## Baseline-v2 (Current)

**Date**: January 21, 2026
**Commit**: `4004402` - Merge pull request #20 from geoffberman/claude/coffee-brew-recommender-yYPyv
**Live URL**: https://geoffberman-github-io.vercel.app/
**Status**: ✅ Stable

### Features

- **Custom brew methods persist correctly**: Fixed bug where custom equipment like "Oxo Rapid Brew" would disappear after page reload
- **Ultra-compact pour over bullets**: Pour over timing displays with zero spacing between bullets
- **Pour over timing schedules**: AI generates detailed pouring schedules (bloom, pours, timing) for all pour over methods
- **Saved recipe integration**: User's saved recipes appear first with green "💾 YOUR SAVED RECIPE" tag
- **Equipment validation**: Properly checks for all equipment types including customBrewMethods
- **Better debugging**: Console logs for saved recipe matching (coffee hash, brew method)

### Known Issues

- **Intermittent JSON parsing errors**: About 50% of the time, gets "Unable to parse details" error
  - Root cause: `max_tokens` limit of 2048 is too low
  - AI response gets cut off mid-JSON when generating detailed instructions
  - Fix pending in PR #21

### Key Files

- `app.js`: Main application logic
- `api/analyze.js`: AI analysis endpoint with Claude Haiku
- `index.html`: UI structure
- `supabase-setup.sql`: Database schema

### To Revert to This Version

```bash
git checkout 4004402
# or
git checkout baseline-v2  # if branch exists
```

---

## Baseline-v1

**Date**: January 20, 2026
**Commit**: `33f7211` - Revert to baseline-v1 - restore stable working version
**Status**: Superseded by v2

### Features

- Initial stable version
- Pour over recipes with basic formatting
- Saved recipe functionality
- Equipment management
- AI-powered coffee analysis

### Reason for Reversion

Was reverted from an unstable state to establish baseline-v1 as a known good version.

---

## Version Comparison

| Feature | v1 | v2 |
|---------|----|----|
| Custom brew methods persist | ❌ Bug | ✅ Fixed |
| Pour over bullet spacing | Normal | ✅ Ultra-compact |
| Saved recipe tag | ✅ | ✅ Improved |
| Equipment validation | Partial | ✅ Complete |
| JSON parsing | Stable | ⚠️ Intermittent issues |
| Debugging logs | Basic | ✅ Enhanced |

---

## Next Steps

- Fix intermittent JSON parsing by increasing `max_tokens` from 2048 to 4096
- Monitor Vercel deployments for stability
- Consider implementing better error recovery for API failures
