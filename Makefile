SCSS_DIR = css
CSS_DIR = css

# Build CSS from SCSS
css: $(SCSS_DIR)/styles.scss
	sass $(SCSS_DIR)/styles.scss $(CSS_DIR)/styles.css

# Run a local server
serve:
	python3 -m http.server

.PHONY: css serve
