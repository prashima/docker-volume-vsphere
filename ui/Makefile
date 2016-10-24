
.PHONY: build-all clean

build-all:
	@echo "Running $@"
	@echo "npm install ..."
	npm install
	@echo "grunt ..."
	grunt

clean:
	@echo "Running $@"
	rm -rf ./build
	rm -rf ./node_modules

default: build-all
