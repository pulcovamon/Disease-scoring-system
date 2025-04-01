# Scoring System

## Run in docker compose
### DEV
```
docker-compose -f docker-compose-dev.yml up -d --build
```
### PROD
```
docker-compose up -d --build
```

## Run with makefile
### Setup
- Install python and ts requirements
```
make requirements (also creates venv, runs npm init and so on)
```
- Create db containers and run init scripts
```
- Reinstall python and ts requirements
```
make reinstall
```
make db
```
- Start existing db containers
```
make start-db
```
- Whole setup (requirements + db)
```
make setup
```

### Run app
Run api, worker and frontend services using live server
```
make app
```

### Cleanup
- Stop database containers
```
make stop-db
```
- Stop and remove db containers and volumes
```
make clean-db
```
- Remove db containers and volumes and also all venvs and node modules
```
make clean
```