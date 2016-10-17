
BUILDROOT := build
NPM_BIN := /usr/local/bin/npm

.PHONY:build-all clean

build-all:
  # build the docker-volume-plugin
	@echo "building ui plugin"
	$(NPM_BIN) "install"
	@grunt
  # files are copied over in esx_service

clean:
	@echo "*** Cleaning"
	@rm -rf node_modules
	@rm -rf $(BUILDROOT)
