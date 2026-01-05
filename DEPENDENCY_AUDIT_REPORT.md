# Dependency Audit Report

**Generated:** 2026-01-05
**Project:** killchain (Frontend + Backend)

## Executive Summary

This audit identified **4 moderate security vulnerabilities** in the frontend, **12 outdated packages**, and several opportunities to reduce bundle size and improve maintainability.

### Key Findings
- 🔴 **4 moderate security vulnerabilities** in frontend dependencies
- 🟡 **12 packages** with available updates
- 🟡 **2-3 unused dependencies** consuming ~5MB
- 🟢 **Backend has no security vulnerabilities**

---

## Frontend Analysis

### 🔴 Critical Security Vulnerabilities (4 Moderate)

#### 1. esbuild (CVE-2024-XXXX)
- **Severity:** Moderate (CVSS 5.3)
- **Issue:** esbuild enables any website to send requests to dev server and read responses
- **Affected:** esbuild <=0.24.2
- **Fix:** Upgrade to vite@7.3.0 (requires major version bump)
- **CVE:** [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)

#### 2. vite (via esbuild)
- **Severity:** Moderate
- **Issue:** Inherited from esbuild vulnerability
- **Affected:** vite 0.11.0 - 6.1.6
- **Fix:** Upgrade to vite@7.3.0

#### 3. @vitejs/plugin-vue (via vite)
- **Severity:** Moderate
- **Issue:** Inherited from vite vulnerability
- **Affected:** @vitejs/plugin-vue 1.8.0 - 5.2.0
- **Fix:** Upgrade to @vitejs/plugin-vue@6.0.3

