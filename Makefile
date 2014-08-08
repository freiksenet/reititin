OUT := build

package := ./package.json
deps := ./node_modules
deps_installed := $(deps)/installed

js_entry := reititin.js

browserify := $(deps)/browserify/bin/cmd.js

$(OUT):
	mkdir $(OUT)

$(deps_installed): $(package)
	npm install --silent
	touch $@

$(OUT)/reititin.js: $(js_entry) $(deps_installed) | $(OUT)
	$(browserify) $(js_entry) --standalone Reititin -o $@

$(OUT)/reititin.min.js: $(js_entry) $(deps_installed) | $(OUT)
	$(browserify) $(js_entry) -g uglifyify --standalone Reititin -o $@

dist: $(OUT)/reititin.js $(OUT)/reititin.min.js

.PHONY: clean
clean:
	rm -rf $(OUT)

.DEFAULT_GOAL := dist
