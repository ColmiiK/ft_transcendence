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

repopulate:
		@docker exec -it back node -e 'require("./api/dev/dummy.js").createDebug();'

re: clean all

db:
		@docker exec -it back sqlite3 transcendence.db

reset:
		@echo -n "Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]
		@docker compose -f ./docker-compose.yml stop -t 1 backend
		@rm -f ./srcs/backend/transcendence.db
		@find ./srcs/backend/api/avatars/ ! -name 'default.jpg' -type f -exec rm -f {} +
		@echo -n "Repopulate with mockup data? [y/N] " && read ans && [ $${ans:-N} = y ]
		@make back && sleep 1
		@make repopulate

.PHONY: all attach front back build down stop clean repopulate reset re db