#### 4. js-yaml (CVE-2024-XXXX)
- **Severity:** Moderate (CVSS 5.3)
- **Issue:** Prototype pollution in merge (<<)
- **Affected:** js-yaml 4.0.0 - 4.1.0
- **Fix:** Auto-fixable (npm audit fix)
- **CVE:** [GHSA-mh29-5h37-fv8m](https://github.com/advisories/GHSA-mh29-5h37-fv8m)

### 🟡 Outdated Packages

| Package | Current | Wanted | Latest | Priority |
|---------|---------|--------|--------|----------|
| **vite** | 5.4.21 | 5.4.21 | **7.3.0** | 🔴 High (Security) |
| **@vitejs/plugin-vue** | 4.6.2 | 4.6.2 | **6.0.3** | 🔴 High (Security) |
| **eslint** | 8.57.1 | 8.57.1 | **9.39.2** | 🟡 Medium |
| **eslint-plugin-vue** | 9.33.0 | 9.33.0 | **10.6.2** | 🟡 Medium |
| **pinia** | 2.3.1 | 2.3.1 | **3.0.4** | 🟡 Medium |
| **echarts** | 5.6.0 | 5.6.0 | **6.0.0** | 🟡 Medium |
| **vue** | 3.5.24 | 3.5.26 | 3.5.26 | 🟢 Low (Patch) |
| **vue-router** | 4.6.3 | 4.6.4 | 4.6.4 | 🟢 Low (Patch) |
| **element-plus** | 2.11.7 | 2.13.0 | 2.13.0 | 🟢 Low (Minor) |
| **sass** | 1.93.3 | 1.97.1 | 1.97.1 | 🟢 Low (Minor) |
| **prettier** | 3.6.2 | 3.7.4 | 3.7.4 | 🟢 Low (Patch) |
| **lodash-es** | 4.17.21 | 4.17.22 | 4.17.22 | 🟢 Low (Patch) |

### 📦 Dependency Bloat Analysis

**Total Size:** 210 MB

| Package | Size | Usage | Recommendation |
|---------|------|-------|----------------|
| **echarts** | 52 MB | ✅ Used | Keep (core feature) |
| **element-plus** | 49 MB | ✅ Used | Keep (UI framework) |
| **sass** | 5.5 MB | ✅ Used | Keep (build tool) |
| **prettier** | 8.1 MB | ✅ Used | Keep (dev tool) |
| **cytoscape** | 5.6 MB | ✅ Used | Keep (graph visualization) |
| **lodash-es** | ~1.7 MB | ❌ Not used | **REMOVE** |
| **crypto-js** (frontend) | ~500 KB | ❌ Not used | **REMOVE** |
| **vuex** | ~200 KB | ❌ Not used | **REMOVE** (using pinia) |

**Potential Savings:** ~2.4 MB minified (~400 KB gzipped)

### ⚠️ Unused Dependencies

The following packages are declared but not imported in the codebase:

1. **lodash-es** (4.17.21)
   - Not found in any import statements
   - Recommendation: Remove unless used in build scripts

2. **crypto-js** (frontend - 4.2.0)
   - Not found in frontend code
   - Backend uses crypto-js, but frontend doesn't need it
   - Recommendation: Remove from frontend package.json

3. **vuex** (imported but unused)
   - Code imports `useStore` from 'vuex' but pinia is the state manager
   - Recommendation: Remove vuex import and dependency if not actually used

---

## Backend Analysis

### ✅ Security Status
**No vulnerabilities found** - Backend dependencies are secure.

### 🟡 Outdated Packages

| Package | Current | Latest | Breaking? |
|---------|---------|--------|-----------|
| **express** | 4.18.2 | **5.2.1** | ⚠️ Yes (major) |
| **dotenv** | 16.3.1 | **17.2.3** | ⚠️ Yes (major) |
| **body-parser** | 1.20.2 | **2.2.1** | ⚠️ Yes (major) |
| **sequelize** | 6.35.0 | 6.37.7 | ✅ No (minor) |
| **sqlite3** | 5.1.6 | 5.1.7 | ✅ No (patch) |
| **jsonwebtoken** | 9.0.2 | 9.0.3 | ✅ No (patch) |
| **nodemon** (dev) | 3.0.2 | Latest | ✅ Check updates |

### ⚠️ Notes

1. **body-parser** is now built into Express 4.16+
   - You're using Express 4.18.2, so body-parser is redundant
   - Recommendation: Remove body-parser, use `express.json()` and `express.urlencoded()`

2. **Express 5.x** is a major update
   - May have breaking changes
   - Test thoroughly before upgrading

---

## Recommendations

### 🔴 Immediate Actions (Security)

1. **Fix js-yaml vulnerability**
   ```bash
   npm audit fix
   ```

2. **Upgrade Vite and plugins** (requires testing)
   ```bash
   npm install vite@latest @vitejs/plugin-vue@latest --save-dev
   ```
   ⚠️ **Breaking changes expected** - Test thoroughly after upgrade

### 🟡 High Priority (Maintenance)

3. **Remove unused frontend dependencies**
   ```bash
   npm uninstall lodash-es crypto-js
   ```
   Check if vuex is actually needed, then:
   ```bash
   npm uninstall vuex
   ```

4. **Update ESLint to v9**
   ```bash
   npm install eslint@latest eslint-plugin-vue@latest --save-dev
   ```
   Update `.eslintrc` to use flat config format

5. **Remove body-parser from backend**

   In `backend/package.json`:
   ```bash
   cd backend && npm uninstall body-parser
   ```

   In `backend/server.js`, replace:
   ```javascript
   const bodyParser = require('body-parser');
   app.use(bodyParser.json());
   app.use(bodyParser.urlencoded({ extended: true }));
   ```

   With:
   ```javascript
   app.use(express.json());
   app.use(express.urlencoded({ extended: true }));
   ```

### 🟢 Low Priority (Enhancement)

6. **Update minor/patch versions**
   ```bash
   # Frontend
   npm update vue vue-router element-plus sass prettier

   # Backend
   cd backend && npm update sequelize sqlite3 jsonwebtoken nodemon
   ```

7. **Consider major version upgrades** (after testing)
   - Pinia 2.x → 3.x
   - Echarts 5.x → 6.x
   - Express 4.x → 5.x (backend)

### 📊 Bundle Size Optimization

8. **Enable tree-shaking for Element Plus**

   Consider using auto-import instead of full import:
   ```bash
   npm install unplugin-vue-components unplugin-auto-import --save-dev
   ```

9. **Use Echarts extensions on-demand**

   Instead of importing all of echarts, import only what you need:
   ```javascript
   import * as echarts from 'echarts/core';
   import { LineChart, BarChart } from 'echarts/charts';
   // etc.
   ```

---

## Testing Checklist

After making changes, verify:

- [ ] Frontend builds successfully (`npm run build`)
- [ ] No console errors in development mode
- [ ] All features work correctly
- [ ] Backend API responses are correct
- [ ] Database operations function properly
- [ ] Authentication/JWT tokens work
- [ ] Run linting (`npm run lint`)
- [ ] Test on production build

---

## Implementation Priority

### Phase 1: Security Fixes (Do First)
1. Run `npm audit fix` for auto-fixable issues
2. Upgrade vite and @vitejs/plugin-vue
3. Test thoroughly

### Phase 2: Cleanup (Quick Wins)
1. Remove unused dependencies (lodash-es, crypto-js, possibly vuex)
2. Remove body-parser from backend
3. Update patch versions

### Phase 3: Major Updates (Requires Testing)
1. Update ESLint to v9
2. Update Pinia to v3
3. Consider Express v5 (backend)
4. Consider Echarts v6

### Phase 4: Optimization (Performance)
1. Implement Element Plus auto-import
2. Optimize Echarts imports
3. Review bundle analyzer output

---

## Estimated Impact

| Action | Time | Risk | Benefit |
|--------|------|------|---------|
| Security fixes | 1-2 hrs | Low | High (fixes vulnerabilities) |
| Remove unused deps | 30 min | Very Low | Medium (reduces bloat) |
| Update patches | 1 hr | Very Low | Low (maintenance) |
| Major version upgrades | 4-8 hrs | Medium-High | Medium (new features, better support) |
| Bundle optimization | 2-4 hrs | Low-Medium | Medium (faster load times) |

---

## Dependencies Summary

### Frontend Stats
- **Total dependencies:** 262 packages
- **Production:** 77 packages
- **Development:** 186 packages
- **Size:** ~210 MB
- **Vulnerabilities:** 4 moderate

### Backend Stats
- **Total dependencies:** 253 packages
- **Production:** 155 packages
- **Development:** 25 packages
- **Vulnerabilities:** 0

---

## Additional Notes

1. **npm version:** Current npm is v10.9.4, latest is v11.7.0
   - Consider upgrading npm: `npm install -g npm@latest`

2. **Backend dependencies not installed locally**
   - Dependencies exist in package-lock.json but node_modules missing
   - This is fine if backend runs in a separate environment
   - Run `npm install` in backend directory if needed

3. **Consider dependency audit automation**
   - Set up GitHub Dependabot or Renovate Bot
   - Automate dependency updates with CI/CD testing

---

## References

- [npm audit documentation](https://docs.npmjs.com/cli/v10/commands/npm-audit)
- [Vite migration guide](https://vitejs.dev/guide/migration.html)
- [ESLint v9 migration guide](https://eslint.org/docs/latest/use/migrate-to-9.0.0)
- [Express 5 migration guide](https://expressjs.com/en/guide/migrating-5.html)

---

**Report End** - For questions or clarifications, review the specific package documentation or security advisories linked above.
