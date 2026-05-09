.PHONY: dev build start kill clean

# Run the Next.js development server
dev:
	npm run dev

# Build the production application
build:
	npm run build

# Start the production server (must run 'make build' first)
start:
	npm run start

# Find and force-kill the Next.js process running on port 3000
kill:
	@echo "Killing any process running on port 3000..."
	-lsof -t -i:3000 | xargs kill -9 2>/dev/null || echo "No process found on port 3000."
	@echo "Done."

# Clean Next.js cache and reinstall dependencies
clean:
	rm -rf .next
	rm -rf node_modules
	npm install
