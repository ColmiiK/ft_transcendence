all:
		@docker-compose -f ./srcs/docker-compose.yml up --build -d

attach:
		@docker-compose -f ./srcs/docker-compose.yml up --build

build:
		@docker-compose -f ./srcs/docker-compose.yml build

down:
		@docker-compose -f ./srcs/docker-compose.yml down

clean: down
		@docker system prune -a -f

.PHONY: all attach build down clean
