# Phase 1 — Problem definition

The system ranks unrated films from explicit ratings. The input, output and functional requirements are documented in `problem_definition/`. User IDs are treated as strings so MovieLens users and WatchWise account identifiers can share the same rating table. Cold-start recommendations use observed catalog averages/popularity and are labeled `popular` by the service.
