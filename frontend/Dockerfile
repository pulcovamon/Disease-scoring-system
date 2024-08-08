# Use an official Node runtime as a parent image
FROM node:alpine as build

# Set the working directory to /app
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the React app
RUN npm run build

# Use an official Nginx runtime as a parent image
FROM nginx:alpine

# Copy the Nginx configuration to the container
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Copy the React app build files to the container
COPY --from=build /app/build /usr/share/nginx/html

# Start Nginx when the container starts
CMD ["nginx", "-g", "daemon off;"]
