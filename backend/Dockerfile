# Use the official Node.js version 20 image based on Alpine Linux (a lightweight distribution).
# This gives us Node.js and npm preinstalled in a small, efficient base image.
FROM node:20-alpine

# Set the working directory inside the container to /app.
WORKDIR /app

# Copy package.json and package-lock.json (if present) into the container.
# to add dependencies in the container.
COPY package*.json ./

# Install all dependencies listed in package.json using npm.
# Doing this before copying the rest of the code helps leverage Docker’s caching
RUN npm install

# Copy the source code, configs, and other assets files into the container’s /app directory.
# This includes your source code, configs, and other assets.
COPY . .

# Expose port 3000 to the outside.
EXPOSE 3000

# Define the default command to run when the container starts.
# it runs "npm run dev", which starts a development server.
CMD ["npm", "run", "dev"]