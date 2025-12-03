# Use a lightweight official Nginx image
FROM nginx:alpine

# 1. Remove the default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# 2. Copy your custom Nginx configuration
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# 3. Copy your exported FlutterFlow 'web' build
COPY frontend/web /usr/share/nginx/html
