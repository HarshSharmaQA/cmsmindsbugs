# Code Optimization Checklist

Quick reference for maintaining optimized code in BugScribe.

## ✅ React Performance

### When Creating Components

- [ ] Wrap with `React.memo()` if props don't change often
- [ ] Move constants outside component (prevent recreation)
- [ ] Use `useCallback` for event handlers passed as props
- [ ] Use `useMemo` for expensive calculations
- [ ] Avoid inline object/array creation in JSX

**Example:**
```typescript
// ❌ Bad
function MyComponent({ data }) {
    const config = { theme: 'dark', size: 'large' }; // Recreated every render
    return <Child config={config} onClick={() => doSomething()} />;
}

// ✅ Good
const DEFAULT_CONFIG = { theme: 'dark', size: 'large' }; // Outside component

const MyComponent = memo(function MyComponent({ data }) {
    const handleClick = useCallback(() => doSomething(), []);
    return <Child config={DEFAULT_CONFIG} onClick={handleClick} />;
});
```

---

## ✅ Convex Queries

### Query Optimization Rules

- [ ] Use `getAll()` instead of multiple `get()` calls
- [ ] Add pagination for large datasets
- [ ] Use conditional queries with `"skip"`
- [ ] Batch related queries together
- [ ] Add proper indexes in schema

**Example:**
```typescript
// ❌ Bad - Multiple queries
const setting1 = useQuery(api.settings.get, { key: "key1" });
const setting2 = useQuery(api.settings.get, { key: "key2" });
const setting3 = useQuery(api.settings.get, { key: "key3" });

// ✅ Good - Single query
const allSettings = useQuery(api.settings.getAll, {});
const setting1 = allSettings?.["key1"];
const setting2 = allSettings?.["key2"];
const setting3 = allSettings?.["key3"];
```

**Pagination:**
```typescript
// ❌ Bad - Loads everything
const bugs = await ctx.db.query("bugs").collect();

// ✅ Good - Paginated
const bugs = await ctx.db
    .query("bugs")
    .order("desc")
    .paginate(paginationOpts);
```

---

## ✅ Next.js Optimization

### Image Optimization

- [ ] Use `<Image>` instead of `<img>`
- [ ] Specify width and height
- [ ] Use appropriate `priority` flag
- [ ] Optimize image formats (WebP, AVIF)

**Example:**
```typescript
// ❌ Bad
<img src="/logo.png" alt="Logo" />

// ✅ Good
import Image from 'next/image';
<Image src="/logo.png" alt="Logo" width={200} height={50} priority />
```

### Dynamic Imports

- [ ] Lazy load heavy components
- [ ] Use loading states
- [ ] Split large pages into chunks

**Example:**
```typescript
// ❌ Bad - Loads immediately
import HeavyComponent from './HeavyComponent';

// ✅ Good - Loads on demand
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
    loading: () => <Skeleton />,
    ssr: false // If not needed on server
});
```

---

## ✅ TypeScript

### Type Safety Rules

- [ ] Avoid `any` type - use `unknown` or proper types
- [ ] Use `Id<"tableName">` for Convex IDs
- [ ] Define interfaces for complex objects
- [ ] Enable strict mode gradually

**Example:**
```typescript
// ❌ Bad
function processData(data: any) {
    return data.map((item: any) => item.value);
}

// ✅ Good
interface DataItem {
    id: string;
    value: number;
}

function processData(data: DataItem[]) {
    return data.map(item => item.value);
}
```

---

## ✅ Code Organization

### File Structure

- [ ] Keep files under 500 lines
- [ ] Extract reusable components
- [ ] Group related functionality
- [ ] Use barrel exports (index.ts)

**Example:**
```
components/
├── dashboard/
│   ├── index.ts          # Barrel export
│   ├── KanbanColumn.tsx  # < 300 lines
│   ├── BugCard.tsx       # < 200 lines
│   └── ListView.tsx      # < 400 lines
```

### Component Extraction

When a component exceeds 300 lines:
1. Identify reusable parts
2. Extract to separate files
3. Add proper props/types
4. Wrap with `memo()` if needed

---

## ✅ Performance Monitoring

### Regular Checks

- [ ] Run Lighthouse audit monthly
- [ ] Check bundle size after major changes
- [ ] Profile with React DevTools
- [ ] Monitor Convex query performance

**Commands:**
```bash
# Lighthouse
npm run build && npm start
# Then open Chrome DevTools > Lighthouse

# Bundle analysis
ANALYZE=true npm run build

# Lint check
npm run lint
```

---

## ✅ Before Committing

### Pre-Commit Checklist

- [ ] Run `npm run lint` - no errors
- [ ] Remove console.logs
- [ ] Remove unused imports
- [ ] Test on different screen sizes
- [ ] Check for TypeScript errors
- [ ] Verify no performance regressions

---

## 🚨 Red Flags

Watch out for these anti-patterns:

### React
- ❌ Creating objects/arrays in render
- ❌ Not memoizing expensive calculations
- ❌ Passing inline functions as props
- ❌ Too many useState calls (>5)

### Convex
- ❌ Using `.collect()` without limits
- ❌ Multiple queries for related data
- ❌ Missing indexes on filtered fields
- ❌ Not using pagination

### Next.js
- ❌ Using `<img>` instead of `<Image>`
- ❌ Not using dynamic imports for heavy components
- ❌ Loading all data on initial render
- ❌ Not optimizing fonts

### TypeScript
- ❌ Using `any` type
- ❌ Disabling eslint rules
- ❌ Type assertions with `as any`
- ❌ Missing return types on functions

---

## 📚 Resources

- [React Performance](https://react.dev/learn/render-and-commit)
- [Next.js Optimization](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Convex Best Practices](https://docs.convex.dev/production/best-practices)
- [Web Vitals](https://web.dev/vitals/)

---

**Last Updated:** April 24, 2026  
**Maintained By:** Development Team
