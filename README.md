# WatchWise — beginner setup and project guide

WatchWise is a movie discovery project built with React, Express, MongoDB and a Python collaborative-filtering service. This guide explains what each part does and how to start it locally on Windows. The academic notes and model code stay in the backend and ML service; the website is a normal movie discovery app.

## 1. Understand the pieces before you start

| Part | Folder | What it does |
| --- | --- | --- |
| Website | `client/` | Pages and controls people use in their browser. React asks the API for movies and account data. |
| Web API | `server/` | Checks requests, signs users in, reads and writes MongoDB records, and calls the recommender. |
| Database | MongoDB | Stores accounts, movie catalog records, ratings, saved movies and viewing history. |
| Recommender | `ml-service/` | Downloads MovieLens, prepares ratings, finds similar users/items, and returns ranked recommendations. |
| Local movie artwork | `client/public/assets/movies/` | Holds artwork files served by the website from this project. MovieLens itself does not include posters. |

When somebody rates a movie, the browser sends that rating to the Express API. The API saves it in MongoDB. In the Vercel deployment, recommendation code runs in the same serverless API and uses real WatchWise ratings when there is enough overlap; otherwise it returns a labeled catalog-based cold-start list. The offline Python service supports the MovieLens experiments documented below.

```text
Browser (React)  →  Vercel (Vite + Express API functions)  →  MongoDB Atlas

Offline academic workflow: MovieLens CSV files → Python preprocessing, models, and evaluation
```

## 2. Install the tools

Install these before running the project:

