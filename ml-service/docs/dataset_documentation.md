# Phase 2 — Dataset collection

`dataset/dataset_downloader.py` downloads the official GroupLens MovieLens Latest Small ZIP only when the required local CSVs are absent (or explicitly refreshed). The four required files are `movies.csv`, `ratings.csv`, `tags.csv`, and `links.csv`. `dataset_validator.py` checks their columns and row counts. `dataset_mapper.py` contains ID mapping and application-rating merge helpers. `server/scripts/importMovieLens.js` imports movie catalog rows and aggregates dataset ratings into MongoDB. The source data has no poster or cast images.

Record the download date and cite GroupLens in academic submissions. Treat the dataset's own usage and redistribution terms as authoritative.
