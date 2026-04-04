# File Serialization & I/O

covrd enforces a privacy-first model, which means all data exchange must happen locally. Our file I/O utility layer is responsible for parsing and hydrating URL compression parameters, generating standalone export JSONs, and dumping grid data to comma-separated values (CSV) for print logic.

## Rationale & Abstraction

When designing the core serialization mechanisms, I began by determining whether these should live inside our Zustand stores or operate independently. I ended up deciding to isolate our serialization inside pure utility functions (e.g., `src/utils/exportSchedule.ts` and `src/utils/urlState.ts`).

By treating File I/O completely independently of Zustand:

- We can easily unit test parsing/serialization functions with 100% logic coverage, completely disconnected from React runtime constraints.
- We ensure malicious data uploads are validated via strict structural validation algorithms _before_ touching application memory.

## Format Versioning

The exported JSON is stamped with an internal schemas `EXPORT_VERSION` attribute:

```typescript
{
  version: 1, // Determines parser requirements moving forward
  exportedAt: "2026-04-03T20:30:00.000Z",
  employees: [...],
  ...
}
```

By ensuring version stamps inside the I/O layer, if we introduce breaking schema iterations in V2.0, our `deserializeScheduleJSON` utility will gracefully reject or migrate older payloads without causing unexpected Zustand panics.

## CSV Architecture

The `serializeScheduleCSV` function converts our schedule metadata into flattened tabular output, specifically formatting the rows into:
`Day, Start, End, Employee, Role`

I decided to include a dynamic payload flag (`includeAllData`) that allows the generator to dump ecosystem properties (Employee restrictions, Targets, etc.) as stacked tables on top of the base schedule assignment, simplifying cross-compatible printing.
