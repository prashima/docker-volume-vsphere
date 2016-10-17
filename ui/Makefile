
BUILDROOT := build
NPM_BIN := /usr/local/bin/npm

.PHONY:build-all clean

build-all:
	@echo "building ui plugin"
	$(NPM_BIN) "install"
	@grunt

clean:
	@echo "*** Cleaning"
	@rm -rf node_modules
	@rm -rf $(BUILDROOT)
