# Song timing audit

The seeded catalogue currently contains 35 course-level songs or studies. The normalized request referenced 50, so 15 expected entries are not present in the repository and cannot be audited or migrated.

| Status                  | Count | Meaning                                                                             |
| ----------------------- | ----: | ----------------------------------------------------------------------------------- |
| Ready                   |     1 | Complete Ode to Joy has reviewed beat positions, durations, 4/4 meter, and 120 BPM. |
| Needs transcription     |    34 | Only ordered prompts are present; rhythm cannot be recovered accurately.            |
| Missing from repository |    15 | Referenced by the requested total but absent from the seed catalogue.               |

The full per-course JSON report is generated read-only from current seed data:

```bash
npm run audit:songs -w @piano360/api
```

Every non-timeline record is classified as `note-list` / `needs-transcription`. No equal-duration timing is generated automatically.
