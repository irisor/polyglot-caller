# 🛡️ PolyGlot Caller: Stability & Safety

This project is configured with a **High-Stability Policy** to ensure your development environment is predictable, safe, and free from "day-zero" bugs in third-party libraries.

## 🚀 How to use the Stability Delay Feature

The stability delay is managed via the `check-stability.js` script. Follow this workflow:

### 1. Run the Stability Audit
```bash
npm run check-stability
```

### 2. Interpret the Report
- **✅ [STABLE UPDATE]**: Safe to install. The community has tested this version for over 2 weeks.
- **⏳ [HOLDING]**: A newer version exists, but it's too risky/new. 

## 🛡️ Audit Guide: Reading `npm audit` Results

When you run `npm run security-audit`, interpreting the output correctly is key:

### How to identify the target package
Look at the **Path** or **node_modules** section of the warning.
> Example: `node_modules/vite`
> Meaning: `vite` is the package you installed that contains the vulnerability.

### Understanding "Depends on vulnerable versions"
Sometimes a package you use (like `vite`) is fine, but one of *its* dependencies (like `esbuild`) has a bug. 
> Fix: You must update the parent package (`vite`) to a version that includes the fixed child package (`esbuild`).

### Applying Fixes within Stability Policy
If `npm audit` suggests `vite@6.4.1`:
1. Check if `6.4.1` is stable: `npm view vite time --json`
2. If it's less than 14 days old, try to find the newest version that *is* stable (e.g., `6.1.5`) and see if it also includes the fix.

## 💻 Development Scripts

- `npm run dev`: Start the voice bot simulation.
- `npm run check-stability`: Run the custom stability audit.
- `npm run security-audit`: Run a standard security check.

---
*Note: Dotfiles like `.npmrc` are hidden by default. Use `ls -a` in the terminal to see them.*