import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import type { Handler } from 'hono/types';
import updatedFetch from '../src/__create/fetch';

const API_BASENAME = '/api';
const api = new Hono();

// Get current directory
const __dirname = join(fileURLToPath(new URL('.', import.meta.url)), '../src/app/api');
if (globalThis.fetch) {
  globalThis.fetch = updatedFetch;
}

// Recursively find all route.js files
async function findRouteFiles(dir: string): Promise<string[]> {
  console.log(`🔍 [ROUTE-BUILDER] Scanning directory: ${dir}`);
  try {
    const files = await readdir(dir);
    console.log(`📁 [ROUTE-BUILDER] Found files:`, files);
    let routes: string[] = [];

    for (const file of files) {
      try {
        const filePath = join(dir, file);
        const statResult = await stat(filePath);

        if (statResult.isDirectory()) {
          console.log(`📂 [ROUTE-BUILDER] Recursing into directory: ${file}`);
          routes = routes.concat(await findRouteFiles(filePath));
        } else if (file === 'route.js') {
          console.log(`✅ [ROUTE-BUILDER] Found route.js: ${filePath}`);
          // Handle root route.js specially
          if (filePath === join(__dirname, 'route.js')) {
            routes.unshift(filePath); // Add to beginning of array
            console.log(`⭐ [ROUTE-BUILDER] Added root route.js to beginning`);
          } else {
            routes.push(filePath);
            console.log(`📄 [ROUTE-BUILDER] Added route.js to list`);
          }
        }
      } catch (error) {
        console.error(`❌ [ROUTE-BUILDER] Error reading file ${file}:`, error);
      }
    }

    console.log(`📋 [ROUTE-BUILDER] Total routes found in ${dir}:`, routes.length);
    return routes;
  } catch (error) {
    // Directory doesn't exist (e.g., in production build)
    console.warn(`⚠️ [ROUTE-BUILDER] Directory ${dir} not found, skipping route scanning:`, error);
    return [];
  }
}

// Helper function to transform file path to Hono route path
function getHonoPath(routeFile: string): { name: string; pattern: string }[] {
  // Normalize Windows backslashes to forward slashes before splitting
  const relativePath = routeFile.replace(__dirname, '').replace(/\\/g, '/');
  const parts = relativePath.split('/').filter(Boolean);
  const routeParts = parts.slice(0, -1); // Remove 'route.js'
  if (routeParts.length === 0) {
    return [{ name: 'root', pattern: '' }];
  }
  const transformedParts = routeParts.map((segment) => {
    const match = segment.match(/^\[(\.{3})?([^\]]+)\]$/);
    if (match) {
      const [_, dots, param] = match;
      return dots === '...'
        ? { name: param, pattern: `:${param}{.+}` }
        : { name: param, pattern: `:${param}` };
    }
    return { name: segment, pattern: segment };
  });
  return transformedParts;
}

// Import and register all routes
async function registerRoutes() {
  console.log('🚀 [ROUTE-BUILDER] Starting route registration...');
  console.log('📁 [ROUTE-BUILDER] Scanning directory:', __dirname);
  
  const routeFiles = (
    await findRouteFiles(__dirname).catch((error) => {
      console.error('❌ [ROUTE-BUILDER] Error finding route files:', error);
      return [];
    })
  )
    .slice()
    .sort((a, b) => {
      return b.length - a.length;
    });

  console.log('📋 [ROUTE-BUILDER] Found route files:', routeFiles);
  console.log('📊 [ROUTE-BUILDER] Total routes to register:', routeFiles.length);

  // Clear existing routes
  api.routes = [];
  console.log('🧹 [ROUTE-BUILDER] Cleared existing routes');

  for (const routeFile of routeFiles) {
    console.log(`📄 [ROUTE-BUILDER] Processing route file: ${routeFile}`);
    try {
      const importBase = import.meta.env.DEV ? `/@fs/${routeFile.replace(/\\/g, '/')}` : routeFile;
      console.log(`📦 [ROUTE-BUILDER] Importing from: ${importBase}`);
      const route = await import(/* @vite-ignore */ `${importBase}?update=${Date.now()}`);
      console.log(`✅ [ROUTE-BUILDER] Successfully imported route:`, Object.keys(route));

      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      console.log(`🔧 [ROUTE-BUILDER] Checking methods for ${routeFile}:`, methods);
      for (const method of methods) {
        try {
          if (route[method]) {
            console.log(`✅ [ROUTE-BUILDER] Found ${method} method in ${routeFile}`);
            const parts = getHonoPath(routeFile);
            const honoPath = `${API_BASENAME}/${parts.map(({ pattern }) => pattern).join('/')}`;
            console.log(`🛣️ [ROUTE-BUILDER] Registering ${method} ${honoPath}`);
            
            const handler: Handler = async (c) => {
              const params = c.req.param();
              if (import.meta.env.DEV) {
                const importPath = `/@fs/${routeFile.replace(/\\/g, '/')}`;
                const updatedRoute = await import(
                  /* @vite-ignore */ `${importPath}?update=${Date.now()}`
                );
                return await updatedRoute[method](c.req.raw, { params });
              }
              return await route[method](c.req.raw, { params });
            };
            const methodLowercase = method.toLowerCase();
            switch (methodLowercase) {
              case 'get':
                api.get(honoPath, handler);
                console.log(`✅ [ROUTE-BUILDER] Registered GET ${honoPath}`);
                break;
              case 'post':
                api.post(honoPath, handler);
                console.log(`✅ [ROUTE-BUILDER] Registered POST ${honoPath}`);
                break;
              case 'put':
                api.put(honoPath, handler);
                console.log(`✅ [ROUTE-BUILDER] Registered PUT ${honoPath}`);
                break;
              case 'delete':
                api.delete(honoPath, handler);
                console.log(`✅ [ROUTE-BUILDER] Registered DELETE ${honoPath}`);
                break;
              case 'patch':
                api.patch(honoPath, handler);
                console.log(`✅ [ROUTE-BUILDER] Registered PATCH ${honoPath}`);
                break;
              default:
                console.warn(`⚠️ [ROUTE-BUILDER] Unsupported method: ${method}`);
                break;
            }
          } else {
            console.log(`❌ [ROUTE-BUILDER] No ${method} method found in ${routeFile}`);
          }
        } catch (error) {
          console.error(`❌ [ROUTE-BUILDER] Error registering route ${routeFile} for method ${method}:`, error);
        }
      }
    } catch (error) {
      console.error(`❌ [ROUTE-BUILDER] Error importing route file ${routeFile}:`, error);
    }
  }
  
  console.log('🎉 [ROUTE-BUILDER] Route registration completed!');
  console.log('📊 [ROUTE-BUILDER] Total registered routes:', api.routes.length);
}

// Initial route registration wrapped in async IIFE to avoid top-level await
(async () => {
  await registerRoutes();
})().catch((err) => {
  console.error('[route-builder] Failed to register routes:', err);
});

// Hot reload routes in development
if (import.meta.env.DEV) {
  import.meta.glob('../src/app/api/**/route.js', {
    eager: true,
  });
  if (import.meta.hot) {
    import.meta.hot.accept((newSelf) => {
      registerRoutes().catch((err) => {
        console.error('Error reloading routes:', err);
      });
    });
  }
}

export { api, API_BASENAME };
