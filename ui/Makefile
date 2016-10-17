
BUILDROOT := build
NPM_BIN := /usr/local/bin/npm

build-ui-plugin:
	@echo "building ui plugin"
	$(NPM_BIN) "install"
	grunt

clean-ui-plugin:
	@echo "*** Cleaning"
	@rm -rf node_modules
	@rm -rf $(BUILDROOT)
