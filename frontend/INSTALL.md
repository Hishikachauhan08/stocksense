# Install fix

If you hit peer dependency errors, clean first then reinstall:

```bash
cd frontend
# Windows PowerShell
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue

# or CMD
# rmdir /s /q node_modules
# del package-lock.json

npm install
npm run dev
```

If it still fails:

```bash
npm install --legacy-peer-deps
npm run dev
```

Open http://localhost:3000

Demo: m.vance@stocksense.io / manager123
