FROM php:8.4-cli-alpine

# Install system utilities and libraries
RUN apk add --no-cache \
    bash \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    git

# Install PHP core extensions needed by Laravel
RUN docker-php-ext-install pdo pdo_mysql bcmath

# Copy Composer from the official image
COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy all backend source code
COPY . .

# Run production composer install (ignoring dev testing libraries to prevent build weight/errors)
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Make artisan executable
RUN chmod +x artisan

# Expose target port
EXPOSE 8080

# Automatically migrate database and seed data on startup, then start server
CMD php artisan migrate --seed --force && php artisan serve --host=0.0.0.0 --port=8080
