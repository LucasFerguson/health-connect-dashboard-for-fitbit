# Health data audit logs

Read-only health-data analysis tools can write append-only JSON Lines files here. Each line records the analysis performed and the observations involved.

The application does not delete overlapping sleep records. An earlier dry-run analysis used deletion-oriented terminology, but it made no database changes. Overlapping records from different devices are preserved and reconciled only in the presentation model.

The generated `*.jsonl` files can contain private health information and are intentionally excluded from Git. Back them up with the same protections as the health database.
