# 🔧 **COMPLETE MCP SETUP GUIDE FOR NEW CLAUDE CODE**

**Step-by-step instructions to set up all MCP servers in a fresh Claude Code installation.**

---

## **📋 Overview**

This guide sets up **9 MCP Servers**:
- **3 Built-in**: Firebase, Context7, ByteRover (no setup needed)
- **6 Custom**: React MCP, React Analyzer, Next.js MCP, Playwright MCP, Filesystem MCP, Memory MCP

---

## **🚀 STEP 1: Create MCP Server Directory**

```bash
mkdir -p /Users/$(whoami)/mcp-servers
cd /Users/$(whoami)/mcp-servers
```

---

## **🚀 STEP 2: Install React MCP (Local)**

```bash
# Clone and set up React MCP
git clone https://github.com/Streen9/react-mcp.git
cd react-mcp
npm install
cd ..
```

**Test the installation:**
```bash
node react-mcp/index.js --help
```

---

## **🚀 STEP 3: Install React Analyzer MCP**

```bash
# Clone and set up React Analyzer MCP
git clone https://github.com/azer/react-analyzer-mcp.git
cd react-analyzer-mcp
npm install
npm run build
cd ..
```

**Configure PROJECT_ROOT** (adapt paths as needed):
```bash
# Edit the PROJECT_ROOT in the source file
nano react-analyzer-mcp/src/index.ts
# Change: const PROJECT_ROOT = "/path/to/your/projects";
# Then rebuild:
cd react-analyzer-mcp && npm run build && cd ..
```

---

## **🚀 STEP 4: Install Next.js MCP Server**

```bash
# Install globally
npm install -g next-mcp-server@0.2.2
```

**Find installation path** (needed for config):
```bash
which next-mcp-server
# or
npm list -g next-mcp-server --depth=0
```

---

## **🚀 STEP 5: Install Playwright MCP**

```bash
# Install Playwright MCP
npm install -g @playwright/mcp@latest
```

**Test installation:**
```bash
npx @playwright/mcp@latest --help
```

---

## **🚀 STEP 6: Install Official MCP Servers**

```bash
# Clone official MCP servers repository
git clone https://github.com/modelcontextprotocol/servers.git mcp-official-servers
cd mcp-official-servers

# Install and build Filesystem MCP
cd src/filesystem
npm install
npm run build
cd ../..

# Install and build Memory MCP
cd src/memory
npm install  
npm run build
cd ../..

cd ..
```

---

## **🚀 STEP 7: Create MCP Test Script**

**Create test script** `/Users/$(whoami)/test-mcp-servers.js`:

```javascript
#!/usr/bin/env node

/**
 * MCP Server Test Script
 * Tests all configured MCP servers for basic connectivity
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_PATH = join(homedir(), 'Library/Application Support/Claude/claude_desktop_config.json');

async function testMCPServer(name, config) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Testing ${name}...`);
    
    const child = spawn(config.command, config.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...(config.env || {}) }
    });

    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Send a simple MCP initialization message
    const initMessage = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-10-07",
        capabilities: {},
        clientInfo: {
          name: "test-client",
          version: "1.0.0"
        }
      }
    }) + '\n';

    child.stdin.write(initMessage);

    setTimeout(() => {
      child.kill();
      if (stdout.includes('jsonrpc') || stdout.includes('capabilities')) {
        console.log(`✅ ${name}: Working correctly`);
        resolve({ name, status: 'working', output: stdout.substring(0, 200) });
      } else if (stderr.includes('MODULE_NOT_FOUND') || stderr.includes('ENOENT')) {
        console.log(`❌ ${name}: Module or file not found`);
        resolve({ name, status: 'missing', error: stderr.substring(0, 200) });
      } else {
        console.log(`⚠️  ${name}: May be working (MCP protocol response unclear)`);
        resolve({ name, status: 'unclear', output: stdout.substring(0, 200), error: stderr.substring(0, 200) });
      }
    }, 3000);
  });
}

async function main() {
  console.log('🔧 MCP Server Connectivity Test\n');
  
  let config;
  try {
    config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  } catch (error) {
    console.error('❌ Could not read Claude config:', error.message);
    process.exit(1);
  }

  const mcpServers = config.mcpServers || {};
  console.log(`Found ${Object.keys(mcpServers).length} MCP servers configured.\n`);

  const results = [];
  for (const [name, serverConfig] of Object.entries(mcpServers)) {
    const result = await testMCPServer(name, serverConfig);
    results.push(result);
  }

  // Summary
  console.log('\n📊 Summary:');
  const working = results.filter(r => r.status === 'working').length;
  const missing = results.filter(r => r.status === 'missing').length;
  const unclear = results.filter(r => r.status === 'unclear').length;

  console.log(`✅ Working: ${working}`);
  console.log(`❌ Missing: ${missing}`);
  console.log(`⚠️  Unclear: ${unclear}`);
  
  if (missing > 0) {
    console.log('\n🔧 Servers with issues:');
    results.filter(r => r.status === 'missing').forEach(r => {
      console.log(`- ${r.name}: ${r.error.split('\n')[0]}`);
    });
  }

  console.log('\n💡 Next steps:');
  console.log('1. Restart Claude Desktop to load updated configuration');
  console.log('2. Check MCP panel for "✔ connected" status');
  console.log('3. Test with simple MCP commands');
}

