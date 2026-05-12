.PHONY: requirements db setup clean-db stop-db start-db clean app reinstall docs-serve docs-build anonymize-catalog

dotenv = env $(shell grep -v '^\s*#' .env-dev | grep -v '^\s*$$' | xargs)
PYTHONPATH_ROOT = $(CURDIR)
NODE_LOCALSTORAGE_FILE = $(CURDIR)/.node-localstorage

# Install all Python and frontend dependencies
requirements:
	@echo "🐍 Syncing dependencies for DB (uv)..."
	cd db && uv sync

	@echo "🐍 Syncing dependencies for API (uv)..."
	cd api && uv sync

	@echo "🐍 Syncing dependencies for Worker (uv)..."
	cd worker && uv sync

	@echo "🌐 Installing frontend dependencies..."
	cd frontend && npm install

	@echo "🧩 Setting up root Node.js tools (concurrently)..."
	if [ ! -f package.json ]; then npm init -y; fi
	npm install --save-dev concurrently

# Start and seed DB containers
db:
	@echo "🗄️ Starting MongoDB..."
	docker run -d \
		--name catalog_db \
		-p 27017:27017 \
		-e MONGO_INITDB_ROOT_USERNAME=root \
		-e MONGO_INITDB_ROOT_PASSWORD=pass \
		-e MONGO_INITDB_DATABASE=catalog_db \
		-v patient_catalog_data:/data/db \
		mongo:7.0

	@echo "📡 Starting Redis..."
	docker run -d \
		--name redis_server \
		-p 6379:6379 \
		redis:alpine

	@echo "🧠 Running mongo initialization script..."
	$(dotenv) uv run --directory db init_mongo.py

	@echo "🛢️ Starting MySQL..."
	docker run -d \
		--name mysql_server \
		-p 3306:3306 \
		-e MYSQL_ROOT_PASSWORD=pass \
		-e MYSQL_DATABASE=scoring_system \
		-v mysql_data:/var/lib/mysql \
		mysql:8.0

	@echo "🧠 Running mysql initialization script..."
	$(dotenv) PYTHONPATH=$(PYTHONPATH_ROOT) uv run --directory api -m api.auth.init_mysql

	@echo "🔍 Starting elasticsearch"
	docker run -d --name elasticsearch \
		-p 9200:9200 -p 9300:9300 \
		-e "discovery.type=single-node" \
		-e "xpack.security.enabled=false" \
		elasticsearch:8.11.1

	@echo "🧠 Indexing codes to Elasticsearch..."
	$(dotenv) PYTHONPATH=$(PYTHONPATH_ROOT) uv run --directory db init_es.py

# Start existing DB containers
start-db:
	@echo "▶️ Starting DB containers..."
	-docker start catalog_db redis_server mysql_server elasticsearch

# Full setup (DB + requirements)
setup: db requirements
	@echo "✅ Setup complete!"

# Run the application services for development
app:
	@echo "🚀 Starting app with .env variables..."
	@touch $(NODE_LOCALSTORAGE_FILE)
	$(dotenv) npx concurrently \
		--names "API,WORKER,FLOWER,FRONTEND" \
		--prefix-colors "blue,green,yellow,magenta" \
		"PYTHONPATH=$(PYTHONPATH_ROOT) uv run --directory api uvicorn api.main:app --port 8080 --reload" \
		"PYTHONPATH=$(PYTHONPATH_ROOT) uv run --project worker celery -A worker.tasks worker --loglevel=info" \
		"sleep 3 && PYTHONPATH=$(PYTHONPATH_ROOT) uv run --project worker celery -A worker.tasks flower --port=5555" \
		"export NODE_OPTIONS=--localstorage-file=$(NODE_LOCALSTORAGE_FILE); cd frontend && npm run dev"

# Clean only DB containers and volumes
clean-db:
	@echo "🧼 Stopping and removing containers..."
	-docker rm -f catalog_db redis_server mysql_server elasticsearch

	@echo "🧼 Removing Docker volumes..."
	-docker volume rm patient_catalog_data mysql_data

	@echo "🧼 Removing model storage..."
	rm -rf model_storage/*

# Stop DB containers without removing
stop-db:
	@echo "🛑 Stopping DB containers..."
	-docker stop catalog_db redis_server mysql_server elasticsearch

# Clean everything
clean: clean-db
	@echo "🧼 Removing virtual environments..."
	rm -rf db/.venv api/.venv worker/.venv

	@echo "🧼 Removing frontend dependencies..."
	cd frontend && rm -rf node_modules

	@echo "✅ Full clean complete!"

# Install requirements again (without removing venv)
reinstall:
	@echo "📦 Resyncing Python dependencies with uv..."
	cd db && uv sync
	cd api && uv sync
	cd worker && uv sync

	@echo "📦 Reinstalling frontend dependencies..."
	cd frontend && npm install

# Serve documentation locally (http://localhost:8000)
docs-serve:
	@echo "📖 Installing docs dependencies..."
	cd docs && uv sync
	@echo "📖 Serving docs at http://localhost:8000 ..."
	cd docs && uv run --no-sync mkdocs serve --config-file ../mkdocs.yml

# Anonymize patient catalog (shuffle codes + replace IDs) for privacy / screenshots
anonymize-catalog:
	@echo "🔀 Anonymizing patient catalog..."
	$(dotenv) uv run --directory db anonymize_catalog.py
	@echo "✅ Catalog anonymized."

# Build static documentation site
docs-build:
	@echo "📖 Installing docs dependencies..."
	cd docs && uv sync
	@echo "📖 Building docs..."
	cd docs && uv run --no-sync mkdocs build --config-file ../mkdocs.yml
