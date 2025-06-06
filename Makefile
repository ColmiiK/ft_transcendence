all:
		@HOSTNAME_FQDN=$$(hostname -f) docker compose -f ./docker-compose.yml up --build -d

attach:
		@docker compose -f ./docker-compose.yml up --build

front:
		@docker compose -f ./docker-compose.yml up frontend --build -d

back:
		@docker compose -f ./docker-compose.yml up backend --build -d

build:
		@docker compose -f ./docker-compose.yml build

down:
		@docker compose -f ./docker-compose.yml down -t 1

stop:
		@docker compose -f ./docker-compose.yml stop -t 1

clean: down
		@docker system prune -a -f
		@rm -rf ./srcs/backend/node_modules
		@rm -rf ./srcs/frontend/node_modules

re: clean all

db:
		@docker exec -it back sqlite3 transcendence.db

.PHONY: all attach front back build down stop clean re db