1. **Node.js and npm.** Install the current LTS release from the [official Node.js download page](https://nodejs.org/en/download/). npm is included with Node.js.
2. **Python 3.11, 3.12, or 3.13.** During Windows installation, enable the option that adds Python to PATH. Check in PowerShell with `python --version`.
3. **MongoDB.** For a beginner setup, create a free development cluster using the [MongoDB Atlas free cluster guide](https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/). A local MongoDB Community installation also works.
4. **A code editor.** VS Code is convenient, but not required.

Open the WatchWise project folder in VS Code. In its menu choose **Terminal → New Terminal**. Commands below assume that terminal starts in the project root (the folder containing this `README.md`). To confirm, run:

```powershell
Get-Location
Get-ChildItem
```

You should see `client`, `server`, and `ml-service` in the listing. If not, use `cd "C:\path\to\movie recommendation"` with the actual folder path.

## 3. Create your MongoDB database

For Atlas:

1. Create an Atlas account and a project, then create a **Free** cluster.
2. In Atlas, create a **database user** and save its username and password somewhere private. This is separate from your Atlas website login.
3. In **Network Access**, allow your current IP address for development.
4. Open **Connect → Drivers** and copy the connection string. Replace the password placeholder with the database user's password and set the database name to `watchwise`, for example:

   `mongodb+srv://DB_USER:DB_PASSWORD@your-cluster.example.mongodb.net/watchwise?retryWrites=true&w=majority`

   If the password contains URL characters such as `@`, `/`, `:` or `#`, URL-encode those characters before inserting it into the connection string.

5. Keep this connection string private. Do not put it in React files or commit it to Git.

Atlas's menus can change. If the steps differ, use its [current create/connect documentation](https://www.mongodb.com/docs/atlas/create-connect-deployments/).

## 4. Configure the private settings

Copy the templates using PowerShell from the project root:

```powershell
Copy-Item server/.env.example server/.env
Copy-Item ml-service/.env.example ml-service/.env
```

Open `server/.env` and set:

- `MONGODB_URI` to your Atlas connection string (or the local MongoDB address).
- `JWT_SECRET` to a long, private random string. This signs login tokens.
- `ML_SERVICE_TOKEN` to a second long, private random string.
- `ADMIN_EMAIL` to the email you will use for the admin account.
- `ADMIN_PASSWORD` to a strong private password for that account.
- Leave the local `CLIENT_ORIGIN`, `ML_SERVICE_URL` and `IMAGE_UPLOAD_DIR` values as they are for local development.

Open `ml-service/.env` and set `ML_SERVICE_TOKEN` to the **same** value as in `server/.env`. The token lets only your backend call private training, evaluation and rating-sync endpoints.

The repository also contains a root `.env.example` as a reminder. The Node service reads `server/.env`; the Python service reads `ml-service/.env`. Never commit either actual `.env` file.

## 5. Install the JavaScript packages

Run each command from the project root. The first installs the root development command; the other two install website and API packages:

```powershell
npm install
npm install --prefix server
npm install --prefix client
```

If PowerShell says `npm` is not recognized, close and reopen VS Code after installing Node.js, then check `node --version` and `npm --version`.

## 6. Set up the Python recommender

Create a private virtual environment for this project. A virtual environment keeps WatchWise's Python packages separate from other Python projects:

```powershell
python -m venv ml-service/.venv
ml-service/.venv/Scripts/python.exe -m pip install --upgrade pip
ml-service/.venv/Scripts/python.exe -m pip install -r ml-service/requirements.txt
```

If Python is installed under a version-specific launcher, `py -3.13 -m venv ml-service/.venv` is an alternative to the first command. Use the matching installed version number.

## 7. Download and import MovieLens

The project uses GroupLens' official **MovieLens Latest Small** data. Download it once with:

```powershell
ml-service/.venv/Scripts/python.exe ml-service/download_dataset.py
```

This checks for the four expected CSV files and downloads the official archive only if they are missing. It does not fetch posters because MovieLens does not include them. Dataset credits and file descriptions are in [the dataset documentation](ml-service/docs/dataset_documentation.md).

To refresh an already downloaded copy later, run `ml-service/.venv/Scripts/python.exe ml-service/download_dataset.py --update`. To import movie titles, genres, release years and calculated rating summaries into MongoDB:

```powershell
npm run import:movies
```

You should see an `Imported … MovieLens movie records.` message. If this step fails, check that the dataset download finished and that `MONGODB_URI` is correct and reachable.

## 8. Start the services

Keep **two terminals** open in VS Code. All commands start from the project root.

**Terminal 1 — recommender:**

```powershell
ml-service/.venv/Scripts/python.exe -m uvicorn ml_service.main:app --reload --port 8000
```

**Terminal 2 — website and API:**

```powershell
npm run dev
```

This starts the Express API on port 5000 and Vite website on port 5173. If the combined command fails, start them separately with `npm run dev --prefix server` and `npm run dev --prefix client` in their own terminals.

After both terminals report that they are running, open the website in your browser:

Visit [http://localhost:5173](http://localhost:5173). Keep both server terminals running while you use it.

## 9. Check that each piece is running

Open these addresses in a browser:

- [http://localhost:5173](http://localhost:5173) — WatchWise website.
- [http://localhost:5000/health](http://localhost:5000/health) — API health; database should say `connected`.
- [http://localhost:8000/health](http://localhost:8000/health) — recommender health.
- [http://localhost:8000/docs](http://localhost:8000/docs) — FastAPI's developer API reference. Private routes require the service token.

If the website says the catalog is empty, repeat Step 7 after checking the API health response. If personalized rows do not load, check the recommender terminal and confirm the matching `ML_SERVICE_TOKEN` values in both `.env` files.

## 10. Create accounts and try the features

1. Open **Join free** and create an account. Choose a few favorite genres if you like; that is optional.
2. Browse movies and open a detail page.
3. Save a movie to your watchlist and mark it watched.
4. Rate several movies. Ratings are stored against your account and synced to the recommender.
5. Visit **My space** to see recommendations and your recent activity. The initial recommendations are based on actual MovieLens popularity; the service begins using user-based or item-based collaborative filtering after it has enough ratings for your user.
6. To create the admin account, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the private `server/.env`, then run `npm run seed:admin --prefix server` once. Sign in with that email and password. Normal public sign-up never grants admin access based on an email string.

MovieLens does not contain plot descriptions, cast lists, runtimes, trailers, or artwork. WatchWise leaves those fields blank and uses a locally stored placeholder image until you add rights-cleared local files. Do not paste external poster URLs into the database.

## 11. How to add a properly licensed movie image

Find or create artwork that you have permission to use. Keep its attribution with the project and place licensed local files under `client/public/assets/movies/posters/` or `backdrops/`. Missing images use the included local placeholder. Admin uploads work only in local development with a writable filesystem; the Vercel serverless deployment intentionally rejects uploads because its filesystem is not persistent. Add a persistent storage provider and an attribution workflow before enabling hosted uploads.

## 12. What the seven academic phases mean in this codebase

They are documented in `ml-service/docs/` and implemented as backend modules. They are not website steps or public pages.

1. **Problem definition** — specify what information enters the recommender and what a good recommendation should do.
2. **Dataset collection** — download, validate and map GroupLens files.
3. **Preprocessing** — clean rows, check rating ranges, and create sparse rating matrices.
4. **Model development** — calculate user-user or item-item cosine similarities and rank unrated movies.
5. **Performance evaluation** — hold out ratings and calculate metrics from actual predictions.
6. **Optimization** — compare neighborhood sizes and similarity thresholds using evaluation results.
7. **Result analysis** — save model versions, timing logs and generated evaluation reports.

No evaluation numbers are bundled as if they were measured. To run an evaluation after the dataset is downloaded, open a new PowerShell terminal and call the protected FastAPI route (replace the example token with the private value you configured):

```powershell
$headers = @{ "x-service-token" = "YOUR_ML_SERVICE_TOKEN" }
Invoke-RestMethod -Method Post -Uri http://localhost:8000/recommendations/evaluate -Headers $headers
```

An actual run can take a while because it evaluates held-out ratings. Reports are written under `ml-service/results/`.

## 13. Folder map

```text
client/src/pages/              Website screens
client/src/components/         Shared navigation, cards, and session state
client/public/assets/movies/   Local posters, backdrops, cast, placeholders
server/src/routes/api.js       Express API routes
api/index.js                   Vercel serverless API entry point
vercel.json                    Root deploy and routing configuration
server/src/models/             MongoDB/Mongoose schemas
server/scripts/                MovieLens-to-MongoDB importer
server/data/                   Local image mapping
ml-service/dataset/            Download, validate, load, and map CSV files
ml-service/preprocessing/      Clean data and prepare ratings
ml-service/recommendation/     User/item collaborative filtering
ml-service/evaluation/         Holdout split and ranking/regression metrics
ml-service/optimization/       Model configuration and tuning helpers
ml-service/results/            Actual reports and timing logs
ml-service/docs/               Academic project documentation
```

## 14. Explain the database part in your ADBMS presentation

WatchWise uses MongoDB documents connected by references. `Rating` and `Watchlist` act like relationship tables: each document points to one user and one movie. This avoids copying the user's name or movie title into every rating record.

```mermaid
erDiagram
  USER ||--o{ RATING : submits
  MOVIE ||--o{ RATING : receives
  USER ||--o{ WATCHLIST : saves
  MOVIE ||--o{ WATCHLIST : appears_in
  USER ||--o{ VIEWING_HISTORY : views
  MOVIE ||--o{ VIEWING_HISTORY : appears_in
  USER {
    ObjectId _id PK
    string name
    string email UK
    string password
    string role
  }
  MOVIE {
    ObjectId _id PK
    int movieLensId UK
    string title
    string[] genres
    float averageRating
  }
  RATING {
    ObjectId userId FK
    ObjectId movieId FK
    float rating
    datetime updatedAt
  }
  WATCHLIST {
    ObjectId userId FK
    ObjectId movieId FK
    boolean watched
  }
  VIEWING_HISTORY {
    ObjectId userId FK
    ObjectId movieId FK
    datetime viewedAt
  }
```

Database concepts to explain using the code:

- **Keys and constraints:** Mongoose assigns each document an ObjectId. Emails and MovieLens IDs are unique. A compound unique index on `(userId, movieId)` prevents duplicate ratings and duplicate watchlist entries.
- **References:** `userId` and `movieId` are references. API reads use `populate()` when a screen needs the related movie.
- **Indexes:** title text search, genre/year filtering, rating order, user/movie uniqueness, and viewing history order have indexes in the model files. Indexes speed common reads while taking some extra disk on writes.
- **Aggregation:** rating summaries use `$group` to calculate averages/counts. Admin statistics use `$group`, `$lookup`, and `$unwind` to combine relationship and movie records.
- **Validation:** Mongoose and Zod check required fields, email format, image paths, and rating bounds before data is saved.
- **Security:** passwords are bcrypt hashes; API responses never contain password fields. JWTs identify a signed-in user, and an admin middleware checks roles.
- **Consistency trade-off:** a user rating and the updated movie summary are two writes. For a larger deployment, move those writes to a MongoDB transaction on a replica set or derive summaries asynchronously. The MovieLens dataset summary is kept separately from WatchWise ratings so one account's rating does not overwrite the source dataset average.

Useful code to read in order: `server/src/models/User.js`, `Movie.js`, `Rating.js`, `Watchlist.js`; then `server/src/routes/api.js`; finally `server/scripts/importMovieLens.js`.

## 15. Run the checks

Install the Python requirements and download MovieLens first (Steps 6–7), then run the recommender unit checks from the project root:

```powershell
ml-service/.venv/Scripts/python.exe -m unittest discover -s ml-service/tests -v
python server/scripts/validateMovieImages.py
npm run build --prefix client
```

The first command checks data cleaning, rating bounds, both collaborative-filtering strategies, and metric calculations. The image checker validates local mapping paths and basic file signatures. The frontend build checks that Vite can compile the React app.

Then start the local services (Step 8) and do a manual browser walk: register, sign in, search and filter a movie, open its detail, rate it, save/remove it from the watchlist, mark it watched, edit profile genres, and open the admin page using the seeded admin account. Check the API and ML `/health` pages as well. For a real rating evaluation, follow Step 12 and inspect the generated reports.

## 16. Vercel and Atlas deployment

The repository root contains a Vercel configuration for the Vite client and an Express API function. MongoDB Atlas stores durable application data; the Python MovieLens research service remains an optional local/offline academic tool and is not required at request time.

1. Create a MongoDB Atlas database and allow connections from the deployment. Create a database user with access only to the WatchWise database.
2. Import the MovieLens catalog into Atlas from a local machine with the explicit `npm run import:movies` workflow.
3. Import the repository into Vercel using the repository root as the project root. The root `vercel.json` builds `client/` and routes `/api/*` to the Express function.
4. Add `MONGODB_URI` and a unique, long random `JWT_SECRET` in Vercel's **Production** and **Preview** environments. Set `CLIENT_ORIGIN` if using a custom domain. These values are server-side only; do not define them with a `VITE_` prefix.
5. Deploy. Verify `/api/health`, registration/login, catalog browsing, and a private page using an Atlas-backed deployment.

Sessions use an HTTP-only, same-site cookie. Viewing history stores movie detail views and watched events, users can clear it from the dashboard, and MongoDB expires events after 30 days. Vercel recommendations use WatchWise ratings for user-based collaborative filtering when sufficient overlapping ratings exist. Otherwise, the API labels the result as a cold-start popularity list and uses imported catalog rating summaries. Similar titles use genre overlap. The offline Python service retains MovieLens user/item collaborative filtering and evaluation scripts for academic experiments.

No hosted image uploads are enabled because Vercel function disks are temporary. Keep the included placeholders or commit properly licensed local image files with attribution. The old `render.yaml` is retained for optional local/academic Python service hosting, not required for the production web app.

Do not claim a live deployment until Vercel reports a successful build and the API, database, and account flow have been checked. The owner's Atlas URI and session secret must be entered in the Vercel dashboard.

## 17. Troubleshooting

- **`npm` is not recognized:** install Node.js LTS, reopen the terminal, check `node --version`.
- **Python package install fails:** check `python --version`; recreate the venv if it was made with a different Python install.
- **MongoDB server selection timeout:** verify the Atlas database user/password, IP allowlist, connection string, and network access.
- **`Dataset unavailable`:** run the dataset download command once and inspect the four CSV files in `ml-service/dataset/ml-latest-small/`.
- **No posters:** this is expected until an admin adds properly licensed local artwork; placeholder images are intentional.
- **No recommendations:** confirm the ML service health page and shared token, then rate multiple catalog movies.
- **Port already in use:** stop the previous server with `Ctrl+C` or change that service's port and its corresponding URL setting.

## 18. Academic references and data credit

MovieLens data is provided by GroupLens Research at the University of Minnesota. Cite the dataset and describe the specific version used in your report. See [GroupLens MovieLens datasets](https://grouplens.org/datasets/movielens/) and the project's internal [dataset notes](ml-service/docs/dataset_documentation.md). Follow the applicable MovieLens terms for academic use and redistribution.
