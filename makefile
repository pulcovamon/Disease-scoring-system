.PHONY: requirements db setup clean-db stop-db start-db clean app reinstall

dotenv = env $(shell cat .env-dev | xargs)
PYTHON := $(shell pyenv which python)

# Install all Python and frontend dependencies
requirements:
	@echo "🐍 Creating virtual environment for DB..."
	$(PYTHON) -m venv db/.venv
	db/.venv/bin/pip install --upgrade pip
	db/.venv/bin/pip install -r db/requirements.txt

	@echo "🐍 Creating virtual environment for API..."
	$(PYTHON) -m venv api/.venv
	api/.venv/bin/pip install --upgrade pip
	api/.venv/bin/pip install -r api/requirements.txt

	@echo "🐍 Creating virtual environment for Worker..."
	$(PYTHON) -m venv worker/.venv
	worker/.venv/bin/pip install --upgrade pip
	worker/.venv/bin/pip install -r worker/requirements.txt

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
		mongo:latest

	@echo "📡 Starting Redis..."
	docker run -d \
		--name redis_server \
		-p 6379:6379 \
		redis:alpine

	@echo "🧠 Running database initialization script..."
	$(dotenv) db/.venv/bin/python db/init_db.py

# Start existing DB containers
start-db:
	@echo "▶️ Starting DB containers..."
	-docker start catalog_db redis_server

# Full setup (DB + requirements)
setup: db requirements
	@echo "✅ Setup complete!"

# Run the application services for development
app:
	@echo "🚀 Starting app with .env variables..."
	$(dotenv) npx concurrently \
		--names "API,WORKER,FRONTEND" \
		--prefix-colors "blue,green,magenta" \
		"api/.venv/bin/uvicorn api.main:app --port 8080 --reload" \
		"worker/.venv/bin/celery -A worker.tasks worker --loglevel=info" \
		"cd frontend && npm start"

# Clean only DB containers and volumes
clean-db:
	@echo "🧼 Stopping and removing containers..."
	-docker rm -f catalog_db redis_server

	@echo "🧼 Removing Docker volumes..."
	-docker volume rm patient_catalog_data redis_data

# Stop DB containers without removing
stop-db:
	@echo "🛑 Stopping DB containers..."
	-docker stop catalog_db redis_server

# Clean everything
clean: clean-db
	@echo "🧼 Removing virtual environments..."
	rm -rf db/.venv api/.venv worker/.venv

	@echo "🧼 Removing frontend dependencies..."
	cd frontend && rm -rf node_modules

	@echo "🧼 Removing model storage..."
	rm -rf model_storage/*

	@echo "✅ Full clean complete!"

# Install requirements again (without removing venv)
reinstall:
	@echo "📦 Reinstalling Python dependencies..."
	db/.venv/bin/pip install -r db/requirements.txt
	api/.venv/bin/pip install -r api/requirements.txt
	worker/.venv/bin/pip install -r worker/requirements.txt

	@echo "📦 Reinstalling frontend dependencies..."
	cd frontend && npm install
