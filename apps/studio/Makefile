# Makefile for building and packaging the VS Code Extension

# --- Variables ---

# Staging directory for packaging
PACKED_DIR := packed

# Source directory for the webview build output
WEBVIEW_SRC := ../webview/build

# Destination directory for the webview build within the packed folder
WEBVIEW_DEST := $(PACKED_DIR)/details-webview/build

# Essential files usually needed at the root of the package
# Add any other essential files/globs like icons/*, schemas/* etc.
ROOT_FILES := package.json README.md CHANGELOG.md LICENSE.md

# Directories/files containing the build output from 'turbo run build'
# Adjust this list based on where your actual built JS/assets are located.
# Example: If build outputs to './out' and './dist', use ARTIFACTS := out dist
ARTIFACTS := out logos syntaxes

# --- Targets ---

# Default target: build and package the extension
.PHONY: all
all: package

# 1. Run the main build command
# We create a sentinel file to mark completion for dependency tracking
.PHONY: build
build: .build_complete

.build_complete:
	@echo "--- Running Turbo Build ---"
	npx turbo run build
	@touch $@

# Create the base 'packed' directory (order-only prerequisite)
# Ensures the directory exists before trying to copy into it
$(PACKED_DIR):
	@echo "--- Creating directory: $(PACKED_DIR) ---"
	mkdir -p $(PACKED_DIR)

# 3. Copy the webview build output
# Uses a sentinel file inside the destination for dependency tracking
$(WEBVIEW_DEST)/.webview_copied: $(WEBVIEW_SRC) | $(PACKED_DIR)
	@echo "--- Copying Webview Build ---"
	@echo "Source:      $(WEBVIEW_SRC)"
	@echo "Destination: $(WEBVIEW_DEST)"
	@# Ensure destination parent directory exists
	mkdir -p $(WEBVIEW_DEST)
	@# Use rsync for efficient copy; --delete ensures the destination matches the source exactly
	rsync -a --delete $(WEBVIEW_SRC)/ $(WEBVIEW_DEST)/
	@touch $@

# 2. Copy project artifacts (metadata, build outputs) to 'packed'
# Uses a sentinel file for dependency tracking
$(PACKED_DIR)/.project_copied: .build_complete $(ROOT_FILES) | $(PACKED_DIR)
	@echo "--- Copying Project Artifacts ---"
	@echo "Destination: $(PACKED_DIR)"
	@# Copy essential root files
	cp $(ROOT_FILES) $(PACKED_DIR)/
	@echo "Copied root files: $(ROOT_FILES)"
	@# Copy build artifact directories/files if they exist
	$(foreach artifact,$(ARTIFACTS), \
		if [ -e "$(artifact)" ]; then \
			echo "Copying artifact: $(artifact)"; \
			cp -r $(artifact) $(PACKED_DIR)/; \
		else \
			echo "Warning: Build artifact '$(artifact)' not found, skipping copy."; \
		fi; \
	)
	@touch $@

# Aggregate target for preparing the packed directory completely
.PHONY: prepare_packed
prepare_packed: $(PACKED_DIR)/.project_copied $(WEBVIEW_DEST)/.webview_copied

# 4. Run vsce package, copy the result, and clean up
.PHONY: package
package: prepare_packed
	@echo "--- Packaging Extension ---"
	@echo "Running vsce in: $(PACKED_DIR)"
	cd $(PACKED_DIR) && npx vsce package --allow-missing-repository --no-dependencies
	@echo "--- Package created in $(PACKED_DIR)/ ---"
	@echo "--- Copying .vsix file to current directory ---"
	@# Use a wildcard to find the generated vsix file (assumes only one)
	cp $(PACKED_DIR)/dyad-studio-*.vsix .
	@echo "Copied .vsix file."
	@echo "--- Cleaning up build artifacts ---"
	$(MAKE) clean # Call the clean target defined below

# Clean up generated files and directories
.PHONY: clean
clean:
	@echo "--- Cleaning Up ---"
	rm -rf $(PACKED_DIR)
	rm -f .build_complete $(WEBVIEW_DEST)/.webview_copied $(PACKED_DIR)/.project_copied # Also remove sentinel files
	@echo "Cleanup complete."