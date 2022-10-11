export DB_HOST ?= postgres
export DB_PORT ?= 5432
export DB_USERNAME ?= postgres
export DB_PASSWORD ?= postgres
export PGPASSWORD ?= $(DB_PASSWORD)
export DB_ENTRY ?= psql -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USERNAME)


clean:
	@rm -rf ./dist

# Compile Typescript project
compile:
	npm run build

# Lint Typescript project
lint:
	npm run lint

# Build Typescript project
build: clean compile

start_server:
	node ./dist/server.js

dev_server:
	npm run dev

# Database Functions
wait-for-postgres:
	while ! nc -zv ${DB_HOST} ${DB_PORT}; do echo waiting for postgresql ..; sleep 1; done;

create-db:
	$(DB_ENTRY) ${DEFAULT_DB} -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_DATABASE}'" | grep -q 1 || $(DB_ENTRY) ${DEFAULT_DB} -c 'CREATE DATABASE "${DB_DATABASE}"';

drop-db: wait-for-db
	@$(DB_ENTRY) ${DEFAULT_DB} -c 'Drop DATABASE "${DB_DATABASE}"';

wait-for-db: wait-for-postgres
	while ! $(DB_ENTRY) ${DB_NAME} -c "select 1"; do echo postgresql starting ..; sleep 1; done;

set-up-db: wait-for-postgres create-db migrate-db dump-data

reset-db: wait-for-db drop-db create-db

init-db:
	@docker-compose up -d postgres

set-up-postgres: init-db set-up-db-backend

dump-data: 
	npm run typeorm:seed

migrate-db: 
	npm run typeorm:migrate

set-up-db-%:
	@docker-compose run --rm $* make set-up-db

start-dependencies:
	@docker-compose up -d mongo postgres redis

start-backend:
	@docker-compose up -d backend