main().catch(console.error);
```

**Make it executable:**
```bash
chmod +x /Users/$(whoami)/test-mcp-servers.js
```

---

## **🚀 STEP 8: Configure Claude Desktop**

**Create/Edit** `~/Library/Application Support/Claude/claude_desktop_config.json`:

**⚠️ IMPORTANT**: Update all paths to match your username and Node.js version.

```json
{
  "mcpServers": {
    "react-mcp": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/mcp-servers/react-mcp/index.js"]
    },
    "react-analyzer-mcp": {
      "command": "node", 
      "args": ["/Users/YOUR_USERNAME/mcp-servers/react-analyzer-mcp/build/index.js"]
    },
    "playwright-mcp": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--browser", "chrome",
        "--ignore-https-errors",
        "--no-sandbox",
        "--caps", "vision"
      ]
    },
    "nextjs-mcp": {
      "command": "node",
      "args": [
        "/Users/YOUR_USERNAME/.nvm/versions/node/vYOUR_NODE_VERSION/lib/node_modules/next-mcp-server/dist/index.js",
        "--transport=stdio"
      ],
      "env": {
        "PROJECT_PATH": "/path/to/your/project"
      }
    },
    "filesystem-mcp": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/mcp-servers/mcp-official-servers/src/filesystem/dist/index.js"],
      "env": {
        "ALLOWED_DIRECTORIES": "/path/to/your/project,/Users/YOUR_USERNAME/mcp-servers,/tmp"
      }
    },
    "memory-mcp": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/mcp-servers/mcp-official-servers/src/memory/dist/index.js"]
    }
  }
}
```

---

## **🚀 STEP 9: Find Your Actual Paths**

**Replace placeholders in the config:**

### **Find your username:**
```bash
echo $USER
```

### **Find Node.js version and path:**
```bash
node --version
which node
# If using nvm:
nvm current
```

### **Find Next.js MCP path:**
```bash
npm list -g next-mcp-server --depth=0
# Should show path like: /Users/username/.nvm/versions/node/v20.x.x/lib/node_modules/next-mcp-server
```

### **Update config with actual paths:**
```bash
# Replace YOUR_USERNAME with your actual username
# Replace YOUR_NODE_VERSION with your Node version (e.g., v20.19.4)
# Replace /path/to/your/project with your actual project path
```

---

## **🚀 STEP 10: Test Installation**

```bash
# Test all MCP servers
node /Users/$(whoami)/test-mcp-servers.js
```

**Expected output:**
```
🔧 MCP Server Connectivity Test

Found 6 MCP servers configured.

🧪 Testing react-mcp...
✅ react-mcp: Working correctly

🧪 Testing react-analyzer-mcp...
✅ react-analyzer-mcp: Working correctly

...

📊 Summary:
✅ Working: 6
❌ Missing: 0
⚠️  Unclear: 0
```

---

## **🚀 STEP 11: Restart Claude Desktop**

1. **Quit Claude Desktop completely**
2. **Reopen Claude Desktop**
3. **Check MCP Panel** - Should show "✔ connected" for all servers

---

## **🚀 STEP 12: Verify in Claude Code**

**Test each MCP server:**

### **Built-in MCPs (always available):**
```javascript
// Firebase MCP
mcp__firebase__firebase_get_environment()

// Context7 MCP  
mcp__context7__resolve-library-id({ libraryName: "react" })

// ByteRover MCP
mcp__byterover-mcp__byterover-retrive-knowledge({ query: "test" })
```

### **Custom MCPs:**
```javascript
// React Analyzer MCP
mcp__react-analyzer-mcp__list-projects()

// Next.js MCP (if tools appear)
// Filesystem MCP (tools have different names)
// Memory MCP (tools have different names)  
// Playwright MCP (browser_ prefixed tools)
```

---

## **🛠️ TROUBLESHOOTING**

### **Common Issues:**

**1. "No such tool available"**
- Check MCP panel shows "✔ connected"
- Restart Claude Desktop completely
- Verify file paths in config

**2. "MODULE_NOT_FOUND"**
- Run `npm install` in the MCP directory
- Check Node.js path in config file

**3. "Permission denied"**
- Make scripts executable: `chmod +x path/to/script`
- Check directory permissions

**4. Next.js MCP not working**
- Ensure `--transport=stdio` flag is included
- Check if PROJECT_PATH exists

**5. React Analyzer MCP no projects**
- Update PROJECT_ROOT in source file
- Rebuild: `npm run build`

### **Debug Commands:**
```bash
# Test individual MCP server
node /Users/$(whoami)/mcp-servers/react-mcp/index.js

# Check file permissions
ls -la /Users/$(whoami)/mcp-servers/

# Check Node.js paths
which node
npm list -g --depth=0
```

---

## **📊 FINAL VERIFICATION**

**✅ All 9 MCP Servers Working:**
1. **Firebase MCP** ✅ (built-in)
2. **Context7 MCP** ✅ (built-in)  
3. **ByteRover MCP** ✅ (built-in)
4. **React MCP** ✅ (custom)
5. **React Analyzer MCP** ✅ (custom)
6. **Next.js MCP** ✅ (custom)
7. **Playwright MCP** ✅ (custom)
8. **Filesystem MCP** ✅ (custom)
9. **Memory MCP** ✅ (custom)

**🎉 You now have a complete MCP ecosystem for advanced development workflows!**

---

## **💡 USAGE TIPS**

- **Firebase operations**: Use Firebase MCP
- **Documentation lookup**: Use Context7 MCP
- **Component analysis**: Use React Analyzer MCP
- **Testing**: Use Playwright MCP
- **File operations**: Use Filesystem MCP
- **Knowledge storage**: Use ByteRover MCP
- **Session persistence**: Use Memory MCP
- **React development**: Use React MCP

**Performance**: Multiple MCPs can run simultaneously for parallel operations.