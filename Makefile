all:
		@docker compose -f ./srcs/docker-compose.yml up --build -d

attach:
		@docker compose -f ./srcs/docker-compose.yml up --build

front:
		@docker compose -f ./srcs/docker-compose.yml up frontend --build -d

back:
		@docker compose -f ./srcs/docker-compose.yml up backend --build -d

build:
		@docker compose -f ./srcs/docker-compose.yml build

down:
		@docker compose -f ./srcs/docker-compose.yml down

clean: down
		@docker system prune -a -f

test:
		@docker exec -it back python manage.py test --parallel --shuffle --failfast --buffer
testall:
		@docker exec -it back python manage.py test --parallel --shuffle --buffer

repopulate:
		@docker exec -it back python manage.py mockup


reset:
		@echo -n "Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]
		@docker exec -it back python manage.py hard_reset
		@echo -n "Repopulate with mockup data? [y/N] " && read ans && [ $${ans:-N} = y ]
		@make repopulate

.PHONY: all attach front back build down clean test testall repopulate reset
